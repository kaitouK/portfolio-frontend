//已棄用
import axios ,{type AxiosInstance} from 'axios';


const apiClient: AxiosInstance = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || 'https://localhost:7098/api',//讀取環境變數
    timeout: 5000,
    withCredentials: true,
});
export default apiClient;