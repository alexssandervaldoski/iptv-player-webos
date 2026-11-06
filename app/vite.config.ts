import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    target: 'chrome79',
    outDir: 'dist',
	assetsDir: 'assets',
	chunkSizeWarningLimit: 800,
  },
})