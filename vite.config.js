import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  // React + Supabase sind zusammen ca. 500 kB – das ist okay, Warnung erst ab 700 kB
  build: { chunkSizeWarningLimit: 700 },
})
