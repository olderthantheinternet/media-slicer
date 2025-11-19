import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// For GitHub Pages: if your repo is named "media-slicer", use '/media-slicer/'
// For custom domain or user.github.io repos, use '/'
// The base path must end with a slash for GitHub Pages
const getBase = () => {
  if (process.env.VITE_BASE_PATH) {
    return process.env.VITE_BASE_PATH
  }
  // In production (GitHub Pages), use the repo name as base path
  if (process.env.NODE_ENV === 'production') {
    return '/media-slicer/'
  }
  // In development, use root
  return '/'
}

export default defineConfig({
  plugins: [react()],
  base: getBase(),
  server: {
    port: 3000
  },
  optimizeDeps: {
    exclude: ['@ffmpeg/ffmpeg', '@ffmpeg/util']
  }
})

