/**
 * chrome.ts — composes the shared marketing chrome.
 *
 * The markup itself lives in `chrome-markup.ts`, which is sliced verbatim out of
 * `valvoro-prototype/index.html`. This file adds the two things markup alone
 * cannot express: which of the four destinations is the *current* page, and the
 * client's departures from the prototype copy.
 *
 * The header and the drawer present the same four links two different ways, so
 * both are generated from `NAV_ITEMS` rather than duplicated. That is what stops
 * the two from drifting — a link added here appears in both, and the "current"
 * pill can never disagree between them.
 *
 * TO REGENERATE `chrome-markup.ts` after the prototype changes: extract the
 * blocks between the banner comments in `valvoro-prototype/index.html`
 * (`TOP UTILITY BAR`, `HEADER`, `MENU DRAWER`, `FOOTER`, `LEGAL MODALS`), swap
 * `src="assets/images/` for `src="/assets/images/`, and rewrite
 * `href="index.html#x"` to `href="/#x"` /
 * `href="residential.html"` to `href="/residential"`. Leave the `<nav>` element
 * in the header and the four `<a>` elements in the drawer as slots.
 *
 * ---------------------------------------------------------------------------
 * DEPARTURES FROM THE PROTOTYPE — all injected here, never written into the
 * generated file, so regenerating it keeps working and every deviation stays
 * visible and reviewable in one place. The three mirror pages carry the same
 * footer and legal changes inline already, so all four pages agree. [M]
 *
 * Ribbon
 *   1. the "Residential & commercial services" span is gone — the nav directly
 *      below it already says Residential and Commercial, so it was redundant
 *   2. the counties span now reads "Proudly serving: …"
 *   3. mobile text is 14px, not 12px (client: the ribbon was not legible)
 *
 * Header
 *   4. the phone number stays visible on mobile at 15px. It was hidden below
 *      `md` and the icon was left alone, which is what the client reported.
 *
 * Footer
 *   5. the admin link in the bottom bar (PRD §12.2)
 *   6. the inquiry link in the Contact column, now that /contact is a real page
 *   7. the copyright line — the prototype's "prototype reconstruction for demo
 *      purposes" is scaffolding language, not something to publish
 *   8. the bottom bar's "Licensed, bonded, and insured." — it repeats the first
 *      words of the brand column immediately above it
 *   9. the Contact column's "Service area: Austin · Buda · Kyle · San Marcos" —
 *      it sits on the line directly under "Serving Hays, Travis & Williamson
 *      counties", so the column stated the service area twice in a row
 *  10. "bonded" is dropped from the brand column's promise, client request
 *
 * Legal
 *  11. "Indigo Home Management" → "Indigo Home Membership" — the product is a
 *      membership, not a management contract, client request
 */
import {
  DRAWER_ACTIVE_CLASS,
  DRAWER_NAV_SLOT,
  DRAWER_PLAIN_CLASS,
  DRAWER_TEMPLATE,
  FOOTER_HTML as RAW_FOOTER_HTML,
  HEADER_ACTIVE_CLASS,
  HEADER_NAV_SLOT,
  HEADER_PLAIN_CLASS,
  HEADER_TEMPLATE,
  LEGAL_MODALS_HTML as RAW_LEGAL_MODALS_HTML,
  TOPBAR_HTML as RAW_TOPBAR_HTML,
} from "@/marketing/chrome-markup"

/* ── Ribbon ──────────────────────────────────────────────────────────────── */

/**
 * The whole "Residential & commercial services" span, including the newline and
 * indentation that precede it, so removing it leaves no blank line behind. The
 * clock glyph goes with it — nothing else uses that icon.
 */
const TOPBAR_SERVICES_SPAN = `          <span class="inline-flex items-center gap-2 font-semibold text-white">
            <svg class="size-4 text-sky" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>
            Residential &amp; commercial services
          </span>
`

/**
 * Anchored on the pin glyph, because "Hays, Travis, and Williamson counties"
 * also appears in the Terms and the Privacy policy — those are factual legal
 * statements and are deliberately left alone.
 */
const TOPBAR_COUNTIES_ANCHOR = `<circle cx="12" cy="10" r="2.6"/></svg>
            Hays, Travis, and Williamson counties`
const TOPBAR_COUNTIES_FIXED = `<circle cx="12" cy="10" r="2.6"/></svg>
            Proudly serving: Hays, Travis, and Williamson counties`

