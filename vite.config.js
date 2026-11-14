import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  // React + Supabase sind zusammen ca. 500 kB – das ist okay, Warnung erst ab 700 kB
  build: { chunkSizeWarningLimit: 700 },
  // Versionsnummer (Commit) für die Anzeige unten auf der Seite (Cloudflare bzw. Netlify)
  define: {
    __APP_VERSION__: JSON.stringify((process.env.WORKERS_CI_COMMIT_SHA ?? process.env.CF_PAGES_COMMIT_SHA ?? process.env.COMMIT_REF ?? 'lokal').slice(0, 7)),
  },
})
