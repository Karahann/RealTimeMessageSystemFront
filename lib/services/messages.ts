import api, { ApiResponse } from "../api";
import { Message } from "../types";

export class MessageService {
  static async getMessages(
    conversationId: string,
    page: number = 1,
    limit: number = 50
  ): Promise<{ messages: Message[]; pagination: any }> {
    try {
      console.log("MessageService getMessages start:", {
        conversationId,
        page,
        limit,
      });
      const response = await api.get<ApiResponse<any>>(
        `/messages/conversations/${conversationId}?page=${page}&limit=${limit}`
      );
      console.log("MessageService getMessages response:", response.data);

      const messages = response.data.data?.messages || response.data.data || [];
      const pagination = response.data.pagination || null;

      // Debug: Message order from backend
      console.log("MessageService parsed messages:", {
        count: messages.length,
        pagination,
        firstMessage: messages[0]
          ? {
              id: messages[0].id,
              createdAt: messages[0].createdAt,
              content: messages[0].content?.substring(0, 20) + "...",
            }
          : null,
        lastMessage: messages[messages.length - 1]
          ? {
              id: messages[messages.length - 1].id,
              createdAt: messages[messages.length - 1].createdAt,
              content:
                messages[messages.length - 1].content?.substring(0, 20) + "...",
            }
          : null,
      });

      return { messages, pagination };
    } catch (error) {
      console.error("MessageService getMessages error:", error);
      throw error;
    }
  }

  static async sendMessage(messageData: {
    conversationId: string;
    content: string;
  }): Promise<Message> {
    try {
      console.log("MessageService sendMessage start:", messageData);
      const response = await api.post<ApiResponse<any>>(
        "/messages",
        messageData
      );
      console.log("MessageService sendMessage response:", response.data);

      const message = response.data.data?.message || response.data.data;
      console.log("MessageService parsed message:", message);
      return message;
    } catch (error) {
      console.error("MessageService sendMessage error:", error);
      throw error;
    }
  }
}
