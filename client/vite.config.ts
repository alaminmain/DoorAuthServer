import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    https: {
      key: fs.readFileSync(path.resolve(__dirname, '../server/certs/key.pem')),
      cert: fs.readFileSync(path.resolve(__dirname, '../server/certs/cert.pem')),
    },
    port: 5173,
    hmr: {
      protocol: 'wss',
      host: 'localhost',
      port: 5173,
      clientPort: 5173,
    },
  },
})
