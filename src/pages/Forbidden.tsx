import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const ForbiddenPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(5); //倒數五秒

  const isAuthorizedAccess =
    location.state?.comingFromInterceptor || location.state?.isInternalRedirect;

  useEffect(() => {
    if (!isAuthorizedAccess) {
      navigate("/", { replace: true });
      return;
    }
    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);
    const redirectTimeout = setTimeout(() => {
      navigate("/", { replace: true });
    }, 5000);

    //清除定時器，防止內存洩漏
    return () => {
      clearInterval(timer);
      clearTimeout(redirectTimeout);
    };
  }, [isAuthorizedAccess, navigate]);

  // 如果非法進入，在 useEffect 執行前會渲染 null 或是 loading
  if (!isAuthorizedAccess) return null;

  return (
    <div className="flex justify-center items-center min-h-[calc(100vh-64px)] p-10 bg-slate-50/30">
      <div className="max-w-md w-full p-10 bg-white rounded-2xl shadow-xl border border-slate-100 text-center hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
        {/* 警示圖示 */}
        <div className="mb-6 inline-flex items-center justify-center w-16 h-16 bg-amber-50 rounded-full">
          <svg
            className="w-8 h-8 text-amber-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>

        {/* 標題 */}
        <h1 className="text-4xl font-black text-slate-800">存取受限</h1>

        {/* 內文 */}
        <p className="mt-4 text-slate-500 leading-relaxed">
          抱歉，你目前的帳號權限不足以訪問此內容。
          <br />
        </p>

        {/* 倒數計時提示框 */}
        <div className="mt-8 p-4 bg-slate-50 rounded-xl border border-slate-100">
          <p className="text-sm text-slate-400 font-medium">
            頁面將在{" "}
            <span className="text-amber-600 font-bold text-lg mx-1">
              {countdown}
            </span>{" "}
            秒後自動返回
          </p>
          {/* 簡易進度條動畫 */}
          <div className="mt-3 w-full bg-slate-200 h-1 rounded-full overflow-hidden">
            <div
              className="bg-amber-400 h-full transition-all duration-1000 ease-linear"
              style={{ width: `${(countdown / 5) * 100}%` }}
            />
          </div>
        </div>

        {/* 按鈕 */}
        <button
          onClick={() => navigate("/", { replace: true })}
          className="mt-8 w-full py-3 px-6 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl shadow-lg shadow-slate-200 transition-all duration-200 active:scale-95"
        >
          立即回首頁
        </button>
      </div>
    </div>
  );
};

export default ForbiddenPage;
