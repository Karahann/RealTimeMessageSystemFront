import api, { ApiResponse } from "../api";
import { Conversation, CreateConversationRequest } from "../types";

export class ConversationService {
  static async getConversations(): Promise<Conversation[]> {
    try {
      console.log("ConversationService getConversations start");
      const response = await api.get<ApiResponse<any>>("/conversations");

      console.log("ConversationService conversations response:", response.data);

      // Backend sadece array döndürüyor, conversations objesi içinde değil
      const conversations = response.data.data || [];

      console.log("ConversationService parsed conversations:", conversations);
      return conversations;
    } catch (error) {
      console.error("ConversationService getConversations error:", error);
      throw error;
    }
  }

  static async createOrGetConversation(
    participantId: string
  ): Promise<Conversation> {
    try {
      console.log(
        "ConversationService createOrGetConversation start:",
        participantId
      );
      const response = await api.post<ApiResponse<any>>("/conversations", {
        participantId,
      } as CreateConversationRequest);

      console.log(
        "ConversationService create conversation response:",
        response.data
      );

      // Backend conversation objesi içinde değil, direkt data'da
      const conversation = response.data.data;

      console.log("ConversationService parsed conversation:", conversation);
      return conversation;
    } catch (error) {
      console.error(
        "ConversationService createOrGetConversation error:",
        error
      );
      throw error;
    }
  }
}
