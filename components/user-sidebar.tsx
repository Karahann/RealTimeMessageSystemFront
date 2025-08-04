"use client";

import { useState } from "react";
import {
  Search,
  Users,
  Settings,
  LogOut,
  X,
  MessageCircle,
  UserPlus,
} from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/context/AuthContext";
import { useConversations } from "@/hooks/useConversations";
import { useUsers } from "@/hooks/useUsers";
import { useSocket } from "@/hooks/useSocket";
import { ChatUser, User } from "@/lib/types";
import { useRouter } from "next/navigation";
import { ConversationService } from "@/lib/services/conversations";

type UserSidebarProps = {
  onSelectUser: (user: ChatUser) => void;
  selectedUser: ChatUser | null;
  onClose?: () => void;
};

export default function UserSidebar({
  onSelectUser,
  selectedUser,
  onClose,
}: UserSidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"conversations" | "users">(
    "conversations"
  );

  const { token, logout, user } = useAuth();
  const router = useRouter();

  const handleSettings = () => {
    router.push("/settings");
  };

  // Use conversations hook for backend integration
  const {
    conversations,
    loading: conversationsLoading,
    error: conversationsError,
    refreshConversations,
  } = useConversations(token);

  // Use users hook for all users list
  const {
    users,
    loading: usersLoading,
    error: usersError,
    refreshUsers,
  } = useUsers();

  // Use socket hook for online users tracking
  const { onlineUsers } = useSocket({ token });

  // Debug log states
  console.log("UserSidebar: conversations state", {
    conversations,
    loading: conversationsLoading,
    error: conversationsError,
    token,
    user,
  });

  console.log("UserSidebar: users state", {
    users,
    loading: usersLoading,
    error: usersError,
  });

  // Filter conversations based on search
  const filteredConversations = conversations.filter(
    (user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Filter users based on search
  const filteredUsers = users.filter(
    (user) =>
      user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Start new conversation with user
  const handleStartConversation = async (selectedUser: User) => {
    try {
      console.log(
        "UserSidebar: Starting conversation with user:",
        selectedUser
      );

      // Create or get conversation
      const conversationId = await ConversationService.createOrGetConversation(
        selectedUser.id
      );
      console.log("UserSidebar: Got conversation ID:", conversationId);

      // Convert User to ChatUser format
      const chatUser: ChatUser = {
        id: selectedUser.id,
        name: selectedUser.username, // Backend'de name field'ı yoksa username kullanıyoruz
        username: selectedUser.username,
        avatar: `https://ui-avatars.com/api/?name=${selectedUser.username}&background=6366f1&color=fff`,
        lastMessage: "Start conversation",
        lastMessageAt: new Date(),
        status: getUserStatus(selectedUser.id) as "online" | "offline" | "away", // Gerçek online status'u kullan
        unread: 0,
        conversationId:
          typeof conversationId === "string"
            ? conversationId
            : conversationId.id, // Backend'den dönen conversation ID
      };

      console.log("UserSidebar: Created chat user:", chatUser);
      onSelectUser(chatUser);

      // Refresh conversations to show new conversation
      refreshConversations();

      // Switch to conversations tab to see the new conversation
      setActiveTab("conversations");
    } catch (error) {
      console.error("UserSidebar: Error starting conversation:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.push("/auth");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  // Helper function to check if a user is online
  const isUserOnline = (userId: string): boolean => {
    return onlineUsers.includes(userId);
  };

  // Helper function to get user status
  const getUserStatus = (userId: string): string => {
    return isUserOnline(userId) ? "online" : "offline";
  };

  return (
    <div className="h-full bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex flex-col shadow-xl">
      {/* Header */}
      <div className="p-4 lg:p-6 border-b border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-4 lg:mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-r from-gray-800 to-black rounded-2xl text-white shadow-lg">
              <Users className="h-6 w-6" />
            </div>
            <h2 className="font-bold text-xl lg:text-2xl text-black dark:text-white">
              Messages
            </h2>
          </div>
          {/* Close button for mobile */}
          {onClose && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="lg:hidden h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-4 bg-gray-100 dark:bg-gray-800 p-1.5 rounded-2xl shadow-inner">
          <Button
            variant={activeTab === "conversations" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("conversations")}
            className={`flex-1 gap-2 rounded-xl font-medium transition-all duration-300 ${
              activeTab === "conversations"
                ? "bg-black dark:bg-white text-white dark:text-black shadow-lg scale-105"
                : "hover:bg-white/60 dark:hover:bg-gray-700/50 text-black dark:text-white"
            }`}
          >
            <MessageCircle className="h-4 w-4" />
            Chats
          </Button>
          <Button
            variant={activeTab === "users" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("users")}
            className={`flex-1 gap-2 rounded-xl font-medium transition-all duration-300 ${
              activeTab === "users"
                ? "bg-black dark:bg-white text-white dark:text-black shadow-lg scale-105"
                : "hover:bg-white/60 dark:hover:bg-gray-700/50 text-black dark:text-white"
            }`}
          >
            <UserPlus className="h-4 w-4" />
            Users
          </Button>
        </div>

        <div className="relative">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-black dark:text-white" />
          <Input
            placeholder={
              activeTab === "conversations"
                ? "Search chats..."
                : "Search users..."
            }
            className="pl-12 pr-4 py-3 text-sm bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-600 rounded-2xl shadow-sm focus:shadow-lg focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 placeholder:text-black/50 dark:placeholder:text-white/50 text-black dark:text-white"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto bg-gradient-to-b from-transparent to-gray-50/50 dark:to-gray-900/50">
        <div className="p-3 lg:p-4">
          {activeTab === "conversations" ? (
            // Conversations Tab
            <>
              <h3 className="text-sm font-semibold text-black dark:text-white px-3 py-2 mb-2">
                Your Chats
              </h3>
              {conversationsLoading ? (
                <div className="flex items-center justify-center p-4">
                  <p className="text-muted-foreground text-sm">
                    Loading conversations...
                  </p>
                </div>
              ) : conversationsError ? (
                <div className="flex items-center justify-center p-4">
                  <p className="text-red-500 text-sm">
                    Error: {conversationsError}
                  </p>
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="flex items-center justify-center p-4">
                  <p className="text-muted-foreground text-sm">
                    {conversations.length === 0
                      ? "No conversations yet. Start chatting with someone!"
                      : "No matching conversations"}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredConversations.map((user) => (
                    <div
                      key={user.id}
                      onClick={() => onSelectUser(user)}
                      className={`group flex items-center gap-3 w-full p-4 rounded-2xl cursor-pointer transition-all duration-300 hover:scale-[1.02] ${
                        selectedUser?.id === user.id
                          ? "bg-black dark:bg-white text-white dark:text-black shadow-lg"
                          : "bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 shadow-sm hover:shadow-md border border-gray-200 dark:border-gray-600"
                      }`}
                    >
                      <div className="flex-shrink-0">
                        <div className="h-12 w-12 rounded-full flex items-center justify-center font-bold text-sm shadow-lg bg-white text-black border-2 border-white dark:border-white group-hover:scale-110">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center mb-1">
                          <span
                            className={`font-semibold truncate ${
                              selectedUser?.id === user.id
                                ? "text-white dark:text-black"
                                : "text-black dark:text-white"
                            }`}
                          >
                            {user.name}
                          </span>
                          {user.unread > 0 && (
                            <Badge
                              variant="secondary"
                              className="ml-2 px-2 py-1 text-xs bg-red-500 text-white rounded-full shadow-sm"
                            >
                              {user.unread}
                            </Badge>
                          )}
                        </div>
                        <p
                          className={`text-sm truncate leading-relaxed ${
                            selectedUser?.id === user.id
                              ? "text-white/70 dark:text-black/70"
                              : "text-black/70 dark:text-white/70"
                          }`}
                        >
                          {user.lastMessage || "No messages yet"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            // Users Tab
            <>
              <h3 className="text-sm font-semibold text-black dark:text-white px-3 py-2 mb-2">
                All Users
              </h3>
              {usersLoading ? (
                <div className="flex items-center justify-center p-8">
                  <div className="flex flex-col items-center gap-3">
                    <div className="animate-spin rounded-full h-8 w-8 border-4 border-black dark:border-white border-t-transparent"></div>
                    <p className="text-black dark:text-white text-sm font-medium">
                      Loading users...
                    </p>
                  </div>
                </div>
              ) : usersError ? (
                <div className="flex items-center justify-center p-8">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-3">
                      <X className="h-6 w-6 text-red-500" />
                    </div>
                    <p className="text-red-500 text-sm font-medium">
                      Error: {usersError}
                    </p>
                  </div>
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="flex items-center justify-center p-8">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Users className="h-6 w-6 text-black dark:text-white" />
                    </div>
                    <p className="text-black dark:text-white text-sm font-medium">
                      {users.length === 0
                        ? "No users found"
                        : "No matching users"}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredUsers.map((user) => (
                    <div
                      key={user.id}
                      onClick={() => handleStartConversation(user)}
                      className="group flex items-center gap-3 w-full p-4 rounded-2xl cursor-pointer transition-all duration-300 hover:scale-[1.02] bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 shadow-sm hover:shadow-md border border-gray-200 dark:border-gray-600"
                    >
                      <div className="flex-shrink-0 relative">
                        <div className="h-12 w-12 bg-white text-black rounded-full flex items-center justify-center font-bold text-sm shadow-lg border-2 border-white dark:border-white group-hover:scale-110">
                          {user.username.charAt(0).toUpperCase()}
                        </div>
                        {/* Online status indicator */}
                        {isUserOnline(user.id) && (
                          <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full animate-pulse"></div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-semibold truncate text-black dark:text-white">
                            {user.username}
                          </span>
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-xs px-2 py-1 rounded-full font-medium ${
                                isUserOnline(user.id)
                                  ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                  : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                              }`}
                            >
                              {isUserOnline(user.id) ? "Online" : "Offline"}
                            </span>
                            <MessageCircle className="h-4 w-4 text-black/60 dark:text-white/60 group-hover:text-blue-500 transition-colors" />
                          </div>
                        </div>
                        <p className="text-sm text-black/70 dark:text-white/70 truncate">
                          {user.email}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
        <div className="space-y-2">
          <div
            onClick={handleSettings}
            className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-all duration-300 group"
          >
            <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg group-hover:bg-gray-200 dark:group-hover:bg-gray-600 transition-colors">
              <Settings className="h-4 w-4 text-black dark:text-white" />
            </div>
            <span className="text-sm font-medium text-black dark:text-white">
              Settings
            </span>
          </div>
          <div
            onClick={handleLogout}
            className="flex items-center gap-3 p-3 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 cursor-pointer transition-all duration-300 group"
          >
            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg group-hover:bg-red-200 dark:group-hover:bg-red-900/50 transition-colors">
              <LogOut className="h-4 w-4 text-red-600 dark:text-red-400" />
            </div>
            <span className="text-sm font-medium text-red-700 dark:text-red-400">
              Logout
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
