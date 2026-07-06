import React from "react";
import { useAuth } from "../hooks/useAuth";
import { GoogleLogin, type CredentialResponse } from "@react-oauth/google";

const Login: React.FC = () => {
  const { auth, loading, loginWithGoogle, logout } = useAuth();

  //登入成功的回呼函式
  const handleSuccess = async (credentialResponse: CredentialResponse) => {
    console.log("Google 登入成功");
    if (credentialResponse.credential) {
      await loginWithGoogle(credentialResponse.credential);
    }
  };
  //登入失敗的回呼函式
  const handleFailure = () => {
    console.log("google login failed");
  };

  if (loading) return <div className="text-center p-10">驗證中...</div>;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="p-8 bg-white shadow-xl rounded-2xl max-w-sm w-full text-center">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">後台管理系統</h2>

        {auth.isAuthenticated ? (
          <div>
            <p className="text-green-600 mb-4">✅ 已成功登入</p>
            <p className="text-sm text-gray-500 mb-6">{auth.email}</p>
            <button
              onClick={logout}
              className="w-full py-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
            >
              登出
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <p className="text-gray-500 text-sm mb-8">
              請使用 Google 帳號登入
              <br />
              系統將自動核對管理員白名單身份
            </p>

            {/* 直接使用套件元件，樣式、外觀、寬度都能直接透過 props 調整 */}
            <GoogleLogin
              onSuccess={handleSuccess}
              onError={handleFailure}
              theme="outline"
              size="large"
              width="320"
              shape="rectangular"
              text="signin_with"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;
