/**
 * Publish the saved theme onto `:root`, and keep it in step.
 *
 * Called once from `App`, because it has to run for every route: the picker
 * lives on `/admin/design`, but the colours it edits are painted by the three
 * marketing pages, and those are raw `BODY_HTML` strings rather than React
 * components — so there is no per-page component that could own this.
 *
 * `useApiData` is the whole change-propagation story. It re-runs on every global
 * API version bump, so saving on the Design System page repaints the marketing
 * pages without a reload and without either page knowing about the other. That
 * is the same mechanism an inquiry submitted on `/contact` already uses to
 * repaint the dashboard inbox.
 *
 * ⚠️ The value this reads is whatever `localStorage` holds for THIS browser. It
 * is not fetched from a server, so it cannot differ between visitors — see the
 * note in `src/lib/theme.ts`.
 */
import { useEffect } from "react"
import { api } from "@/lib/data/api"
import { useApiData } from "@/lib/data/hooks"
import { applyTheme } from "@/lib/theme"

export function useSiteTheme(): void {
  const { data } = useApiData("site-theme", () => api.getSettings())

  useEffect(() => {
    if (!data) return
    // The DOM is not available during the suite's `renderToStaticMarkup` pass,
    // and this hook is only ever called from `App`, which the suite does not
    // render — but the guard keeps the module importable from a test context.
    if (typeof document === "undefined") return
    applyTheme(document.documentElement, data)
  }, [data])
}
