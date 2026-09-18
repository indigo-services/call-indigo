/**
 * Footer — the shared footer chrome (PRD §3.1, §12).
 *
 * The footer is a single source: it lives in the prototype's `index.html` and is
 * propagated byte-identically to the sub-pages by `gen_pages.py` (PRD §3.1).
 * `chrome.ts` re-exports that same markup for pages that are not one of the
 * three prototype mirrors.
 *
 * Two things it must keep: `#year`, which `useSiteChrome()` fills with the
 * current year, and the two `.legal-link` buttons, which open the dialogs
 * rendered by `SiteChrome`. The bottom bar also carries the one new `/admin`
 * link (PRD §12.2) — the last item in the right-hand cluster.
 */
import { FOOTER_HTML } from "@/marketing/chrome"

export function Footer() {
  return <div dangerouslySetInnerHTML={{ __html: FOOTER_HTML }} />
}
