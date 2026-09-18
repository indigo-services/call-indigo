import path from "node:path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

// https://vite.dev/config/ — PRD §4.2
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    // SPA fallback so /residential, /commercial, /admin/* all serve index.html
    // PRD §5.3
    historyApiFallback: true,
  },
  preview: {
    historyApiFallback: true,
  },
})
