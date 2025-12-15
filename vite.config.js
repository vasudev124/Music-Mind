import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,            // listen on all network interfaces
    port: 5173,            // your app port
    strictPort: true,      // fail if port is taken
    fs: {
      strict: false        // optional, relaxes file system restrictions
    },
    hmr: {
      host: 'localhost'    // or your local IP, keeps HMR working
    },
    watch: {
      usePolling: true     // ensures hot reload works behind ngrok
    },
    allowedHosts: 'all',   // allow all hosts (disables host checking)
  },
})
