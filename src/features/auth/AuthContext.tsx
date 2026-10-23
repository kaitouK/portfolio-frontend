import { createContext } from "react";

// 定義明確的 API 回傳格式
export interface AuthStatus {
  isAuthenticated: boolean;
  email?: string;
  role?: "admin" | "user";
  displayName?: string;
  accessToken?: string;
}

export interface AuthResponse {
  success: boolean;
  data: AuthStatus;
  statusCode?: number;
  message?: string;
}

export interface AuthContextType {
  auth: AuthStatus;
  loading: boolean;
  loginWithGoogle: (idToken: string) => Promise<boolean>;
  logout: () => Promise<void>;
  checkStatus: () => Promise<boolean>;
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined,
);
