import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig({
  base: './',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icon.svg', 'pwa-192x192.png', 'pwa-512x512.png'],
      manifest: {
        name: 'Kate Control Room',
        short_name: 'Kate',
        description: 'Kate — sovereign voice AI control room',
        theme_color: '#121212',
        background_color: '#121212',
        display: 'standalone',
        orientation: 'portrait',
        start_url: './',
        scope: './',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
          {
            src: 'icon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any',
          },
        ],
      },
      workbox: {
        navigateFallback: 'index.html',
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
      },
    }),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: undefined,
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
        rewrite: path => path.replace(/^\/bridge-vps/, ''),
      },
      '/api': {
        target: 'https://nova.mysimpleaihelp.com',
        changeOrigin: true,
      },
      '/deep-discovery': {
        target: 'https://nova.mysimpleaihelp.com',
        changeOrigin: true,
      },
      '/health': {
        target: 'https://nova.mysimpleaihelp.com',
        changeOrigin: true,
      },
    },
  },
});
