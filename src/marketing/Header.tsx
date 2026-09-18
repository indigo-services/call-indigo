/**
 * Header — the sticky navigation bar below the TopBar.
 *
 * Renders the brand lockup, the four-item nav, the phone block, the CTA and the
 * mobile burger. The nav is generated from `NAV_ITEMS` so the active item is
 * driven by which page is rendering, rather than hard-coded per page.
 *
 * The burger is inert until `useSiteChrome()` binds it; `SiteChrome` calls that
 * hook, so anything rendered through `SiteChrome` gets a working drawer.
 */
import { headerHtml, type NavKey } from "@/marketing/chrome"

interface HeaderProps {
  /** Which nav item this page is, so the active pill lands in the right place. */
  active: NavKey
}

export function Header({ active }: HeaderProps) {
  return <div dangerouslySetInnerHTML={{ __html: headerHtml(active) }} />
}
