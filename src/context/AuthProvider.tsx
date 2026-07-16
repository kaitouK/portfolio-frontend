import { useEffect, useState, type ReactNode } from "react";
import apiService from "../api/interceptor";
import { setMemoryToken } from "../api/tokenStore";
import axios from "axios";
import { AuthContext, type AuthStatus, type AuthResponse } from "./AuthContext";
import { refreshToken } from "../api/AuthService";

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [auth, setAuth] = useState<AuthStatus>({ isAuthenticated: false });
  const [loading, setLoading] = useState<boolean>(true);

  const checkStatus = async (): Promise<boolean> => {
    try {
      const authStatus = await refreshToken();

      if (authStatus && authStatus.isAuthenticated) {
        setAuth(authStatus);
        return true;
      }
      setAuth({ isAuthenticated: false });
      return false;
    } catch {
      setAuth({ isAuthenticated: false });
      return false;
    } finally {
      setLoading(false);
    }
  };
  // 處理前端收到 Google 憑證後的後續登入邏輯
  const loginWithGoogle = async (idToken: string): Promise<boolean> => {
    setLoading(true);
    try {
      const res = await apiService.post<unknown, AuthResponse>(
        "/auth/google-login",
        { idToken }, // 送給後端 AuthController.GoogleLogin
      );

      if (res && res.success && res.data.isAuthenticated) {
        setAuth(res.data); // 登入成功，將使用者狀態(含admin角色)寫入 Context
        setMemoryToken(res.data.accessToken || null);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Google 登入失敗", error);
      const message = axios.isAxiosError(error)
        ? error.response?.data?.message
        : undefined;
      alert(message || "登入失敗，請確認是否為管理員白名單帳號。");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setMemoryToken(null);
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
    <AuthContext.Provider
      value={{ auth, loading, loginWithGoogle, logout, checkStatus }}
    >
      {children}
    </AuthContext.Provider>
  );
};
