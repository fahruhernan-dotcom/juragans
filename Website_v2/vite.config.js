import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react()
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    open: true,
  },
  build: {
    target: 'es2020',
    minify: 'esbuild',
    sourcemap: false,
    chunkSizeWarningLimit: 2000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('@react-pdf')) return 'vendor-pdf'
            if (id.includes('recharts') || id.includes('d3-')) return 'vendor-charts'
            if (id.includes('lucide-react')) return 'vendor-icons'
            if (id.includes('framer-motion')) return 'vendor-motion'
            if (id.includes('@radix-ui') || id.includes('@hookform') || id.includes('react-day-picker') || id.includes('cmdk') || id.includes('sonner')) return 'vendor-ui'
            if (id.includes('@supabase')) return 'vendor-supabase'
            if (id.includes('@tanstack')) return 'vendor-query'
            if (id.includes('date-fns') || id.includes('dexie') || id.includes('zod')) return 'vendor-utils'
            if (
              id.includes('/node_modules/react/') ||
              id.includes('\\node_modules\\react\\') ||
              id.includes('/node_modules/react-dom/') ||
              id.includes('\\node_modules\\react-dom\\') ||
              id.includes('/node_modules/react-router/') ||
              id.includes('\\node_modules\\react-router\\') ||
              id.includes('/node_modules/react-router-dom/') ||
              id.includes('\\node_modules\\react-router-dom\\') ||
              id.includes('/node_modules/react-is/') ||
              id.includes('\\node_modules\\react-is\\')
            ) {
              return 'vendor-react'
            }
          }
        },
      },
    },
  },
})

