import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/soop-api': {
        target: 'https://bjapi.afreecatv.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/soop-api/, ''),
      },
      '/soop-channel': {
        target: 'https://api-channel.sooplive.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/soop-channel/, ''),
      },
      '/soop-vod': {
        target: 'https://vod.sooplive.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/soop-vod/, ''),
      },
      '/soop-sch': {
        target: 'https://sch.sooplive.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/soop-sch/, ''),
      },
      '/soop-station': {
        target: 'https://www.sooplive.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/soop-station/, ''),
      },
    },
  },
})
