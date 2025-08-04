import api, { ApiResponse } from "../api";
import { User, OnlineUserStatus } from "../types";

export class UserService {
  static async getUsers(): Promise<User[]> {
    try {
      console.log("UserService getUsers start");
      const response = await api.get<ApiResponse<any>>("/users/list");
      console.log("UserService getUsers response:", response.data);

      // Backend response formatını kontrol et
      const users = response.data.data?.users || response.data.data || [];
      console.log("UserService parsed users:", users);
      return users;
    } catch (error) {
      console.error("UserService getUsers error:", error);
      throw error;
    }
  }

  static async getOnlineUserCount(): Promise<number> {
    try {
      console.log("UserService getOnlineUserCount start");
      const response = await api.get<ApiResponse<any>>("/users/online/count");
      console.log("UserService getOnlineUserCount response:", response.data);

      const count =
        response.data.data?.onlineUserCount || response.data.data || 0;
      console.log("UserService parsed count:", count);
      return count;
    } catch (error) {
      console.error("UserService getOnlineUserCount error:", error);
      throw error;
    }
  }

  static async getUserOnlineStatus(userId: string): Promise<OnlineUserStatus> {
    try {
      console.log("UserService getUserOnlineStatus start:", userId);
      const response = await api.get<ApiResponse<any>>(
        `/users/online/status/${userId}`
      );
      console.log("UserService getUserOnlineStatus response:", response.data);

      const status = response.data.data;
      console.log("UserService parsed status:", status);
      return status;
    } catch (error) {
      console.error("UserService getUserOnlineStatus error:", error);
      throw error;
    }
  }

  static async getOnlineUsers(): Promise<OnlineUserStatus[]> {
    try {
      console.log("UserService getOnlineUsers start");
      const response = await api.get<ApiResponse<any>>("/users/online/list");
      console.log("UserService getOnlineUsers full response:", response);
      console.log("UserService getOnlineUsers response.data:", response.data);
      console.log(
        "UserService getOnlineUsers response.data.data:",
        response.data.data
      );

      // Try different possible response structures
      let users = [];
      if (response.data.data?.onlineUsers) {
        users = response.data.data.onlineUsers;
        console.log("UserService: Found users in data.onlineUsers:", users);
      } else if (response.data.data && Array.isArray(response.data.data)) {
        users = response.data.data;
        console.log("UserService: Found users in data (array):", users);
      } else if (
        response.data.onlineUsers &&
        Array.isArray(response.data.onlineUsers)
      ) {
        users = response.data.onlineUsers;
        console.log("UserService: Found users in onlineUsers:", users);
      } else if (Array.isArray(response.data)) {
        users = response.data;
        console.log("UserService: Response data is direct array:", users);
      } else {
        console.warn(
          "UserService: Could not find users in response, defaulting to empty array"
        );
        users = [];
      }

      console.log("UserService parsed online users final:", users);
      return users;
    } catch (error) {
      console.error("UserService getOnlineUsers error:", error);
      console.error(
        "UserService getOnlineUsers error response:",
        error.response?.data
      );
      throw error;
    }
  }
}
