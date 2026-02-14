import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  build: {
    // Optimize bundle size
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks
          vendor: ['react', 'react-dom', 'react-router-dom'],
          ui: ['lucide-react'],
          charts: ['recharts'],
          qr: ['html5-qrcode', 'qrcode'],
          utils: ['@/utils/auth', '@/utils/validation', '@/utils/cache']
        },
      },
    },
    // Improve build performance
    chunkSizeWarningLimit: 1000,
    sourcemap: true,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.log in production
        drop_debugger: true,
      },
    },
  },
  // CSS optimization
  css: {
    devSourcemap: true,
  },
  // Development server optimization
  server: {
    hmr: {
      overlay: true,
    },
  },
  // Preview optimization
  preview: {
    port: 3000,
  },
})
