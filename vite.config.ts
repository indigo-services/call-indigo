import path from "node:path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig, loadEnv } from "vite"

// Vercel's Clerk Marketplace integration provides NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.
// Map only that public key into Vite's client-visible prefix. The server secret is
// intentionally excluded from loadEnv and is never defined in the browser bundle.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), ["VITE_", "NEXT_PUBLIC_"])

  return {
    plugins: [react(), tailwindcss()],
    define: {
      "import.meta.env.VITE_CLERK_PUBLISHABLE_KEY": JSON.stringify(
        env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? env.VITE_CLERK_PUBLISHABLE_KEY ?? "",
      ),
    },
    resolve: {
      alias: {
        "@": path.resolve(import.meta.dirname, "./src"),
      },
    },
  }
})
