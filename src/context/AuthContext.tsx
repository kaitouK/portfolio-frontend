import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import apiService from "../api/interceptor";

// 1. 定義明確的 API 回傳格式
interface AuthStatus {
  isAuthenticated: boolean;
  email?: string;
  role?: "admin" | "user";
  displayName?: string;
}

interface AuthResponse {
  success: boolean;
  data: AuthStatus;
  statusCode?: number;
  message?: string;
}

interface AuthContextType {
  auth: AuthStatus;
  loading: boolean;
  loginWithGoogle: (idToken: string) => Promise<boolean>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [auth, setAuth] = useState<AuthStatus>({ isAuthenticated: false });
  const [loading, setLoading] = useState<boolean>(true);

  const checkStatus = async () => {
    try {
      const res = await apiService.get<any, AuthResponse>("/auth/status");

      if (res && res.success) {
        setAuth(res.data);
      }
    } catch (error) {
      console.error("無法取得驗證狀態", error);
    } finally {
      setLoading(false);
    }
  };
  // 新增：處理前端收到 Google 憑證後的後續登入邏輯
  const loginWithGoogle = async (idToken: string): Promise<boolean> => {
    setLoading(true);
    try {
      const res = await apiService.post<any, AuthResponse>(
        "/auth/google-login",
        { idToken }, // 送給後端 AuthController.GoogleLogin
      );

      if (res && res.success && res.data.isAuthenticated) {
        setAuth(res.data); // 登入成功，將使用者狀態(含admin角色)寫入 Context
        return true;
      }
      return false;
    } catch (error: any) {
      console.error("Google 登入失敗", error);
      // 可以從 error.response.data.message 撈出後端的 "權限不足，拒絕存取" 訊息
      alert(
        error.response?.data?.message ||
          "登入失敗，請確認是否為管理員白名單帳號。",
      );
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await apiService.post("/auth/logout");
      setAuth({ isAuthenticated: false });
      window.location.assign("/"); // 建議使用路徑跳轉而非單純 reload
    } catch (error) {
      console.error("登出失敗", error);
    }
  };

  useEffect(() => {
    checkStatus();
  }, []);

  return (
    <AuthContext.Provider value={{ auth, loading, loginWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
