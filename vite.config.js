import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// For GitHub Pages: if your repo is named "media-slicer", use '/media-slicer/'
// For custom domain or user.github.io repos, use '/'
// The base path must end with a slash for GitHub Pages
const getBase = () => {
  if (process.env.VITE_BASE_PATH) {
    return process.env.VITE_BASE_PATH
  }
  // For custom domain, use root path '/'
  // For GitHub Pages with repo name, use '/media-slicer/'
  // Default to '/' for custom domains
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

