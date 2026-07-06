import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const Header = () => {
  const { auth } = useAuth();
  const isAdmin = auth.isAuthenticated && auth.role === "admin";
  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* 左側 Logo 或 標題 */}
        <Link to="/" className="text-xl font-bold text-slate-900">
          個人作品集
        </Link>

        {/* 右側導航連結 */}
        <nav className="flex gap-1">
          {isAdmin && (
            <Link
              to="/upload"
              className="px-4 py-2 text-slate-600 font-medium rounded-lg hover:bg-slate-100 hover:text-blue-600 transition-colors"
            >
              上傳圖片
            </Link>
          )}
          <Link
            to="/login"
            className="px-4 py-2 text-slate-600 font-medium rounded-lg hover:bg-slate-100 hover:text-blue-600 transition-colors"
          >
            管理員登入
          </Link>
          <Link
            to="/lists"
            className="px-4 py-2 text-slate-600 font-medium rounded-lg hover:bg-slate-100 hover:text-blue-600 transition-colors"
          >
            作品展示牆
          </Link>
          <Link
            to="/timeline"
            className="px-4 py-2 text-slate-600 font-medium rounded-lg hover:bg-slate-100 hover:text-blue-600 transition-colors"
          >
            日誌
          </Link>
        </nav>
      </div>
    </header>
  );
};

export default Header;
