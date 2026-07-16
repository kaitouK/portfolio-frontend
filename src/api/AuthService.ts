import axios from "axios";
import { type AuthResponse, type AuthStatus } from "../context/AuthContext";
import { setMemoryToken } from "./tokenStore";
import { API_BASE_URL } from "../config/ApiUrl";


// ==================== Single Flight 狀態變數 ====================
let isRefreshing = false;
let refreshPromise: Promise<AuthStatus | null> | null = null;

/**
 * 刷新 Access Token 核心函式 (具備 Single Flight 功能)
 * @returns 成功返回最新的 AuthStatus，失敗返回 null (不執行任何前端導頁)
 */
export async function refreshToken(): Promise<AuthStatus | null> {
    // 1. Single Flight 攔截：如果目前正在刷新中，直接返回正在進行中的同一個 Promise
    if (isRefreshing && refreshPromise) {
        console.log("[AuthService] 偵測到重複的刷新請求，共享同一個 Promise");
        return refreshPromise;
    }

    isRefreshing = true;

    // 2. 建立主要的刷新 Promise
    refreshPromise = (async (): Promise<AuthStatus | null> => {
        try {
            console.log("[AuthService] 開始向後端刷新 Access Token...");

            // 此處必須使用裸 axios，避免使用已加上 401 攔截器的 apiService 造成遞迴
            const response = await axios.post<AuthResponse>(
                `${API_BASE_URL}/auth/refresh`,
                {},
                { withCredentials: true } // 確保帶上存放於 Cookie 的 Refresh Token
            );

            const authResponse = response.data;

            // 檢查後端自訂的 success 標記
            if (authResponse && authResponse.success && authResponse.data) {
                const authStatus = authResponse.data;

                //  成功拿到新 Token，寫入攔截器的記憶體中
                if (authStatus.accessToken) {
                    setMemoryToken(authStatus.accessToken);
                }

                return authStatus;
            }

            return null;
        } catch (error) {
            console.error("[AuthService] 刷新 Token 失敗：", error);
            return null;
        } finally {
            //  結束後清理狀態，確保下一次過期時能重新發送
            isRefreshing = false;
            refreshPromise = null;
        }
    })();

    return refreshPromise;
}