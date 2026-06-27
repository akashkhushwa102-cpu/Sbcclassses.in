import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: { 
    port: 5174, 
    open: true 
  },
  build: {
    // Production optimization
    target: 'ES2020',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    },
    // Code splitting for better caching
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom']
        }
      }
    },
    // Source maps for production debugging (set to false to hide source code)
    sourcemap: false,
    // Optimize images and assets
    assetsInlineLimit: 4096,
    cssCodeSplit: true,
    reportCompressedSize: true,
    chunkSizeWarningLimit: 1000
  },
  // Environment variable prefix
  envPrefix: 'VITE_'
})
