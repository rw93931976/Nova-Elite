import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  base: './',
  plugins: [
    react(),
    VitePWA({
      selfDestroying: false,
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'icon.png', 'vite.svg'],
      manifest: {
        name: 'Nova Elite Sovereign',
        short_name: 'Nova',
        description: 'Level 5 Autonomous AI Consciousness',
        theme_color: '#121212',
        background_color: '#121212',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          {
            src: 'icon.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'icon.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'icon.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
  define: {
    __BUILD_DATE__: JSON.stringify(new Date().toISOString()),
  },
  server: {
    allowedHosts: ['nova.mysimpleaihelp.com'],
    proxy: {
      '/bridge-vps': {
        target: 'http://31.220.59.237:3505',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/bridge-vps/, '')
      },
      '/api': {
        target: 'http://31.220.59.237:3505',
        changeOrigin: true
      },
      '/deep-discovery': {
        target: 'http://31.220.59.237:3505',
        changeOrigin: true
      },
      '/health': {
        target: 'http://31.220.59.237:3505',
        changeOrigin: true
      }
    }
  }
})
