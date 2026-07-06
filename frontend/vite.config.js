import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '127.0.0.1',
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true
      },
      '/gateway-health': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        rewrite: () => '/actuator/health'
      },
      '/trip-health': {
        target: 'http://localhost:8081',
        changeOrigin: true,
        rewrite: () => '/actuator/health'
      },
      '/recommendation-health': {
        target: 'http://localhost:8082',
        changeOrigin: true,
        rewrite: () => '/actuator/health'
      },
      '/mcp-health': {
        target: 'http://localhost:8087',
        changeOrigin: true,
        rewrite: () => '/actuator/health'
      },
      '/mcp-test': {
        target: 'http://localhost:8087',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/mcp-test/, '/api/mcp-test')
      }
    }
  }
})