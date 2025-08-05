import { useState, useEffect, useCallback } from "react";
import { Message, ChatMessage } from "@/lib/types";
import { MessageService } from "@/lib/services/messages";
import { useSocket } from "./useSocket";
import { useAuth } from "@/lib/context/AuthContext";

interface UseMessagesProps {
  conversationId: string | null;
  token: string | null;
}

interface UseMessagesReturn {
  messages: ChatMessage[];
  loading: boolean;
  error: string | null;
  sendMessage: (content: string) => Promise<void>;
  loadMoreMessages: () => Promise<void>;
  hasMoreMessages: boolean;
  isAppendingMessages: boolean; // Track if we're appending vs initial load
}

export const useMessages = ({
  conversationId,
  token,
}: UseMessagesProps): UseMessagesReturn => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMoreMessages, setHasMoreMessages] = useState(true); // Assume more messages initially
  const [isAppendingMessages, setIsAppendingMessages] = useState(false);

  // Debug conversation ID (only when it changes)
  useEffect(() => {
    console.log("useMessages: conversationId changed to:", conversationId);
  }, [conversationId]);

  const { user } = useAuth();
  const {
    socket,
    isConnected,
    joinRoom,
    sendMessage: socketSendMessage,
    onMessage,
    offMessage,
  } = useSocket({ token });

  // Convert backend Message to ChatMessage
  const convertMessage = useCallback(
    (message: Message, currentUserId: string): ChatMessage => {
      // Backend'den gelen mesajın tüm field'larını kontrol et
      console.log("useMessages: Raw message from backend:", message);

      // Backend'de senderId yerine başka field ismi kullanılıyor olabilir
      // Backend dokümantasyonuna göre farklı field isimleri dene
      const actualSenderId =
        message.senderId ||
        (message as any).sender?._id ||
        (message as any).sender?.id ||
        (message as any).userId ||
        (message as any).authorId ||
        (message as any).from ||
        (message as any).user;

      // Debug log
      console.log("useMessages: Converting message", {
        messageId: message.id,
        senderId: message.senderId,
        actualSenderId,
        currentUserId,
        isCurrentUser: actualSenderId === currentUserId,
      });

      // Backend'deki Message modeli: sender field'ı populated User objesi
      // message.sender varsa kullan, yoksa fallback
      const senderInfo = message.sender || {
        id: message.senderId,
        username: `User_${message.senderId.slice(-4)}`, // Son 4 karakter
        email: `${message.senderId}@unknown.com`,
      };

      const chatMessage = {
        id: message.id,
        content: message.content,
        sender: actualSenderId === currentUserId ? "user" : "contact",
        senderId: actualSenderId || message.senderId,
        senderName:
          senderInfo.username ||
          `User_${(actualSenderId || message.senderId || "unknown").slice(-4)}`,
        senderUsername:
          senderInfo.username ||
          `User_${(actualSenderId || message.senderId || "unknown").slice(-4)}`,
        timestamp: new Date(message.createdAt),
        isRead: message.isRead,
      };

      console.log("useMessages: Converted chat message:", chatMessage);
      return chatMessage;
    },
    []
  );

  // Load messages for conversation
  const loadMessages = useCallback(
    async (pageNum: number = 1, append: boolean = false) => {
      if (!conversationId || !token) {
        setMessages([]);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const { messages: newMessages, pagination } =
          await MessageService.getMessages(conversationId, pageNum, 50);

        // Debug pagination info
        console.log(
          "useMessages: Raw backend response pagination:",
          pagination
        );

        // Get current user ID from auth context
        const currentUserId = user?.id || "";
        console.log(
          "useMessages: Loading messages with currentUserId:",
          currentUserId
        );
        console.log("useMessages: User object:", user);

        // Debug: Check message order from backend
        console.log(
          "useMessages: Raw messages from backend (first 3):",
          newMessages.slice(0, 3).map((msg) => ({
            id: msg.id,
            createdAt: msg.createdAt,
            content: msg.content.substring(0, 20) + "...",
          }))
        );

        const convertedMessages = newMessages.map((msg) =>
          convertMessage(msg, currentUserId)
        );

        // Backend'den gelen mesajları tarih/saat sırasına göre sırala (eski → yeni)
        const sortedMessages = convertedMessages.sort(
          (a, b) =>
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );

        console.log(
          "useMessages: Sorted messages (first 3):",
          sortedMessages.slice(0, 3).map((msg) => ({
            id: msg.id,
            timestamp: msg.timestamp.toISOString(),
            content: msg.content.substring(0, 20) + "...",
          }))
        );

        if (append) {
          // Pagination için: eski mesajları başa ekle
          console.log("useMessages: Appending older messages:", {
            newMessagesCount: sortedMessages.length,
            existingMessagesCount: messages.length,
            totalAfterAppend: sortedMessages.length + messages.length,
          });

          setMessages((prev) => {
            // Ensure no duplicates by filtering out any messages that already exist
            const existingIds = new Set(prev.map((msg) => msg.id));
            const uniqueNewMessages = sortedMessages.filter(
              (msg) => !existingIds.has(msg.id)
            );

            console.log("useMessages: Filtered unique messages:", {
              originalNewCount: sortedMessages.length,
              uniqueNewCount: uniqueNewMessages.length,
              filteredOut: sortedMessages.length - uniqueNewMessages.length,
            });

            return [...uniqueNewMessages, ...prev];
          });

          // Reset appending flag after append is complete
          setIsAppendingMessages(false);
        } else {
          // Normal loading: eski → yeni sırada
          console.log("useMessages: Setting initial messages:", {
            messagesCount: sortedMessages.length,
          });
          setMessages(sortedMessages);
          setIsAppendingMessages(false); // Ensure it's false for initial load
        }

        // Calculate hasMoreMessages with detailed logging and fallback
        let calculatedHasMore = false;

        if (pagination) {
          calculatedHasMore = pagination.page < pagination.pages;
        } else {
          // Fallback: if we got a full page of messages, assume there might be more
          calculatedHasMore = newMessages.length >= 50; // Full page size
        }

        console.log("useMessages: Pagination calculation:", {
          pagination,
          currentPage: pagination?.page,
          totalPages: pagination?.pages,
          messagesReceived: newMessages.length,
          hasMoreMessages: calculatedHasMore,
          pageNum,
          hasPagination: !!pagination,
        });

        setHasMoreMessages(calculatedHasMore);
        setPage(pageNum);
      } catch (err: any) {
        console.error("Error loading messages:", err);
        setError(err.response?.data?.message || "Failed to load messages");
      } finally {
        setLoading(false);
      }
    },
    [conversationId, token, user, convertMessage]
  );

  // Load more messages (pagination)
  const loadMoreMessages = useCallback(async () => {
    if (!hasMoreMessages || loading) return;
    console.log(
      "useMessages: loadMoreMessages called - setting isAppendingMessages to true"
    );
    setIsAppendingMessages(true);
    await loadMessages(page + 1, true);
    // isAppendingMessages will be set to false in loadMessages after append
  }, [hasMoreMessages, loading, page, loadMessages]);

  // Send message
  const sendMessage = useCallback(
    async (content: string) => {
      if (!conversationId || !content.trim() || !isConnected) return;

      try {
        console.log("useMessages: Sending message via socket only");
        // Send via socket for real-time delivery - backend only has socket API
        socketSendMessage(conversationId, content);
        console.log("useMessages: Message sent via socket successfully");

        // Note: We don't add the message to local state here
        // because we'll receive it back via socket event
      } catch (err: any) {
        console.error("useMessages: Error sending message:", err);
        setError("Failed to send message");
      }
    },
    [conversationId, isConnected, socketSendMessage]
  );

  // Handle incoming socket messages
  useEffect(() => {
    if (!socket || !isConnected) {
      console.log(
        "useMessages: Socket not ready - socket:",
        !!socket,
        "connected:",
        isConnected
      );
      return;
    }

    console.log("useMessages: Setting up message listener");
    const handleNewMessage = (data: any) => {
      console.log("useMessages: Received new message:", data);

      // CRITICAL FIX: Check if message belongs to current conversation
      if (
        !data.message?.conversationId ||
        data.message.conversationId !== conversationId
      ) {
        console.log("useMessages: Message not for current conversation", {
          messageConversationId: data.message?.conversationId,
          currentConversationId: conversationId,
          messageContent: data.message?.content?.substring(0, 20) + "...",
        });
        return; // Don't add message to wrong conversation
      }

      console.log(
        "useMessages: Message is for current conversation, processing..."
      );
      const currentUserId = user?.id || "";
      console.log(
        "useMessages: Socket message with currentUserId:",
        currentUserId
      );
      console.log("useMessages: User object in socket:", user);
      const newMessage = convertMessage(data.message, currentUserId);
      console.log("useMessages: Converted message:", newMessage);

      setMessages((prev) => {
        console.log(
          "useMessages: Adding message to state, prev count:",
          prev.length
        );
        return [...prev, newMessage];
      });
    };

    onMessage(handleNewMessage);
    console.log("useMessages: Message listener set up");

    return () => {
      console.log("useMessages: Cleaning up message listener");
      offMessage(handleNewMessage);
    };
  }, [
    socket,
    isConnected,
    onMessage,
    offMessage,
    convertMessage,
    user,
    conversationId,
  ]);

  // NOTE: Room joining is handled by ChatInterface, not here
  // This prevents duplicate join_room calls

  // Load messages when conversation changes
  useEffect(() => {
    console.log(
      "useMessages: Conversation changed, resetting pagination state"
    );
    setPage(1);
    setHasMoreMessages(true); // Reset to true for new conversation
    setMessages([]); // Clear previous messages
    setIsAppendingMessages(false); // Reset appending flag
    loadMessages(1, false);
  }, [conversationId, loadMessages]);

  return {
    messages,
    loading,
    error,
    sendMessage,
    loadMoreMessages,
    hasMoreMessages,
    isAppendingMessages,
  };
};
