/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_BASE_URL: string
  readonly VITE_ADMIN_ENTRY: string
  // 這裡可以定義其他環境變數...
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}