/**
 * SiteChrome — the full marketing page shell.
 *
 * Wraps a page in the utility bar, the sticky header, the off-canvas mobile
 * drawer, the footer and the legal dialogs, so a page that is not one of the
 * three prototype mirrors can be written without pasting any of that markup.
 *
 * The three mirror pages (`HomePage`, `ResidentialPage`, `CommercialPage`)
 * deliberately do NOT use this: they are locked to byte-parity with
 * `valvoro-prototype/*.html` and carry their chrome inline. See `chrome.ts`.
 *
 * All the interactive behaviour — the drawer, the sticky-header shadow, the
 * legal dialogs, the footer year, the scroll lock — is wired by
 * `useSiteChrome()`, which binds by id and therefore works against this markup
 * exactly as it does against the mirror pages.
 */
import type { ReactNode } from "react"
import { Footer } from "@/marketing/Footer"
import { Header } from "@/marketing/Header"
import { TopBar } from "@/marketing/TopBar"
import { LEGAL_MODALS_HTML, drawerHtml, type NavKey } from "@/marketing/chrome"
import { useSiteChrome } from "@/marketing/useSiteChrome"

interface SiteChromeProps {
  /** Which nav item this page is, so the active pill lands in the right place. */
  active: NavKey
  children: ReactNode
}

export function SiteChrome({ active, children }: SiteChromeProps) {
  useSiteChrome()

  return (
    <div className="min-h-screen bg-white">
      <TopBar />
      <Header active={active} />

      {/* Off-canvas drawer + its scrim. Rendered as raw markup because the
          open/close transition is driven by classes `useSiteChrome` toggles. */}
      <div dangerouslySetInnerHTML={{ __html: drawerHtml(active) }} />

      {children}

      <Footer />

      {/* Terms of Service / Privacy Policy dialogs. */}
      <div dangerouslySetInnerHTML={{ __html: LEGAL_MODALS_HTML }} />
    </div>
  )
}
