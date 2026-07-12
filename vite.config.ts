import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    entries: ['./index.html'],
  },
  esbuild: {
    loader: 'tsx',
  },
  server: {
    port: 5173,
  },
})
