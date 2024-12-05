import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from "path"

export default defineConfig({
    plugins: [react()],
    server: {
      host: true, // needed for docker containers
      port: 5173, // specify the port
      strictPort: true, // throw error if port is in use
      proxy: {
        '/api': {
          target: 'http://localhost:8000',
          changeOrigin: true,
          secure: false,
        }
      },
      watch: {
        usePolling: true // needed for some systems/containers
      }
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    optimizeDeps: {
      include: ['mapbox-gl'],
    },
})
