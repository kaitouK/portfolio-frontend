# 前端 — Vite + React + TypeScript

## 技術棧

- 建置：Vite（dev 用 @vitejs/plugin-basic-ssl 走 HTTPS，port 5173）
- 樣式：Tailwind CSS v4（@tailwindcss/vite 外掛，非舊版 tailwind.config.js）
- 路由：react-router-dom
- HTTP：axios
- 富文本：TipTap（Journal 頁，含自訂 plugins）
- 圖片：yet-another-react-lightbox、tiptap-extension-resize-image
- 登入：@react-oauth/google
- HTML 淨化：dompurify（TipTap 內容渲染前務必淨化）

## 指令

- npm run dev # vite，HTTPS，port 5173
- npm run build # tsc -b && vite build（型別檢查會擋建置，改完請確認 tsc 通過）
- npm run lint # eslint .
- npm run preview
- npm run typecheck #tsc -b
- npm run test # vitest run（測試檔與原始碼同目錄，\*.test.ts）
- npm run test:watch # vitest watch 模式
- npm run test:all # lint + typecheck + vitest 一次跑完（根目錄 npm run test 會呼叫這個）

## API 連接

- 讀絕對 baseURL，來源是環境變數（VITE\_ 前綴，見 .env；本地指向 https://localhost:7098）
- 呼叫全部走 src/api/，勿在元件內散落硬編網址

## 目錄（feature-based）

- src/api/ — axios 實例與回應攔截器
- src/components/ — 跨功能共用元件（Header、ProtectedRoute、SocialIcons）
- src/context/ — React Context（auth 狀態）
- src/features/ — 功能模組（artworks、categories、journal）；元件/hook/service/型別跟著功能走
- src/pages/ — 只放路由目標元件（App.tsx 的 \<Route\> 一對一對應），頁面保持薄
- src/types/ — 跨功能共用型別（ApiResponse 信封、CursorPagedResult）
- src/utils/ — 純工具函式（含 \*.test.ts 同目錄測試）

分類規則：只有單一功能使用 → 放 features/該功能/；兩個以上功能使用 → 提升到 components/、utils/、types/

## 慣例

- 一律函式元件 + hooks；型別明確，避免 any
- 表單/API 輸出用 zod 驗證
