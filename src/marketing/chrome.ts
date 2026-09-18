/**
 * chrome.ts — composes the shared marketing chrome.
 *
 * The markup itself lives in `chrome-markup.ts`, which is sliced verbatim out of
 * `valvoro-prototype/index.html`. This file adds the one thing markup alone
 * cannot express: which of the four destinations is the *current* page.
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
  LEGAL_MODALS_HTML,
  TOPBAR_HTML,
} from "@/marketing/chrome-markup"

export { LEGAL_MODALS_HTML, TOPBAR_HTML }

/*
 * The two links the React build adds to the prototype's footer. They are
 * injected here rather than written into `chrome-markup.ts` so regenerating
 * that file from the prototype keeps working, and so the additions stay
 * visible and reviewable in one place. The three mirror pages carry the same
 * two links inline already, so all four pages agree. [M]
 *
 *   1. the admin link in the bottom bar (PRD §12.2)
 *   2. the inquiry link in the Contact column, now that /contact is a real page
 */
const ADMIN_LINK = '<a href="/admin" class="transition-colors hover:text-sky">Admin</a>'
const ADMIN_LINK_ANCHOR =
  '<button type="button" class="legal-link" data-legal="privacy">Privacy Policy</button>'
const INQUIRY_LINK =
  '<a href="/contact" class="block py-1 hover:text-sky">Send an inquiry →</a>'
const INQUIRY_LINK_ANCHOR =
  '<a href="mailto:support@call-indigo.com" class="block py-1 hover:text-sky">support@call-indigo.com</a>'

/** The site footer, including the admin link and the inquiry link. */
export const FOOTER_HTML = RAW_FOOTER_HTML.replace(
  ADMIN_LINK_ANCHOR,
  `${ADMIN_LINK_ANCHOR}\n          ${ADMIN_LINK}`,
).replace(INQUIRY_LINK_ANCHOR, `${INQUIRY_LINK_ANCHOR}\n        ${INQUIRY_LINK}`)

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
  return HEADER_TEMPLATE.replace(HEADER_NAV_SLOT, headerNav(active))
}

/** The off-canvas mobile drawer, with the current page marked. */
export function drawerHtml(active: NavKey): string {
  return DRAWER_TEMPLATE.replace(DRAWER_NAV_SLOT, drawerNav(active))
}
