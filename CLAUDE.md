# 前端 — Vite + React + TypeScript

## 技術棧

- 建置：Vite（dev 用 @vitejs/plugin-basic-ssl 走 HTTPS，port 5173）
- 樣式：Tailwind CSS v4（@tailwindcss/vite 外掛，非舊版 tailwind.config.js）
- 路由：react-router-dom
- HTTP：axios
- 驗證：zod（+ zod-validation-error）
- 富文本：TipTap（Journal 頁，含自訂 plugins）
- 圖片：yet-another-react-lightbox、tiptap-extension-resize-image
- 登入：@react-oauth/google
- HTML 淨化：dompurify（TipTap 內容渲染前務必淨化）

## 指令

- npm run dev # vite，HTTPS，port 5173
- npm run build # tsc -b && vite build（型別檢查會擋建置，改完請確認 tsc 通過）
- npm run lint # eslint .
- npm run preview

## API 連接

- 讀絕對 baseURL，來源是環境變數（VITE\_ 前綴，見 .env；本地指向 https://localhost:7098）
- 呼叫全部走 src/api/，勿在元件內散落硬編網址

## 目錄

- src/api/ — axios 實例與 API 封裝
- src/services/ — 資料/邏輯服務
- src/context/ — React Context（如 auth 狀態）
- src/hooks/ — 自訂 hooks
- src/Pages/ — Artworks、Journal、Component（共用元件）
- src/types/ — 共用型別
- src/utils/ — 工具函式

## 慣例

- 一律函式元件 + hooks；型別明確，避免 any
- 表單/API 輸出用 zod 驗證
