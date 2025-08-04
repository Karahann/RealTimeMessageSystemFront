"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { AuthUser, LoginRequest, RegisterRequest } from "../types";
import { AuthService } from "../services/auth";

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  register: (userData: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (updates: {
    username?: string;
    email?: string;
    currentPassword?: string;
    newPassword?: string;
  }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user && !!token;

  useEffect(() => {
    // Check for stored token on mount
    const initializeAuth = async () => {
      try {
        console.log("AuthContext: Starting auth initialization");
        const storedToken = AuthService.getStoredToken();
        console.log("AuthContext: Stored token found:", !!storedToken);

        if (storedToken) {
          setToken(storedToken);
          console.log("AuthContext: Token set, fetching user profile");

          // Validate token by fetching user profile
          const userData = await AuthService.getMe();
          console.log("AuthContext: User data received:", userData);
          setUser(userData);
          console.log("AuthContext: Auth initialization successful");
        } else {
          console.log("AuthContext: No stored token found");
        }
      } catch (error) {
        console.error("AuthContext: Auth initialization error:", error);
        // Clear invalid tokens - API interceptor will handle 401 redirect
        AuthService.clearTokens();
        setUser(null);
        setToken(null);
        console.log("AuthContext: Cleared invalid tokens");
      } finally {
        setIsLoading(false);
        console.log(
          "AuthContext: Auth initialization completed, isLoading set to false"
        );
      }
    };

    initializeAuth();
  }, []);

  const login = async (credentials: LoginRequest) => {
    try {
      console.log("AuthContext login start");
      setIsLoading(true);
      const authData = await AuthService.login(credentials);

      console.log("AuthContext got authData:", authData);

      // Store tokens
      AuthService.storeTokens(authData.tokens);

      // Update state
      setUser(authData.user);
      setToken(authData.tokens.accessToken);

      console.log("AuthContext login success");
    } catch (error) {
      console.error("AuthContext login error:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: RegisterRequest) => {
    try {
      console.log("AuthContext register start");
      setIsLoading(true);
      const authData = await AuthService.register(userData);

      console.log("AuthContext got register authData:", authData);

      // Store tokens
      AuthService.storeTokens(authData.tokens);

      // Update state
      setUser(authData.user);
      setToken(authData.tokens.accessToken);

      console.log("AuthContext register success");
    } catch (error) {
      console.error("AuthContext registration error:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      await AuthService.logout();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      // Clear state regardless of API success
      setUser(null);
      setToken(null);
      AuthService.clearTokens();
      setIsLoading(false);
    }
  };

  const updateProfile = async (updates: {
    username?: string;
    email?: string;
    currentPassword?: string;
    newPassword?: string;
  }) => {
    try {
      setIsLoading(true);
      const updatedUser = await AuthService.updateProfile(updates);
      setUser(updatedUser);
    } catch (error) {
      console.error("Profile update error:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
