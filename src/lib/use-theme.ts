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
 * pages without a reload and without either page knowing about the other.
 *
 * The record comes from `GET /api/settings?key=site` — **the one settings read that
 * is not admin-gated**, because a theme colour and a phone number are public facts.
 * Until 2026-10-23 it came from `localStorage`, which meant a visitor's own browser
 * decided the site's colours; two visitors could see two different sites.
 *
 * A failed read is not a broken page: `data` stays null, `applyTheme` is never called,
 * and the stylesheet's shipped defaults stand.
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
