# MyPortfolio 前端

個人繪畫作品集網站的 React 單頁應用程式（SPA）。

**正式網站：[https://kaitouk.github.io/portfolio-frontend/](https://kaitouk.github.io/portfolio-frontend/)**

本專案是前後端分離架構的前端部分，部署於 **GitHub Pages**，並與部署在 Azure App Service 上的 [ASP.NET Core Web API 後端](https://github.com/kaitouK/Portfolio-backend) 溝通。身分驗證採用 Google OAuth：後端回傳短效 Access Token（僅存於記憶體，以 Bearer 標頭傳送），並以 HttpOnly Cookie 核發可輪轉的 Refresh Token。

[English README](./README.md)

---

# 技術堆疊

| 技術                       | 用途                                        |
| -------------------------- | ------------------------------------------- |
| Vite 8                     | 建置工具 / 開發伺服器（basic-ssl 走 HTTPS） |
| React 19 + TypeScript      | UI 框架                                     |
| Tailwind CSS v4            | 樣式（`@tailwindcss/vite` 外掛）            |
| react-router-dom 7         | 前端路由                                    |
| axios                      | HTTP 客戶端（統一攔截器）                   |
| TipTap                     | 富文本編輯器（含自訂圖片外掛）              |
| @react-oauth/google        | Google OAuth 彈窗登入                       |
| DOMPurify                  | 渲染前的 HTML 淨化                          |
| yet-another-react-lightbox | 作品燈箱瀏覽                                |
| Vitest                     | 單元測試                                    |

---

# 功能特色

## 作品展示牆

- Cursor-based 無限滾動（IntersectionObserver 在接近清單底部時觸發載入）
- 燈箱瀏覽，支援縮圖列與圖片說明
- 管理員可直接在清單上編輯 / 刪除作品

## 歷程日誌（Timeline）

- TipTap 富文本編輯器（僅管理員可見），含自訂圖片上傳外掛
- 草稿自動儲存（5 秒防抖）；圖片上傳／刪除事件觸發立即儲存
- 進入頁面時偵測未完成草稿並詢問是否還原
- 正式發布流程
- 日誌內容渲染前經過 DOMPurify 淨化

## 圖片上傳

- 拖曳上傳、即時預覽
- 分類選擇
- 前端檔案類型驗證（後端仍會執行完整驗證）

## 身分驗證

- Google OAuth 彈窗登入 → 後端驗證 ID Token 後回傳短效 Access Token，並設定可輪轉的 Refresh Token HttpOnly Cookie
- Access Token 僅存於記憶體（不落地 localStorage），由 request 攔截器以 `Authorization: Bearer` 標頭附加
- 無感刷新（single-flight 保護）：收到 401 時攔截器只呼叫一次 `/auth/refresh`（並發的 401——包括 StrictMode 的雙重執行——共享同一個請求），成功後重送原請求
- 重新整理頁面後透過 HttpOnly Refresh Cookie 還原登入狀態
- 以 React Context（`AuthContext`）管理全域登入狀態
- `ProtectedRoute` 路由守衛（管理員專屬頁面）
- 403 觸發禁止存取頁事件；刷新失敗才導向登入頁

---

# 專案結構

```text
src
├── api            # axios 實例、攔截器、記憶體 token store、無感刷新 service
├── components     # 跨功能共用元件（Header、ProtectedRoute、SocialIcons）
├── context        # AuthContext（全域登入狀態）
├── features       # 功能模組——元件/hook/service/型別跟著功能走
│   ├── artworks   # 卡片、編輯 Modal、作品 service、分頁 hook
│   ├── categories # 分類 service＋hook
│   └── journal    # 編輯器、TipTap 外掛、日誌 service
├── pages          # 只放路由目標（一個 <Route> 一個檔案）
├── types          # 跨功能共用型別（ApiResponse 信封）
└── utils          # 純工具函式（測試檔同目錄）
```

分類規則：只有單一功能使用 → 放 `features/<功能>/`；兩個以上功能使用 → 提升到 `components/`、`utils/` 或 `types/`。

---

# 架構說明

```
元件 ──► 自訂 hook ──► service ──► axios 實例 ──► 後端 API
                                      │
                            request / response 攔截器
                    （附加 Bearer Token、解包 ApiResponse、
                     401 時無感刷新一次並重送原請求、
                       403 觸發禁止存取事件）
```

- 所有 API 呼叫都走 `src/api/` 的共用 axios 實例——元件內不硬編網址。
- 後端回傳統一的 `ApiResponse` 格式（`success` / `statusCode` / `message` / `data`），由攔截器解包。
- request 攔截器將記憶體中的 Access Token 以 `Authorization: Bearer` 標頭附加至每個請求。
- 啟用 `withCredentials: true`，讓 HttpOnly Refresh Cookie（`__Secure-AppRefresh`，Path 限定 `/api/auth`）隨認證請求傳送。

---

# 環境變數

Vite 只會暴露 `VITE_` 前綴的變數。本地值放在 `.env.development` / `.env.production`（皆已 gitignore）；正式環境的值由 GitHub Actions 從 repo secrets 注入。

| 變數                    | 說明                                                      |
| ----------------------- | --------------------------------------------------------- |
| `VITE_API_BASE_URL`     | 後端 API 的絕對 baseURL，例：`https://localhost:7098/api` |
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth Client ID（須與後端設定的 ID 一致）          |
| `VITE_ADMIN_ENTRY`      | 管理員入口頁的路徑片段                                    |

---

# 本地開發

```bash
npm install
npm run dev
```

開發伺服器運行於 **https://localhost:5173**（HTTPS 是必要的——Google OAuth 彈窗與跨站 Secure Cookie 都需要）。後端須同時運行於 `https://localhost:7098`，設定方式見[後端儲存庫](https://github.com/kaitouK/Portfolio-backend)。

其他指令：

```bash
npm run build       # tsc -b && vite build（型別錯誤會擋下建置）
npm run lint        # eslint .
npm run preview     # 在本地預覽正式版建置結果
```

---

# 測試

```bash
npm run test        # 執行一次（vitest run）
npm run test:watch  # watch 模式
```

測試檔與原始碼同目錄（`*.test.ts`）。目前涵蓋範圍以純工具函式為主（URL 組合、分類名稱查找、日期格式化）。

---

# 部署（GitHub Pages）

每次推送至 `main` 分支會觸發 GitHub Actions：

```
推送至 main
      │
      ▼
npm ci → npm run build（VITE_* 來自 repo secrets）
      │
      ▼
複製 index.html → 404.html
      │
      ▼
部署至 GitHub Pages
```

兩個值得記錄的細節：

- **Base path**：網站部署在 `/portfolio-frontend/` 底下，於 `vite.config.ts` 的 `base` 與 `BrowserRouter` 的 `basename` 設定。執行期的跳轉統一使用 `import.meta.env.BASE_URL`，路徑只定義在一個地方。
- **SPA fallback**：GitHub Pages 沒有伺服器端路由改寫，因此建置產物的 `index.html` 會被複製成 `404.html`——直接輸入 `/timeline` 這類深層連結時仍會載入 SPA，而不是顯示 404 頁面。

---

# 授權條款

本專案僅供個人學習與作品集展示使用。
