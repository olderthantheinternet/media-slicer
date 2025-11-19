import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// For GitHub Pages: if your repo is named "media-slicer", use '/media-slicer/'
// For custom domain or user.github.io repos, use '/'
const base = process.env.VITE_BASE_PATH || (process.env.NODE_ENV === 'production' ? '/media-slicer/' : '/')

export default defineConfig({
  plugins: [react()],
  base: base,
  server: {
    port: 3000
  },
  optimizeDeps: {
    exclude: ['@ffmpeg/ffmpeg', '@ffmpeg/util']
  }
})

