/**
 * TopBar — the utility bar at the very top of the page (PRD §3.2).
 *
 * Carries the two service facts on the left and the legal name / founding year
 * on the right, over `.pill-topbar` (square top corners, 12px bottom radius).
 * The address and licence number deliberately live in the footer only.
 *
 * The markup is the prototype's, sliced verbatim into `chrome-markup.ts`. It is
 * injected as HTML rather than transcribed into JSX so it stays byte-identical
 * to the three mirror pages, which carry the same block inline.
 */
import { TOPBAR_HTML } from "@/marketing/chrome"

export function TopBar() {
  return <div dangerouslySetInnerHTML={{ __html: TOPBAR_HTML }} />
}
