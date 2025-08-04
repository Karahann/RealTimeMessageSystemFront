import { useState, useEffect, useCallback } from "react";
import { Conversation, ChatUser } from "@/lib/types";
import { ConversationService } from "@/lib/services/conversations";
import { UserService } from "@/lib/services/users";
import { useAuth } from "@/lib/context/AuthContext";

interface UseConversationsReturn {
  conversations: ChatUser[];
  loading: boolean;
  error: string | null;
  createConversation: (userId: string) => Promise<string | null>;
  refreshConversations: () => Promise<void>;
}

export const useConversations = (
  token: string | null
): UseConversationsReturn => {
  const [conversations, setConversations] = useState<ChatUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { user } = useAuth();

  // Convert backend conversation to ChatUser format
  const convertConversationToChatUser = useCallback(
    (conversation: Conversation, currentUserId: string): ChatUser => {
      // Find the other participant (not current user)
      // Backend'de participantDetails yerine participants geliyor
      const participants =
        conversation.participantDetails || conversation.participants || [];
      const otherParticipant = participants.find(
        (participant) => (participant.id || participant._id) !== currentUserId
      );

      if (!otherParticipant) {
        return {
          id: conversation.id,
          name: "Unknown User",
          username: "unknown",
          status: "offline",
          unread: 0,
          lastMessage: conversation.lastMessageDetails?.content || "",
          lastMessageAt: conversation.lastMessageAt
            ? new Date(conversation.lastMessageAt)
            : undefined,
          conversationId: conversation.id, // Conversation ID ekle
        };
      }

      const chatUser = {
        id: otherParticipant.id || otherParticipant._id, // User ID
        name: otherParticipant.username, // Using username as display name
        username: otherParticipant.username,
        status: otherParticipant.isActive ? "online" : "offline", // Simple online/offline for now
        unread: 0, // TODO: Implement unread count
        lastMessage: conversation.lastMessageDetails?.content || "",
        lastMessageAt: conversation.lastMessageAt
          ? new Date(conversation.lastMessageAt)
          : undefined,
        lastSeen: otherParticipant.lastSeen
          ? new Date(otherParticipant.lastSeen)
          : undefined,
        conversationId: conversation.id, // Conversation ID ekle
      };

      console.log("useConversations: Created ChatUser:", {
        conversationId: conversation.id,
        chatUserConversationId: chatUser.conversationId,
        originalConversation: conversation,
      });

      return chatUser;
    },
    []
  );

  // Load conversations
  const loadConversations = useCallback(async () => {
    if (!token) {
      console.log("useConversations: No token, clearing conversations");
      setConversations([]);
      return;
    }

    console.log("useConversations: Loading conversations with token:", token);
    setLoading(true);
    setError(null);

    try {
      console.log(
        "useConversations: Calling ConversationService.getConversations"
      );
      const conversationsData = await ConversationService.getConversations();
      console.log(
        "useConversations: Got conversations data:",
        conversationsData
      );

      const currentUserId = user?.id || "";
      console.log("useConversations: Current user ID:", currentUserId);

      const chatUsers = conversationsData.map((conv) =>
        convertConversationToChatUser(conv, currentUserId)
      );
      console.log("useConversations: Converted to chat users:", chatUsers);

      setConversations(chatUsers);
      console.log("useConversations: Successfully set conversations");
    } catch (err: any) {
      console.error("useConversations: Error loading conversations:", err);
      setError(err.response?.data?.message || "Failed to load conversations");
    } finally {
      setLoading(false);
    }
  }, [token, user, convertConversationToChatUser]);

  // Create or get conversation with user
  const createConversation = useCallback(
    async (userId: string): Promise<string | null> => {
      if (!token) return null;

      try {
        const conversation = await ConversationService.createOrGetConversation(
          userId
        );

        // Refresh conversations to include the new one
        await loadConversations();

        return conversation._id;
      } catch (err: any) {
        console.error("Error creating conversation:", err);
        setError(
          err.response?.data?.message || "Failed to create conversation"
        );
        return null;
      }
    },
    [token, loadConversations]
  );

  // Refresh conversations
  const refreshConversations = useCallback(async () => {
    await loadConversations();
  }, [loadConversations]);

  // Load conversations on mount and when token changes
  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  return {
    conversations,
    loading,
    error,
    createConversation,
    refreshConversations,
  };
};
