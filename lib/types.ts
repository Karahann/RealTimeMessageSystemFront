// User Types
export interface User {
  id: string;
  username: string;
  email: string;
  isActive: boolean;
  lastSeen: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthUser {
  id: string;
  username: string;
  email: string;
  isActive: boolean;
}

// Authentication Types
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  user: AuthUser;
  tokens: AuthTokens;
}

// Message Types
export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  messageType: "text" | "auto";
  isRead: boolean;
  readAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  // Populated fields
  sender?: User;
}

export interface SendMessageRequest {
  conversationId: string;
  content: string;
}

// Conversation Types
export interface Conversation {
  id: string;
  participants: string[];
  lastMessage?: string;
  lastMessageAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  // Populated fields
  participantDetails?: User[];
  lastMessageDetails?: Message;
}

export interface CreateConversationRequest {
  participantId: string;
}

// Online User Types
export interface OnlineUserStatus {
  userId: string;
  username: string;
  isOnline: boolean;
  lastSeen?: Date;
}

// Socket.IO Event Types
export interface SocketMessage {
  message: Message;
  timestamp: Date;
  isAutomatic?: boolean;
}

export interface SocketUserStatus {
  userId: string;
  username: string;
  timestamp: Date;
}

export interface SocketTyping {
  userId: string;
  username?: string;
  conversationId: string;
}

export interface SocketJoinRoom {
  conversationId: string;
}

export interface SocketSendMessage {
  conversationId: string;
  content: string;
}

// Chat Interface Types
export interface ChatMessage {
  id: string;
  content: string;
  sender: "user" | "contact";
  senderId: string;
  senderName: string;
  senderUsername: string;
  timestamp: Date;
  isRead?: boolean;
}

export interface ChatUser {
  id: string;
  name: string;
  username: string;
  avatar?: string;
  status: "online" | "offline" | "away";
  unread: number;
  lastMessage?: string;
  lastMessageAt?: Date;
  lastSeen?: Date;
  conversationId?: string; // Conversation ID'si
}
