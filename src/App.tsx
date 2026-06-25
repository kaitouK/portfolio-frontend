import { useEffect } from "react";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import Main from "./Pages/Main";
import ImageUploader from "./Pages/Upload";
import ArtworkGallery from "./Pages/Artworks/Lists";
import Header from "./Pages/Header";
import Login from "./Pages/Login";
import ForbiddenPage from "./Pages/Forbidden";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./Pages/Component/ProtectedRoute";
import Timeline2 from "./Pages/Journal/Timeline";

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
      <BrowserRouter>
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
              <Route path="/timeline" element={<Timeline2 />} />
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
