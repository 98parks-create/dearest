import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    headers: {
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Opener-Policy': 'same-origin',
    },
    // 토스 결제창 차단(CORS/COEP) 문제를 해결하기 위한 프록시 설정
    proxy: {
      '/toss-api': {
        target: 'https://js.tosspayments.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/toss-api/, ''),
      }
    }
  },
})
