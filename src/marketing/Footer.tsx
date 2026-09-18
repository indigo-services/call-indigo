/**
 * Footer — the shared footer chrome (PRD §3.1, §12).
 *
 * The footer is a single source: it lives in index.html and is propagated
 * byte-identically to the sub-pages by gen_pages.py (PRD §3.1).
 *
 * In the React port, the footer is a single component rendered on all three
 * marketing routes. It carries the one new /admin link in the bottom bar
 * (PRD §12.2) — the last item in the right-hand cluster, after Privacy Policy.
 *
 * STUB — implement during rc1 porting.
 */
export function Footer() {
  return (
    <footer>
      {/* TODO: port footer from valvoro-prototype/index.html:1776-1854 */}
    </footer>
  )
}