const TOPBAR_TYPE =
  'class="pill-topbar mbox bg-topbar text-[13px] text-slate-200 max-md:text-[12px]"'
const TOPBAR_TYPE_FIXED =
  'class="pill-topbar mbox bg-topbar text-[13px] text-slate-200 max-md:text-[14px]"'

/* ── Header ──────────────────────────────────────────────────────────────── */

/**
 * The phone block. `max-md:[&>span]:hidden` dropped the number below 768px and
 * left a bare icon, which is the illegibility the client reported. The number
 * now shows at every width; the icon and the gap grow slightly on mobile so the
 * whole block reads at the same weight as the brand beside it.
 *
 * `md:[&>span]:hidden` stays — at md–lg the full nav is present and the row
 * genuinely has no room for the number, which is the band the prototype
 * comment describes.
 */
const HEADER_PHONE =
  'class="ml-auto inline-flex shrink-0 items-center gap-[7px] whitespace-nowrap text-[16.5px] font-bold tracking-[-.01em] text-[#081f3f] max-md:[&>span]:hidden md:[&>span]:hidden lg:[&>span]:inline"'
const HEADER_PHONE_FIXED =
  'class="ml-auto inline-flex shrink-0 items-center gap-[7px] whitespace-nowrap text-[16.5px] font-bold tracking-[-.01em] text-[#081f3f] max-md:gap-[6px] max-md:text-[15px] md:[&>span]:hidden lg:[&>span]:inline"'

/* ── Footer ──────────────────────────────────────────────────────────────── */

const ADMIN_LINK = '<a href="/admin" class="transition-colors hover:text-sky">Admin</a>'
const ADMIN_LINK_ANCHOR =
  '<button type="button" class="legal-link" data-legal="privacy">Privacy Policy</button>'
const INQUIRY_LINK = '<a href="/contact" class="block py-1 hover:text-sky">Send an inquiry →</a>'
const INQUIRY_LINK_ANCHOR =
  '<a href="mailto:support@call-indigo.com" class="block py-1 hover:text-sky">support@call-indigo.com</a>'
const COPYRIGHT =
  '<p>© <span id="year"></span> Call Indigo LLC — prototype reconstruction for demo purposes.</p>'
const COPYRIGHT_FIXED = '<p>© <span id="year"></span> Call Indigo LLC. All rights reserved.</p>'
/** Includes the leading newline so the whole line goes, not just its text. */
const LICENCE_LINE =
  '\n          <span class="text-white/60">Licensed, bonded, and insured.</span>'

/**
 * The Contact column's second service-area line. It sits directly under
 * "Serving Hays, Travis & Williamson counties", so the column named the service
 * area twice in a row. The counties line stays: it matches the brand column and
 * both legal documents.
 *
 * Includes the leading newline so the whole line goes, not just its text.
 */
const SERVICE_AREA_LINE =
  '\n        <span class="block py-1 text-white/60">Service area: Austin · Buda · Kyle · San Marcos</span>'

/**
 * "Licensed, bonded and insured home and facility services…" → drop "bonded".
 * Client request: the bonded promise comes out of the marketing copy everywhere.
 */
const FOOTER_BONDED =
  '<p>Licensed, bonded and insured home and facility services. One call covers plumbing,'
const FOOTER_BONDED_FIXED =
  '<p>Licensed and insured home and facility services. One call covers plumbing,'

/* ── Legal ───────────────────────────────────────────────────────────────── */

const LEGAL_MANAGEMENT = 'Membership plans, including Indigo Home Management and our facility membership,'
const LEGAL_MANAGEMENT_FIXED =
  'Membership plans, including Indigo Home Membership and our facility membership,'

/*
 * Anchor rewriting.
 *
 * `chrome-markup.ts` is sliced from the prototype, which was one long page, so
 * its footer navigates with bare `#anchors`. Every one of those anchors lives on
 * the home page, and this chrome is used by `/contact` — where all eleven were
 * dead links that scrolled nowhere. This is the same transformation the mirror
 * pages carry inline (`href="index.html#about"` → `href="/#about"`), applied
 * once here for the shared copy instead of by hand per page.
 *
 * `#top` is deliberately left alone: it is an id on every page (the header),
 * not a route.
 */
