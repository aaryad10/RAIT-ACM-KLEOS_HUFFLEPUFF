import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons.svg'],
      manifest: {
        name: 'ASHA Saathi',
        short_name: 'ASHA Saathi',
        description: 'Offline-first AI triage assistant for frontline health workers',
        theme_color: '#1565c0',
        background_color: '#121212',
        display: 'standalone',
        start_url: '/',
        icons: [{ src: 'icons.svg', sizes: 'any', type: 'image/svg+xml' }],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
      },
    }),
  ],
  optimizeDeps: {
  exclude: ['@huggingface/transformers'],
  esbuildOptions: {
    target: 'esnext',
  },
},
  worker: {
    format: 'es',
  },
})