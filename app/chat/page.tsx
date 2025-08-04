"use client";

import { useState, useEffect } from "react";
import UserSidebar from "@/components/user-sidebar";
import ChatInterface from "@/components/chat-interface";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { useAuth } from "@/lib/context/AuthContext";
import { useRouter } from "next/navigation";
import { ChatUser } from "@/lib/types";

export default function ChatPage() {
  const [selectedUser, setSelectedUser] = useState<ChatUser | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Debug selected user changes
  useEffect(() => {
    console.log("ChatPage: Selected user changed:", {
      user: selectedUser,
      userId: selectedUser?.id,
      userName: selectedUser?.name,
      conversationId: selectedUser?.conversationId,
      hasConversationId: !!selectedUser?.conversationId,
      fullUserObject: JSON.stringify(selectedUser, null, 2),
    });
  }, [selectedUser]);

  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  // Redirect to auth if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/auth");
    }
  }, [isAuthenticated, isLoading, router]);

  // Show loading while checking auth
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-indigo-900 dark:via-purple-900 dark:to-pink-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-purple-600 dark:text-purple-400 font-medium">
            Loading...
          </p>
        </div>
      </div>
    );
  }

  // Don't render chat if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex h-screen bg-white dark:bg-gray-900 overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Left Sidebar */}
      <div
        className={`
          fixed lg:relative lg:translate-x-0 z-50 lg:z-auto
          w-80 lg:w-80 xl:w-96 flex-shrink-0 h-full
          transform transition-transform duration-300 ease-in-out
          ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          }
        `}
      >
        <UserSidebar
          onSelectUser={(user) => {
            setSelectedUser(user);
            setSidebarOpen(false); // Close sidebar on mobile after selection
          }}
          selectedUser={selectedUser}
          onClose={() => setSidebarOpen(false)}
        />
      </div>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col lg:p-8 bg-gradient-to-br from-transparent to-gray-50/30 dark:to-gray-900/30 min-w-0">
        {/* Mobile Header */}
        <div className="lg:hidden flex items-center justify-between p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden"
          >
            <Menu className="h-6 w-6" />
          </Button>
          <h1 className="font-semibold">Chat</h1>
          <div className="w-10" /> {/* Spacer for center alignment */}
        </div>

        {/* Chat Container */}
        <div className="flex-1 flex items-center justify-center p-4 lg:p-0 min-h-0">
          <div className="w-full h-full max-w-4xl min-h-0 flex flex-col bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-none lg:rounded-xl shadow-none lg:shadow-xl overflow-hidden">
            <ChatInterface selectedUser={selectedUser} />
          </div>
        </div>
      </main>
    </div>
  );
}
