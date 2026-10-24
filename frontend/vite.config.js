import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // Must match the Google "Authorized JavaScript origin" and the backend CORS setting
    port: 5173,
    strictPort: true,
  },
})