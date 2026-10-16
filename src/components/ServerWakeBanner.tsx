import { useSyncExternalStore } from "react";
import { getWaking, subscribeWaking } from "../api/coldStart";

// 後端冷啟動（Azure F1 閒置卸載）時的提示，不擋操作
const ServerWakeBanner = () => {
  const waking = useSyncExternalStore(subscribeWaking, getWaking);

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed bottom-4 left-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2"
    >
      {waking && (
        <div className="flex items-center gap-3 px-4 py-3 bg-white/90 backdrop-blur-md border border-slate-100 rounded-xl shadow-lg text-sm text-slate-600">
          <span className="size-4 shrink-0 rounded-full border-2 border-slate-300 border-t-blue-600 animate-spin" />
          <p>伺服器喚醒中，第一次載入可能需要 30 秒到 1 分鐘，請稍候…</p>
        </div>
      )}
    </div>
  );
};

export default ServerWakeBanner;
