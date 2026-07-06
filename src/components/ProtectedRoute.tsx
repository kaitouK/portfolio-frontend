import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

interface ProtectedRouteProps {
  children: ReactNode;
  adminOnly?: boolean;
}

const ProtectedRoute = ({
  children,
  adminOnly = false,
}: ProtectedRouteProps) => {
  const { auth, loading } = useAuth();

  // 1. 還在請求 API 驗證時，顯示載入中，避免過早跳轉
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-white">驗證中...</p>
      </div>
    );
  }

  // 2. 檢查是否登入
  if (!auth.isAuthenticated) {
    return (
      <Navigate to="/forbidden" state={{ isInternalRedirect: true }} replace />
    );
  }

  if (adminOnly && auth.role !== "admin") {
    // 關鍵點：在這裡帶入 isInternalRedirect，你的 ForbiddenPage 才能顯示文字
    return (
      <Navigate to="/forbidden" state={{ isInternalRedirect: true }} replace />
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
