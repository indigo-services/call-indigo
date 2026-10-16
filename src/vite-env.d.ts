/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_CLERK_PUBLISHABLE_KEY: string
}

declare module "@tailwindcss/vite" {
  import type { Plugin } from "vite"
  const plugin: () => Plugin
  export default plugin
}