const HOME_ANCHORS = ["services", "about", "process", "faq", "estimate"] as const

const withHomeAnchors = (html: string): string =>
  HOME_ANCHORS.reduce((acc, id) => acc.split(`href="#${id}"`).join(`href="/#${id}"`), html)

/**
 * The header's "Schedule Online" CTA. The prototype points it at the home page's
 * `#contact` band; on all four pages this build points it at the inquiry page,
 * which is what the mirror pages' headers already do.
 */
const withInquiryCta = (html: string): string =>
  html.split('href="#contact"').join('href="/contact"')

/** The utility bar above the header. */
export const TOPBAR_HTML = RAW_TOPBAR_HTML.replace(TOPBAR_SERVICES_SPAN, "")
  .replace(TOPBAR_COUNTIES_ANCHOR, TOPBAR_COUNTIES_FIXED)
  .replace(TOPBAR_TYPE, TOPBAR_TYPE_FIXED)

/** The site footer: the two React-only links plus the copy corrections. */
export const FOOTER_HTML = withHomeAnchors(
  RAW_FOOTER_HTML.replace(ADMIN_LINK_ANCHOR, `${ADMIN_LINK_ANCHOR}\n          ${ADMIN_LINK}`)
    .replace(INQUIRY_LINK_ANCHOR, `${INQUIRY_LINK_ANCHOR}\n        ${INQUIRY_LINK}`)
    .replace(COPYRIGHT, COPYRIGHT_FIXED)
    .replace(LICENCE_LINE, "")
    .replace(SERVICE_AREA_LINE, "")
    .replace(FOOTER_BONDED, FOOTER_BONDED_FIXED),
)

/** Terms of Service + Privacy Policy dialogs, driven by `useSiteChrome`. */
export const LEGAL_MODALS_HTML = RAW_LEGAL_MODALS_HTML.replace(
  LEGAL_MANAGEMENT,
  LEGAL_MANAGEMENT_FIXED,
)

/** The four top-level destinations. */
export type NavKey = "home" | "residential" | "commercial" | "contact"

export interface NavItem {
  key: NavKey
  label: string
  href: string
}

/**
 * `Contact` points at the real inquiry page rather than the home page's
 * `#contact` band. The band still exists for deep links; this is the link the
 * main navigation uses.
 */
export const NAV_ITEMS: readonly NavItem[] = [
  { key: "home", label: "Home", href: "/" },
  { key: "residential", label: "Residential", href: "/residential" },
  { key: "commercial", label: "Commercial", href: "/commercial" },
  { key: "contact", label: "Contact", href: "/contact" },
]

function link(item: NavItem, active: NavKey, activeClass: string, plainClass: string): string {
  const isActive = item.key === active
  const cls = isActive ? activeClass : plainClass
  const current = isActive ? ' aria-current="page"' : ""
  return `<a href="${item.href}" class="${cls}"${current}>${item.label}</a>`
}

/** The `<nav aria-label="Main">` element, with the current page marked. */
export function headerNav(active: NavKey): string {
  const items = NAV_ITEMS.map((i) => link(i, active, HEADER_ACTIVE_CLASS, HEADER_PLAIN_CLASS)).join(
    "\n        ",
  )
  return [
    '<nav class="ml-[38px] hidden items-center gap-[22px] whitespace-nowrap md:flex md:gap-[16px] lg:ml-[84px] lg:gap-[22px] xl:gap-[34px] 2xl:gap-[52px] max-md:ml-0" aria-label="Main">',
    `        ${items}`,
    "      </nav>",
  ].join("\n")
}

/** The drawer's four links, with the current page marked. */
export function drawerNav(active: NavKey): string {
  return NAV_ITEMS.map((i) => link(i, active, DRAWER_ACTIVE_CLASS, DRAWER_PLAIN_CLASS)).join("\n    ")
}

/** The sticky header, with the current page marked. */
export function headerHtml(active: NavKey): string {
  return withInquiryCta(
    HEADER_TEMPLATE.replace(HEADER_NAV_SLOT, headerNav(active)).replace(
      HEADER_PHONE,
      HEADER_PHONE_FIXED,
    ),
  )
}

/** The off-canvas mobile drawer, with the current page marked. */
export function drawerHtml(active: NavKey): string {
  return DRAWER_TEMPLATE.replace(DRAWER_NAV_SLOT, drawerNav(active))
}
