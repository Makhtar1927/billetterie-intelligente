import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    basicSsl(), // HTTPS auto-signé — requis pour l'accès caméra depuis une IP réseau
  ],
  server: {
    port: 5173,
    host: '0.0.0.0', // Accessible depuis le réseau local (IP locale, mobile, etc.)
    https: true,     // Active HTTPS (nécessaire pour navigator.mediaDevices hors localhost)
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false, // Accepte les certificats auto-signés côté backend
      },
      '/uploads': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false, // Accepte les certificats auto-signés côté backend
      },
    },
  },
})


