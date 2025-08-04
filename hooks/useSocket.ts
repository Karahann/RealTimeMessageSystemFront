import { useEffect, useState, useRef, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import {
  SocketMessage,
  SocketUserStatus,
  SocketTyping,
  SocketJoinRoom,
  SocketSendMessage,
} from "@/lib/types";
import { UserService } from "@/lib/services/users";

interface UseSocketProps {
  token: string | null;
  serverUrl?: string;
}

interface UseSocketReturn {
  socket: Socket | null;
  isConnected: boolean;
  onlineUsers: string[];
  joinRoom: (conversationId: string) => void;
  sendMessage: (conversationId: string, content: string) => void;
  startTyping: (conversationId: string) => void;
  stopTyping: (conversationId: string) => void;
  onMessage: (callback: (data: SocketMessage) => void) => void;
  onUserOnline: (callback: (data: SocketUserStatus) => void) => void;
  onUserOffline: (callback: (data: SocketUserStatus) => void) => void;
  onUserTyping: (callback: (data: SocketTyping) => void) => void;
  onUserStoppedTyping: (callback: (data: SocketTyping) => void) => void;
  offMessage: (callback: (data: SocketMessage) => void) => void;
  offUserOnline: (callback: (data: SocketUserStatus) => void) => void;
  offUserOffline: (callback: (data: SocketUserStatus) => void) => void;
  offUserTyping: (callback: (data: SocketTyping) => void) => void;
  offUserStoppedTyping: (callback: (data: SocketTyping) => void) => void;
}

export const useSocket = ({
  token,
  serverUrl = "http://localhost:3000",
}: UseSocketProps): UseSocketReturn => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);

  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!token) {
      // Disconnect if no token
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
        setIsConnected(false);
        setOnlineUsers([]);
      }
      return;
    }

    // Connect socket
    const newSocket = io(serverUrl, {
      auth: {
        token: token,
      },
      autoConnect: true,
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    // Connection events
    newSocket.on("connect", async () => {
      console.log("Socket connected:", newSocket.id);
      setIsConnected(true);

      // Load current online users when connecting (with small delay for backend to process connection)
      setTimeout(async () => {
        try {
          console.log("useSocket: Loading initial online users...");
          const onlineUsersResponse = await UserService.getOnlineUsers();
          console.log("useSocket: Raw API response:", onlineUsersResponse);

          // Check if response is array or object
          let onlineUsers = onlineUsersResponse;
          if (
            onlineUsersResponse &&
            typeof onlineUsersResponse === "object" &&
            !Array.isArray(onlineUsersResponse)
          ) {
            // If response is wrapped in data object
            onlineUsers =
              onlineUsersResponse.onlineUsers ||
              onlineUsersResponse.data ||
              onlineUsersResponse;
            console.log(
              "useSocket: Extracted from wrapped response:",
              onlineUsers
            );
          }

          if (Array.isArray(onlineUsers)) {
            // Extract user IDs from the response
            const onlineUserIds = onlineUsers
              .map((user) => {
                console.log("useSocket: Processing user:", user);
                return user.userId || user.id || user;
              })
              .filter(Boolean); // Remove any undefined/null values

            console.log("useSocket: Final online user IDs:", onlineUserIds);
            setOnlineUsers(onlineUserIds);
          } else {
            console.warn("useSocket: Unexpected response format:", onlineUsers);
          }
        } catch (error) {
          console.error(
            "useSocket: Error loading initial online users:",
            error
          );
          console.error(
            "useSocket: Error details:",
            error.response?.data || error.message
          );
          // Continue without initial online users - they'll be updated via socket events
        }
      }, 1000); // 1 second delay to ensure backend has processed the connection
    });

    newSocket.on("disconnect", (reason) => {
      console.log("Socket disconnected:", reason);
      setIsConnected(false);
    });

    newSocket.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
      setIsConnected(false);
    });

    // User status events
    newSocket.on("user_online", (data: SocketUserStatus) => {
      console.log("useSocket: User came online event:", data);
      console.log(
        "useSocket: Current online users before update:",
        onlineUsers
      );
      setOnlineUsers((prev) => {
        console.log("useSocket: Previous online users:", prev);
        if (!prev.includes(data.userId)) {
          const newUsers = [...prev, data.userId];
          console.log(
            "useSocket: Adding user to online list, new list:",
            newUsers
          );
          return newUsers;
        }
        console.log("useSocket: User already in online list, no change");
        return prev;
      });
    });

    newSocket.on("user_offline", (data: SocketUserStatus) => {
      console.log("useSocket: User went offline event:", data);
      console.log(
        "useSocket: Current online users before removal:",
        onlineUsers
      );
      setOnlineUsers((prev) => {
        const newUsers = prev.filter((id) => id !== data.userId);
        console.log(
          "useSocket: Removing user from online list, new list:",
          newUsers
        );
        return newUsers;
      });
    });

    // Room events
    newSocket.on("joined_room", (data: { conversationId: string }) => {
      console.log("Joined room:", data.conversationId);
    });

    // Cleanup on unmount
    return () => {
      if (newSocket) {
        newSocket.disconnect();
      }
      socketRef.current = null;
      setSocket(null);
      setIsConnected(false);
      setOnlineUsers([]);
    };
  }, [token, serverUrl]);

  // Socket actions
  const joinRoom = useCallback(
    (conversationId: string) => {
      if (socketRef.current && isConnected) {
        console.log("useSocket: Joining room:", conversationId);
        socketRef.current.emit("join_room", {
          conversationId,
        } as SocketJoinRoom);
      } else {
        console.log(
          "useSocket: Cannot join room - socket:",
          !!socketRef.current,
          "connected:",
          isConnected
        );
      }
    },
    [isConnected]
  );

  const sendMessage = useCallback(
    (conversationId: string, content: string) => {
      if (socketRef.current && isConnected) {
        console.log("useSocket: Sending message:", { conversationId, content });
        socketRef.current.emit("send_message", {
          conversationId,
          content,
        } as SocketSendMessage);
      } else {
        console.log(
          "useSocket: Cannot send message - socket:",
          !!socketRef.current,
          "connected:",
          isConnected
        );
      }
    },
    [isConnected]
  );

  const startTyping = useCallback(
    (conversationId: string) => {
      if (socketRef.current && isConnected) {
        socketRef.current.emit("typing_start", { conversationId });
      }
    },
    [isConnected]
  );

  const stopTyping = useCallback(
    (conversationId: string) => {
      if (socketRef.current && isConnected) {
        socketRef.current.emit("typing_stop", { conversationId });
      }
    },
    [isConnected]
  );

  // Event listeners
  const onMessage = useCallback((callback: (data: SocketMessage) => void) => {
    if (socketRef.current) {
      console.log("useSocket: Setting up message_received listener");
      socketRef.current.on("message_received", (data) => {
        console.log("useSocket: Received message_received event:", data);
        callback(data);
      });
    }
  }, []);

  const onUserOnline = useCallback(
    (callback: (data: SocketUserStatus) => void) => {
      if (socketRef.current) {
        socketRef.current.on("user_online", callback);
      }
    },
    []
  );

  const onUserOffline = useCallback(
    (callback: (data: SocketUserStatus) => void) => {
      if (socketRef.current) {
        socketRef.current.on("user_offline", callback);
      }
    },
    []
  );

  const onUserTyping = useCallback((callback: (data: SocketTyping) => void) => {
    if (socketRef.current) {
      socketRef.current.on("user_typing", callback);
    }
  }, []);

  const onUserStoppedTyping = useCallback(
    (callback: (data: SocketTyping) => void) => {
      if (socketRef.current) {
        socketRef.current.on("user_stopped_typing", callback);
      }
    },
    []
  );

  // Event cleanup
  const offMessage = useCallback((callback: (data: SocketMessage) => void) => {
    if (socketRef.current) {
      socketRef.current.off("message_received", callback);
    }
  }, []);

  const offUserOnline = useCallback(
    (callback: (data: SocketUserStatus) => void) => {
      if (socketRef.current) {
        socketRef.current.off("user_online", callback);
      }
    },
    []
  );

  const offUserOffline = useCallback(
    (callback: (data: SocketUserStatus) => void) => {
      if (socketRef.current) {
        socketRef.current.off("user_offline", callback);
      }
    },
    []
  );

  const offUserTyping = useCallback(
    (callback: (data: SocketTyping) => void) => {
      if (socketRef.current) {
        socketRef.current.off("user_typing", callback);
      }
    },
    []
  );

  const offUserStoppedTyping = useCallback(
    (callback: (data: SocketTyping) => void) => {
      if (socketRef.current) {
        socketRef.current.off("user_stopped_typing", callback);
      }
    },
    []
  );

  return {
    socket,
    isConnected,
    onlineUsers,
    joinRoom,
    sendMessage,
    startTyping,
    stopTyping,
    onMessage,
    onUserOnline,
    onUserOffline,
    onUserTyping,
    onUserStoppedTyping,
    offMessage,
    offUserOnline,
    offUserOffline,
    offUserTyping,
    offUserStoppedTyping,
  };
};
