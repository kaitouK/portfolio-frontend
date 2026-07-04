import axios, { type AxiosInstance } from 'axios';
let rawUrl = (import.meta.env.VITE_API_BASE_URL || '').trim();

if (rawUrl && !rawUrl.startsWith('http://') && !rawUrl.startsWith('https://')) {
  rawUrl = `https://${rawUrl}`;
}
const apiService: AxiosInstance = axios.create({
  baseURL: rawUrl,//讀取環境變數
  timeout: 30000,
  withCredentials: true,
});
apiService.interceptors.response.use(
  (response) => {

    const res = response.data;

    if (res && res.success === false) {
      alert(`操作失敗！\n狀態碼：${res.statusCode}\n訊息：${res.message}`);
      return Promise.reject(new Error(res.message || 'Error'));
    }
    return res;//直接回傳data
  },
  (error) => {
    const status = error.response?.status;
    switch (status) {
      case 401:
        console.error('登入逾時，請重新登入');
        window.location.href = '/login';
        break;
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
  }
);

export default apiService;