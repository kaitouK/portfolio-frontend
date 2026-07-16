import axios, { type AxiosInstance } from 'axios';
import { refreshToken } from './AuthService';
import { setMemoryToken, getMemoryToken } from './tokenStore';
import { API_BASE_URL } from '../config/ApiUrl';
const apiService: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,//讀取環境變數
  timeout: 30000,
  withCredentials: true,
});
apiService.interceptors.request.use((config) => {
  const token = getMemoryToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
},
  (error) => {
    return Promise.reject(error);
  }
);
apiService.interceptors.response.use(
  (response) => {

    const res = response.data;

    if (res && res.success === false) {
      alert(`操作失敗！\n狀態碼：${res.statusCode}\n訊息：${res.message}`);
      return Promise.reject(new Error(res.message || 'Error'));
    }
    return res;//直接回傳data
  },
  async (error) => {
    const status = error.response?.status;
    const originalRequest = error.config;
    switch (status) {
      case 401: {
        const requestUrl = originalRequest?.url || '';
        if (requestUrl.includes('/auth/')) {
          console.error('[Interceptor] 驗證相關請求失敗');
          return Promise.reject(error);
        }

        console.error('Access Token 已過期，嘗試自動刷新...');
        if (originalRequest._retry) {
          setMemoryToken(null);
          window.location.href = `${import.meta.env.BASE_URL}login`;
          break;
        }
        originalRequest._retry = true;

        const authStatus = await refreshToken();
        if (authStatus && authStatus.accessToken) {
          // 刷新成功：更新當前請求的 Header，並直接重新發送
          originalRequest.headers.Authorization = `Bearer ${authStatus.accessToken}`;
          return apiService(originalRequest); // 拿到新 Token 後，重新發送
        }
        // 刷新失敗：不導頁的承諾已在 refreshToken 內處理。
        // 但由於是在 API 攔截器中完全失敗，此處仍需引導使用者重新登入
        console.error('無效的憑證，重定向至登入頁面');
        setMemoryToken(null);
        window.location.href = `${import.meta.env.BASE_URL}login`;
        break;
      }
      case 403:
        console.error('權限不足，拒絕存取');
        window.dispatchEvent(new CustomEvent('api-forbidden', {
          detail: { authenticated: true }
        }));
        break;
      case 405:
        console.error('方法錯誤');
        break;
      case 500:
        console.error('伺服器錯誤，請稍後再試');
        break;
    }
    // 必須 reject，否則呼叫端 await 到的是 undefined 而非進入 catch
    return Promise.reject(error);
  }
);

export default apiService;