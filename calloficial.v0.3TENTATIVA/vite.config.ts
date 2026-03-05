import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export default defineConfig({
  root: __dirname,
  base: '/salaprivada/',
  plugins: [
    react(),
    basicSsl() // Plugin para gerar certificados HTTPS automaticamente
  ],
  server: {
    host: true,
    port: 5181,
    strictPort: true,
    https: true, // HTTPS habilitado - necessário para getUserMedia em mobile
  },
  preview: {
    port: 5181,
    strictPort: true,
    https: true,
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
})

