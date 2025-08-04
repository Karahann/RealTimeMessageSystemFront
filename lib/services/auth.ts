import api, { ApiResponse } from "../api";
import {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  AuthUser,
} from "../types";

export class AuthService {
  static async login(credentials: LoginRequest): Promise<AuthResponse> {
    try {
      console.log("Login attempt:", credentials);
      const response = await api.post<ApiResponse<any>>(
        "/auth/login",
        credentials
      );

      console.log("Backend response:", response.data);
      const backendData = response.data.data!;

      const authResponse = {
        user: backendData.user,
        tokens: {
          accessToken: backendData.accessToken,
          refreshToken: backendData.refreshToken,
        },
      };

      console.log("Parsed auth response:", authResponse);
      return authResponse;
    } catch (error) {
      console.error("AuthService login error:", error);
      throw error;
    }
  }

  static async register(userData: RegisterRequest): Promise<AuthResponse> {
    try {
      console.log("Register attempt:", userData);
      const response = await api.post<ApiResponse<any>>(
        "/auth/register",
        userData
      );

      console.log("Backend register response:", response.data);
      const backendData = response.data.data!;

      const authResponse = {
        user: backendData.user,
        tokens: {
          accessToken: backendData.accessToken,
          refreshToken: backendData.refreshToken,
        },
      };

      console.log("Parsed register auth response:", authResponse);
      return authResponse;
    } catch (error) {
      console.error("AuthService register error:", error);
      throw error;
    }
  }

  static async refreshToken(refreshToken: string): Promise<AuthResponse> {
    const response = await api.post<ApiResponse<any>>("/auth/refresh", {
      refreshToken,
    });

    const backendData = response.data.data!;
    return {
      user: backendData.user,
      tokens: {
        accessToken: backendData.accessToken,
        refreshToken: backendData.refreshToken,
      },
    };
  }

  static async getMe(): Promise<AuthUser> {
    try {
      console.log("AuthService getMe start");
      const response = await api.get<ApiResponse<any>>("/auth/me");
      console.log("AuthService getMe response:", response.data);

      // Backend response formatını kontrol et
      const user = response.data.data?.user || response.data.data;
      console.log("AuthService parsed user:", user);

      if (!user) {
        throw new Error("User data not found in response");
      }

      return user;
    } catch (error) {
      console.error("AuthService getMe error:", error);
      throw error;
    }
  }

  static async updateProfile(updates: {
    username?: string;
    email?: string;
    currentPassword?: string;
    newPassword?: string;
  }): Promise<AuthUser> {
    const response = await api.put<ApiResponse<{ user: AuthUser }>>(
      "/auth/profile",
      updates
    );
    return response.data.data!.user;
  }

  static async logout(): Promise<void> {
    await api.post("/auth/logout");
    // Clear local storage
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
  }

  // Helper methods
  static getStoredToken(): string | null {
    return localStorage.getItem("accessToken");
  }

  static getStoredRefreshToken(): string | null {
    return localStorage.getItem("refreshToken");
  }

  static storeTokens(tokens: {
    accessToken: string;
    refreshToken: string;
  }): void {
    localStorage.setItem("accessToken", tokens.accessToken);
    localStorage.setItem("refreshToken", tokens.refreshToken);
  }

  static clearTokens(): void {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
  }

  static isAuthenticated(): boolean {
    return !!this.getStoredToken();
  }
}
