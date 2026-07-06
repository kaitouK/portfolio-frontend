import { useEffect } from "react";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import Main from "./pages/Main";
import ImageUploader from "./pages/Upload";
import ArtworkGallery from "./pages/ArtworkGallery";
import Header from "./components/Header";
import Login from "./pages/Login";
import ForbiddenPage from "./pages/Forbidden";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Timeline from "./pages/Timeline";

const NavigationHandler = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // 監聽攔截器發出的 403 事件
    const handle403 = () => {
      navigate("/forbidden", {
        state: { comingFromInterceptor: true },
        replace: true,
      });
    };

    window.addEventListener("api-forbidden", handle403);

    // 清除監聽器
    return () => window.removeEventListener("api-forbidden", handle403);
  }, [navigate]);

  return null; // 此組件不渲染任何東西
};

const App = () => {
  return (
    <AuthProvider>
      <BrowserRouter basename="/portfolio-frontend">
        <NavigationHandler />
        <div className="flex flex-col min-h-screen bg-blue-300">
          {/* 定義路徑與組件的對應關係 */}
          <Header />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<Main />} />
              <Route
                path="/upload"
                element={
                  <ProtectedRoute adminOnly={true}>
                    <ImageUploader />
                  </ProtectedRoute>
                }
              />
              <Route path="/lists" element={<ArtworkGallery />} />
              <Route path="/timeline" element={<Timeline />} />
              <Route path="/login" element={<Login />} />
              <Route path="/forbidden" element={<ForbiddenPage />} />
              {/* 萬用路由：處理 404 */}
              <Route path="*" element={<Main />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
