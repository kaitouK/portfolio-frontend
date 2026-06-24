import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'
import tailwindcss from '@tailwindcss/vite'//匯入插件區

// https://vite.dev/config/
export default defineConfig({//啟用插件區
  plugins: [
    react(),
    tailwindcss(),
    basicSsl(),
  ],
  server: {
    port: 5173,
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
      'Cross-Origin-Embedder-Policy': 'unsafe-none', // 放寬嵌入限制
    }
  },
})
