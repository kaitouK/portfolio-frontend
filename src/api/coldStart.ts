import axios from "axios";
import { API_BASE_URL } from "../config/ApiUrl";

// 後端在 Azure App Service F1，閒置會被卸載；這裡負責「等後端醒來」與「喚醒中」狀態
declare module "axios" {
  interface InternalAxiosRequestConfig {
    _coldStartRetry?: boolean; // 已經等過後端醒來並重送過一次
    _endTrack?: () => void; // 結束慢請求追蹤
  }
}

// ==================== 冷啟動錯誤判斷 ====================
// Azure 前端回 502/503 時不帶 CORS header，瀏覽器只會看到 ERR_NETWORK、沒有 response
const COLD_START_CODES = new Set(["ECONNABORTED", "ETIMEDOUT", "ERR_NETWORK"]);
const COLD_START_STATUSES = new Set([502, 503, 504]);

export const isColdStartError = (error: unknown): boolean => {
  if (!axios.isAxiosError(error)) return false;
  if (error.response) return COLD_START_STATUSES.has(error.response.status);
  return error.code !== undefined && COLD_START_CODES.has(error.code);
};

// ==================== 喚醒中狀態（給 ServerWakeBanner 訂閱） ====================
export const SLOW_REQUEST_MS = 3000;

const listeners = new Set<() => void>();
let slowRequests = 0;
let activeWaits = 0;
let waking = false;

const updateWaking = () => {
  const next = activeWaits > 0 || slowRequests > 0;
  if (next === waking) return;
  waking = next;
  listeners.forEach((listener) => listener());
};

export const subscribeWaking = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export const getWaking = () => waking;

/**
 * 開始追蹤一個請求：超過 SLOW_REQUEST_MS 還沒結束就視為「喚醒中」
 * @returns 結束追蹤的函式，重複呼叫無副作用
 */
export const beginRequest = (): (() => void) => {
  let slow = false;
  let ended = false;
  const timer = setTimeout(() => {
    slow = true;
    slowRequests++;
    updateWaking();
  }, SLOW_REQUEST_MS);

  return () => {
    if (ended) return;
    ended = true;
    clearTimeout(timer);
    if (slow) {
      slowRequests--;
      updateWaking();
    }
  };
};

// ==================== 等後端醒來（Single Flight） ====================
interface BackendWaiterOptions {
  probe: () => Promise<unknown>;
  intervalMs: number;
  deadlineMs: number;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const createBackendWaiter = ({
  probe,
  intervalMs,
  deadlineMs,
}: BackendWaiterOptions) => {
  let pending: Promise<boolean> | null = null;

  const tryProbe = () =>
    probe().then(
      () => true,
      () => false,
    );

  const run = async (): Promise<boolean> => {
    const deadline = Date.now() + deadlineMs;
    let ready = await tryProbe();
    while (!ready && Date.now() + intervalMs <= deadline) {
      await sleep(intervalMs);
      ready = await tryProbe();
    }
    return ready;
  };

  /**
   * 反覆探測直到後端回應或超過期限；同時間多次呼叫共用同一個 Promise
   * @returns 後端醒來回傳 true，超過期限回傳 false
   */
  const waitForBackend = (): Promise<boolean> => {
    if (pending) return pending;
    activeWaits++;
    updateWaking();
    pending = run().finally(() => {
      pending = null;
      activeWaits--;
      updateWaking();
    });
    return pending;
  };

  /** 喚醒進行中就等它結束，否則立刻返回 */
  const waitIfWaking = async (): Promise<void> => {
    if (pending) await pending;
  };

  return { waitForBackend, waitIfWaking };
};

// 裸 axios 探測，避免經過 apiService 攔截器造成遞迴
export const { waitForBackend, waitIfWaking } = createBackendWaiter({
  probe: () => axios.get(`${API_BASE_URL}/health`, { timeout: 15000 }),
  intervalMs: 3000,
  deadlineMs: 120000,
});
