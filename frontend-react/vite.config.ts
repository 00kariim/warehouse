import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// In Docker the backend is reachable at http://backend:8080.
// Locally it runs on http://localhost:8080.
const apiTarget = process.env.API_TARGET ?? 'http://localhost:8080'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 3000,
    proxy: {
      '/api': {
        target: apiTarget,
        changeOrigin: true,
      },
    },
  },
  preview: {
    host: '0.0.0.0',
    port: 3000,
  },
})
