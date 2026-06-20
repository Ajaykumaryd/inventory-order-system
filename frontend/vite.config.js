import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// During local development, API calls to /api are proxied to the backend so the
// frontend code can always use relative URLs (which also works in production
// behind a single origin / reverse proxy).
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    proxy: {
      '/api': {
        target: process.env.VITE_DEV_API_TARGET || 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
})
