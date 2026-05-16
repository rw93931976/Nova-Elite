import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  base: './',
  plugins: [
    react(),
    VitePWA({
      selfDestroying: true, // Reset service worker to clear caching conflicts
      registerType: 'autoUpdate',
      // Note: this repo does not ship a PNG icon; keep the manifest aligned to shipped assets.
      includeAssets: ['favicon.ico', 'favicon.svg', 'icon.svg', 'vite.svg'],
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
            src: 'icon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any'
          },
          {
            src: 'icon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'maskable'
          }
        ]
      }
    })
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: undefined, // Force NO CHUNKS
      },
    },
    chunkSizeWarningLimit: 2000,
  },
  define: {
    __BUILD_DATE__: JSON.stringify(new Date().toISOString()),
  },
  server: {
    allowedHosts: ['nova.mysimpleaihelp.com'],
    proxy: {
      '/bridge-vps': {
        target: 'https://nova.mysimpleaihelp.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/bridge-vps/, '')
      },
      '/api': {
        target: 'https://nova.mysimpleaihelp.com',
        changeOrigin: true
      },
      '/deep-discovery': {
        target: 'https://nova.mysimpleaihelp.com',
        changeOrigin: true
      },
      '/health': {
        target: 'https://nova.mysimpleaihelp.com',
        changeOrigin: true
      }
    }
  }
})
