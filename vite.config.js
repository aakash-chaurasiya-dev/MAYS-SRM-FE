import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { Router } from 'react-router-dom'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(), 
    tailwindcss()  
  ],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    chunkSizeWarningLimit: 1000, // Increase limit to 1000 KB
    minify: true,
    cssMinify: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react/') || id.includes('react-dom/') || id.includes('react-router-dom/')) {
              return 'react-vendor';
            }
            if (id.includes('@mui/material') || id.includes('@mui/icons-material')) {
              return 'ui-vendor';
            }
            if (id.includes('axios/') || id.includes('date-fns/') || id.includes('clsx/') || id.includes('lucide-react/')) {
              return 'util-vendor';
            }
          }
        }
      },
    },
  },
})
