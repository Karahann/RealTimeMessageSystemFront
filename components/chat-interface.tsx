"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, MessageCircle } from "lucide-react";
import { useAuth } from "@/lib/context/AuthContext";
import { useMessages } from "@/hooks/useMessages";
import { useSocket } from "@/hooks/useSocket";
import { ChatUser } from "@/lib/types";

type ChatInterfaceProps = {
  selectedUser?: ChatUser | null;
};

export default function ChatInterface({ selectedUser }: ChatInterfaceProps) {
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { token, user } = useAuth();

  // Use messages hook for backend integration
  const {
    messages,
    loading,
    error,
    sendMessage: sendMessageToBackend,
  } = useMessages({
    conversationId: selectedUser?.conversationId || null,
    token,
  });

  // Use socket hook for real-time messaging
  const {
    socket,
    isConnected,
    onlineUsers,
    joinRoom,
    sendMessage: sendSocketMessage,
    onMessage,
    onUserTyping,
    onUserStoppedTyping,
    startTyping,
    stopTyping,
  } = useSocket({ token });

  // Debug socket status only when conversation changes
  useEffect(() => {
    if (selectedUser?.conversationId) {
      console.log("ChatInterface: Selected conversation:", {
        conversationId: selectedUser?.conversationId,
        isConnected,
        hasSocket: !!socket,
      });
    }
  }, [selectedUser?.conversationId, isConnected, socket]);

  const selectedUserData = selectedUser;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Auto scroll when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Auto scroll when typing indicator shows/hides
  useEffect(() => {
    if (isTyping) {
      // Kullanıcı yazmaya başladığında aşağı kaydır
      console.log("ChatInterface: User started typing, scrolling to bottom");
      // Kısa bir delay ile scroll yap (DOM update'i bekle)
      const scrollTimeout = setTimeout(() => {
        scrollToBottom();
      }, 100);

      return () => clearTimeout(scrollTimeout);
    } else {
      // Yazmayı bıraktığında typing indicator kaybolur
      console.log(
        "ChatInterface: User stopped typing, typing indicator hidden"
      );
      // Scroll pozisyonu korunur, ekstra scroll yapılmaz
    }
  }, [isTyping]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [inputValue]);

  // Join conversation room when selected user changes
  useEffect(() => {
    // Clear typing state when switching conversations
    setIsTyping(false);

    if (selectedUser?.conversationId && isConnected) {
      console.log(
        "ChatInterface: Joining room for conversation:",
        selectedUser.conversationId,
        "selectedUser:",
        selectedUser
      );
      joinRoom(selectedUser.conversationId);
    } else {
      console.log(
        "ChatInterface: Cannot join room - selectedUser:",
        selectedUser,
        "conversationId:",
        selectedUser?.conversationId,
        "isConnected:",
        isConnected
      );
    }
  }, [selectedUser?.conversationId, isConnected, joinRoom]);

  // Listen for real-time messages
  useEffect(() => {
    if (!socket) return;

    const handleUserTyping = (data: any) => {
      console.log("ChatInterface: User typing:", data);

      // Check if typing event is for current conversation
      if (data.conversationId !== selectedUser?.conversationId) {
        console.log(
          "ChatInterface: Typing event not for current conversation",
          {
            eventConversationId: data.conversationId,
            currentConversationId: selectedUser?.conversationId,
          }
        );
        return;
      }

      if (data.userId !== user?.id) {
        console.log(
          "ChatInterface: Showing typing indicator for current conversation"
        );
        setIsTyping(true);
      }
    };

    const handleUserStoppedTyping = (data: any) => {
      console.log("ChatInterface: User stopped typing:", data);

      // Check if typing event is for current conversation
      if (data.conversationId !== selectedUser?.conversationId) {
        console.log(
          "ChatInterface: Stop typing event not for current conversation",
          {
            eventConversationId: data.conversationId,
            currentConversationId: selectedUser?.conversationId,
          }
        );
        return;
      }

      if (data.userId !== user?.id) {
        console.log(
          "ChatInterface: Hiding typing indicator for current conversation"
        );
        setIsTyping(false);
      }
    };

    // Only listen to typing events - useMessages handles message events
    onUserTyping(handleUserTyping);
    onUserStoppedTyping(handleUserStoppedTyping);

    return () => {
      // Cleanup if needed
    };
  }, [
    socket,
    onUserTyping,
    onUserStoppedTyping,
    user?.id,
    selectedUser?.conversationId,
  ]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() === "" || !selectedUser) return;

    const messageContent = inputValue;
    setInputValue("");

    try {
      console.log("ChatInterface: Sending message via socket only");

      // Send via useMessages hook (which uses socket)
      await sendMessageToBackend(messageContent);
      console.log("ChatInterface: Message sent successfully");

      // Stop typing indicator
      if (isConnected && selectedUser.conversationId) {
        stopTyping(selectedUser.conversationId);
      }
    } catch (error) {
      console.error("ChatInterface: Error sending message:", error);
      // Optionally show error toast
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  // Handle typing indicators
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setInputValue(value);

    // Send typing indicator if connected and has a conversation
    if (isConnected && selectedUser?.conversationId && value.trim()) {
      startTyping(selectedUser.conversationId);
    } else if (isConnected && selectedUser?.conversationId) {
      stopTyping(selectedUser.conversationId);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="flex flex-col h-full max-h-full bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="flex items-center p-6 border-b border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg shadow-sm">
        {selectedUserData ? (
          <>
            <div className="h-14 w-14 mr-4 bg-white rounded-full flex items-center justify-center font-bold text-black shadow-lg border-2 border-white dark:border-white">
              {selectedUserData.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <h2 className="font-bold text-xl text-black dark:text-white">
                {selectedUserData.name}
              </h2>
              <div className="flex items-center gap-2 mt-1">
                <div
                  className={`w-2 h-2 rounded-full ${
                    onlineUsers.includes(selectedUserData.id)
                      ? "bg-green-500 animate-pulse"
                      : "bg-gray-400"
                  }`}
                />
                <span
                  className={`text-sm font-medium ${
                    onlineUsers.includes(selectedUserData.id)
                      ? "text-green-600 dark:text-green-400"
                      : "text-black/70 dark:text-white/70"
                  }`}
                >
                  {onlineUsers.includes(selectedUserData.id)
                    ? "Online"
                    : "Offline"}
                </span>
              </div>
            </div>
            {/* Socket connection status (for debugging) */}
            {!isConnected && (
              <div className="flex items-center gap-2 px-3 py-2 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-sm font-medium text-red-600 dark:text-red-400">
                  Disconnected
                </span>
              </div>
            )}
          </>
        ) : (
          <div className="flex items-center justify-center w-full py-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="h-8 w-8 text-slate-400" />
              </div>
              <p className="text-slate-500 dark:text-slate-400 font-medium">
                Select a conversation to start messaging
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 min-h-0 bg-gradient-to-b from-transparent to-gray-50/50 dark:to-gray-900/50">
        <div className="space-y-6 p-6 min-h-full">
          {loading && messages.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-black dark:border-white border-t-transparent mx-auto mb-6 shadow-lg"></div>
                <p className="text-black dark:text-white font-medium">
                  Loading messages...
                </p>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <MessageCircle className="h-8 w-8 text-red-500" />
                </div>
                <p className="text-red-500 font-medium">
                  Error loading messages: {error}
                </p>
              </div>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-3xl flex items-center justify-center mx-auto mb-6">
                  <MessageCircle className="h-10 w-10 text-black dark:text-white" />
                </div>
                <p className="text-black dark:text-white text-lg font-medium">
                  No messages yet. Start the conversation!
                </p>
              </div>
            </div>
          ) : (
            messages.map((message) => {
              // Removed debug log to reduce spam

              return (
                <div
                  key={message.id}
                  className={`flex ${
                    message.sender === "user" ? "justify-end" : "justify-start"
                  } group`}
                >
                  <div
                    className={`flex items-end gap-3 max-w-[75%] ${
                      message.sender === "user"
                        ? "flex-row-reverse"
                        : "flex-row"
                    }`}
                  >
                    {/* Avatar for contact messages */}
                    {message.sender === "contact" && (
                      <div className="h-8 w-8 flex-shrink-0 bg-gradient-to-br from-pink-400 via-rose-500 to-red-500 rounded-2xl flex items-center justify-center font-bold text-white text-sm shadow-lg group-hover:scale-110 transition-transform duration-300">
                        {message.senderName.charAt(0).toUpperCase()}
                      </div>
                    )}

                    <div
                      className={`rounded-3xl px-5 py-3 shadow-sm transition-all duration-300 group-hover:shadow-md ${
                        message.sender === "user"
                          ? "bg-black dark:bg-white text-white dark:text-black shadow-lg border border-gray-700 dark:border-gray-600 rounded-br-3xl"
                          : "bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-600 rounded-bl-lg"
                      }`}
                    >
                      {/* Show sender name for contact messages */}
                      {message.sender === "contact" && (
                        <div className="text-xs font-semibold text-blue-600 dark:text-blue-400 mb-2">
                          {message.senderName}
                        </div>
                      )}
                      <p className="whitespace-pre-wrap leading-relaxed">
                        {message.content}
                      </p>
                      <div
                        suppressHydrationWarning
                        className={`text-xs mt-2 ${
                          message.sender === "user"
                            ? "text-white/70 dark:text-black/70"
                            : "text-gray-500 dark:text-gray-400"
                        }`}
                      >
                        {formatTime(message.timestamp)}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}

          {isTyping && selectedUser && (
            <div className="flex justify-start items-end gap-2 animate-in slide-in-from-left-2 duration-300">
              <div className="h-6 w-6 flex-shrink-0 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center font-bold text-white text-xs shadow-sm">
                {selectedUser.name.charAt(0).toUpperCase()}
              </div>
              <div className="bg-gradient-to-r from-purple-100 via-pink-100 to-rose-100 dark:from-purple-800 dark:via-pink-800 dark:to-rose-800 rounded-2xl rounded-bl-none px-4 py-2 shadow-sm border border-purple-200 dark:border-purple-600">
                <div className="text-xs font-medium text-purple-600 dark:text-purple-300 mb-1">
                  {selectedUser.name} yazıyor...
                </div>
                <div className="flex space-x-1">
                  <div
                    className="w-2 h-2 rounded-full bg-primary/60 animate-bounce"
                    style={{ animationDelay: "0ms" }}
                  ></div>
                  <div
                    className="w-2 h-2 rounded-full bg-primary/60 animate-bounce"
                    style={{ animationDelay: "150ms" }}
                  ></div>
                  <div
                    className="w-2 h-2 rounded-full bg-primary/60 animate-bounce"
                    style={{ animationDelay: "300ms" }}
                  ></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input */}
      {selectedUser ? (
        <div className="flex-shrink-0 p-6 border-t border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg">
          <div className="relative mx-auto w-full max-w-4xl">
            <form onSubmit={handleSendMessage}>
              <div className="relative">
                <Textarea
                  ref={textareaRef}
                  value={inputValue}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  placeholder="Type a message..."
                  className="w-full resize-none rounded-3xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 p-6 pr-16 text-sm shadow-lg focus:shadow-xl focus:border-blue-500 dark:focus:border-blue-400 focus:ring-4 focus:ring-blue-500/20 transition-all duration-300 placeholder:text-black/50 dark:placeholder:text-white/50 text-black dark:text-white"
                  rows={1}
                  disabled={loading || !isConnected}
                />
                <Button
                  type="submit"
                  size="icon"
                  className={`absolute bottom-4 right-4 h-12 w-12 rounded-2xl transition-all duration-300 shadow-lg ${
                    inputValue.trim() === "" || loading
                      ? "bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                      : "bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 hover:scale-110"
                  }`}
                  disabled={inputValue.trim() === "" || loading}
                >
                  <Send className="h-5 w-5" />
                </Button>
              </div>
              {!isConnected && (
                <div className="flex items-center gap-2 mt-3 px-4 py-2 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
                  <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-sm font-medium text-red-600 dark:text-red-400">
                    Connection lost. Trying to reconnect...
                  </span>
                </div>
              )}
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
