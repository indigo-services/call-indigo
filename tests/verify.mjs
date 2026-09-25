/**
 * verify — the rendered-markup gate (PRD §13.1, §14).
 *
 * Renders each public route to static HTML with `react-dom/server` and asserts
 * on the real output, not on the source text. The prototype's `verify.py` did
 * this against a browser; this does it headlessly, which means it can run in CI
 * and cannot be skipped for being inconvenient.
 *
 * Covers the hard zeros of PRD §13.2 that are checkable without layout:
 * broken images, dead anchors, empty hrefs, duplicate ids, unstyled classes,
 * and the structural claims rc1 makes — one `/admin` link per page (§12.4) and
 * the current-page marker landing on the right item (§5.1).
 */
import { existsSync, readFileSync, readdirSync } from "node:fs"
import path from "node:path"
import {
  ROOT,
  attr,
  bodyOf,
  check,
  classTokens,
  element,
  hasClass,
  load,
  render,
  siteFooter,
  stripComments,
  suite,
  tags,
  textOf,
} from "./harness.mjs"

/** Every public route, and the module that renders it. */
export const ROUTES = [
  { route: "/", name: "home", module: "src/marketing/pages/HomePage.tsx" },
  { route: "/residential", name: "residential", module: "src/marketing/pages/ResidentialPage.tsx" },
  { route: "/commercial", name: "commercial", module: "src/marketing/pages/CommercialPage.tsx" },
  { route: "/contact", name: "contact", module: "src/marketing/pages/ContactPage.tsx" },
]

/** Destinations the SPA actually serves. Anything else is a dead link. */
const KNOWN_ROUTES = new Set(["/", "/residential", "/commercial", "/contact", "/admin"])

/**
 * Where a nav link actually lands, from the reader's point of view.
 *
 * On the home page the Home entries are `#top` — a scroll to the top of the
 * page you are already on — while the other three pages use `/`. Both resolve
 * to the home route, so comparing raw hrefs reports a drift that does not
 * exist. This is the normalisation that makes the comparison honest.
 */
function navTarget(href, currentRoute) {
  if (href === "#top") return "/"
  if (href.startsWith("#")) return currentRoute
  return href.split("#")[0]
}

function publicFile(urlPath) {
  return path.join(ROOT, "public", urlPath.replace(/^\//, ""))
}

function distCss() {
  const dir = path.join(ROOT, "dist", "assets")
  if (!existsSync(dir)) return null
  const file = readdirSync(dir).find((f) => f.endsWith(".css"))
  return file ? readFileSync(path.join(dir, file), "utf8") : null
}

export async function run() {
  suite("Rendered markup", "tests/verify.mjs")

  const pages = []
  for (const r of ROUTES) {
    const html = await render(r.module, r.name)
    pages.push({ ...r, html, clean: stripComments(html) })
  }
  const home = pages.find((p) => p.name === "home")

  check("every public route renders without throwing", () =>
    pages.filter((p) => !p.html || p.html.length < 5000).map((p) => `${p.route} rendered ${p.html.length} chars`),
  )

  check("no duplicate element ids within a page", () => {
    const out = []
    for (const p of pages) {
      const seen = new Map()
      for (const id of attr(p.clean, "id")) seen.set(id, (seen.get(id) ?? 0) + 1)
      for (const [id, n] of seen) if (n > 1) out.push(`${p.route} — id="${id}" appears ${n}×`)
    }
    return out
  })

  check("every aria-labelledby target exists in the same page", () => {
    const out = []
    for (const p of pages) {
      const ids = new Set(attr(p.clean, "id"))
      for (const ref of attr(p.clean, "aria-labelledby")) {
        for (const id of ref.split(/\s+/)) {
          if (id && !ids.has(id)) out.push(`${p.route} — aria-labelledby="${id}" has no matching id`)
        }
      }
    }
    return out
  })

  check("every aria-describedby target exists in the same page", () => {
    const out = []
    for (const p of pages) {
      const ids = new Set(attr(p.clean, "id"))
      for (const ref of attr(p.clean, "aria-describedby")) {
        for (const id of ref.split(/\s+/)) {
          if (id && !ids.has(id)) out.push(`${p.route} — aria-describedby="${id}" has no matching id`)
        }
      }
    }
    return out
  })

  check("every label[for] points at a real control", () => {
    const out = []
    for (const p of pages) {
      const ids = new Set(attr(p.clean, "id"))
      for (const t of tags(p.clean, "label")) {
        const forAttr = /\bfor\s*=\s*"([^"]*)"/.exec(t)
        if (forAttr && forAttr[1] && !ids.has(forAttr[1])) {
          out.push(`${p.route} — label for="${forAttr[1]}" has no matching control`)
        }
      }
    }
    return out
  })

  check("every <img src> resolves to a file in public/", () => {
    const out = []
    for (const p of pages) {
      for (const src of attr(p.clean, "src")) {
        if (/^(https?:)?\/\//.test(src) || src.startsWith("data:")) continue
        if (!src.startsWith("/")) {
          out.push(`${p.route} — relative image src "${src}" (should be root-relative)`)
        } else if (!existsSync(publicFile(src))) {
          out.push(`${p.route} — missing asset ${src}`)
        }
      }
    }
    return out
  })

  check("every anchor has a destination that exists", () => {
    const out = []
    const homeIds = new Set(attr(home.clean, "id"))
    for (const p of pages) {
      const ids = new Set(attr(p.clean, "id"))
      for (const href of attr(p.clean, "href")) {
        if (href === "" || href === "#") {
          out.push(`${p.route} — empty href`)
          continue
        }
        if (/^(tel:|mailto:|https?:)/.test(href)) continue

        if (href.startsWith("#")) {
          if (!ids.has(href.slice(1))) {
            out.push(`${p.route} — href="${href}" has no matching id on this page`)
          }
          continue
        }

        // "/#about" — a route plus an anchor on the target page.
        const [route, hash] = href.split("#")
        const target = route === "" ? p.route : route
        if (!KNOWN_ROUTES.has(target)) {
          out.push(`${p.route} — href="${href}" is not a route the SPA serves`)
        } else if (hash && target === "/" && !homeIds.has(hash)) {
          out.push(`${p.route} — href="${href}" points at a missing anchor on /`)
        }
      }
    }
    return out
  })

  check("no legacy .html links survive the SPA port", () => {
    const out = []
    for (const p of pages) {
      for (const href of attr(p.clean, "href")) {
        if (/\.html?($|#)/.test(href)) out.push(`${p.route} — href="${href}"`)
      }
    }
    return out
  })

  check("exactly one /admin link per public page (PRD §12.4)", () =>
    pages
      .map((p) => [p, attr(p.clean, "href").filter((h) => h === "/admin").length])
      .filter(([, n]) => n !== 1)
      .map(([p, n]) => `${p.route} — ${n} /admin link(s)`),
  )

  check("each nav presentation marks exactly one current page (PRD §5.1)", () => {
    const out = []
    for (const p of pages) {
      for (const [which, nav] of [
        ["header", element(p.clean, 'aria-label="Main"')],
        ["drawer", element(p.clean, 'id="menu-panel"')],
      ]) {
        if (!nav) {
          out.push(`${p.route} — no ${which} nav`)
          continue
        }
        const current = tags(nav, "a").filter((t) => /aria-current\s*=\s*"page"/.test(t))
        if (current.length !== 1) {
          out.push(`${p.route} — ${which} nav has ${current.length} aria-current="page" anchors`)
          continue
        }
        const href = /\bhref\s*=\s*"([^"]*)"/.exec(current[0])?.[1] ?? ""
        if (navTarget(href, p.route) !== p.route) {
          out.push(`${p.route} — ${which} nav marks href="${href}", which is not this page`)
        }
      }
    }
    return out
  })

  check("the drawer and the header nav offer the same destinations in order", () => {
    const out = []
    for (const p of pages) {
      const header = element(p.clean, 'aria-label="Main"')
      const drawer = element(p.clean, 'id="menu-panel"')
      if (!header || !drawer) {
        out.push(`${p.route} — missing drawer or header nav`)
        continue
      }
      const a = attr(header, "href").map((h) => navTarget(h, p.route))
      const b = attr(drawer, "href")
        .map((h) => navTarget(h, p.route))
        .filter((h) => h.startsWith("/") && KNOWN_ROUTES.has(h))
      if (a.join("|") !== b.join("|")) {
        out.push(`${p.route} — header [${a.join(", ")}] vs drawer [${b.join(", ")}]`)
      }
    }
    return out
  })

  check("both legal dialogs are present, hidden, and correctly labelled", () => {
    const out = []
    for (const p of pages) {
      for (const id of ["legal-terms", "legal-privacy"]) {
        const tag = tags(p.clean, "div").find((t) => new RegExp(`id="${id}"`).test(t))
        if (!tag) {
          out.push(`${p.route} — no #${id} dialog`)
          continue
        }
        if (!/aria-hidden\s*=\s*"true"/.test(tag)) out.push(`${p.route} — #${id} is not aria-hidden on load`)
        if (!/role\s*=\s*"dialog"/.test(tag)) out.push(`${p.route} — #${id} has no role="dialog"`)
        if (!/aria-modal\s*=\s*"true"/.test(tag)) out.push(`${p.route} — #${id} has no aria-modal`)
      }
    }
    return out
  })

  check("the legal dialogs no longer carry the sample-language notice", () => {
    // Inverted 2026-09-22: the client asked for the notice to be removed. Paired
    // with a positive control, because an absent dialog would satisfy "no notice"
    // vacuously — the dialog must still exist AND still carry its body copy.
    // NOTE this reverses a deliberate earlier decision (see CHANGELOG.md): the
    // warning was kept on the argument that removing it would make unreviewed
    // text look reviewed, and the text underneath is still unreviewed.
    const out = []
    for (const p of pages) {
      for (const id of ["legal-terms", "legal-privacy"]) {
        const dialog = element(p.clean, `id="${id}"`)
        if (!dialog) {
          out.push(`${p.route} — #${id} is missing entirely`)
          continue
        }
        if (/Sample language/.test(dialog)) out.push(`${p.route} — #${id} still carries the notice`)
        if (!/legal-body/.test(dialog)) out.push(`${p.route} — #${id} lost its body copy`)
      }
    }
    return out
  })

  check("the footer year placeholder is present for the hook to fill", () =>
    pages.filter((p) => !/id="year"/.test(p.clean)).map((p) => `${p.route} — no #year`),
  )

  check("the inquiry form is reachable from every public page", () =>
    pages
      .filter((p) => p.route !== "/contact")
      .filter((p) => !attr(p.clean, "href").includes("/contact"))
      .map((p) => `${p.route} — no /contact link`),
  )

  check("the inquiry form asks for everything the data layer stores", () => {
    const contact = pages.find((p) => p.name === "contact")
    const names = new Set(attr(contact.clean, "name"))
    const required = ["member", "name", "email", "phone", "propertyType", "service", "urgency", "message"]
    return required.filter((n) => !names.has(n)).map((n) => `/contact — the form has no "${n}" field`)
  })

  check("the membership question is the first thing the form asks", () => {
    // The client asked for the radio "at the very top before 'Name'", so the
    // position is part of the requirement, not an accident of the markup. The
    // form is sliced out of the page first: `attr(…, "name")` over the whole
    // document would also collect any `name=` the chrome happens to carry, and
    // the first of those would not be a form field at all.
    const contact = pages.find((p) => p.name === "contact")
    const start = contact.clean.indexOf("<form")
    const end = contact.clean.lastIndexOf("</form>")
    if (start === -1 || end === -1) return ["/contact — no <form> to inspect"]
    const first = attr(contact.clean.slice(start, end), "name")[0]
    return first === "member" ? [] : [`/contact — the first named field is "${first}", expected "member"`]
  })

  /* ── Design-system coverage ──────────────────────────────────────────────
     The rc1 defect this exists to prevent: the ported pages rendered unstyled
     because 65 component classes were absent from `src/index.css`. Checking the
     class names against the COMPILED stylesheet is the only way to catch it —
     the markup alone looks perfect. */
  suite("Stylesheet coverage", "tests/verify.mjs")

  const css = distCss()

  check("a compiled stylesheet exists to check against", () =>
    css ? [] : ["dist/assets/*.css not found — run `npm run build` first (npm test does this)"],
  )

  if (css) {
    const missing = new Map()
    for (const p of pages) {
      for (const token of classTokens(p.clean)) {
        if (!hasClass(css, token)) {
          if (!missing.has(token)) missing.set(token, new Set())
          missing.get(token).add(p.route)
        }
      }
    }
    check("every class used in the markup is emitted by the stylesheet", () =>
      [...missing].map(([token, routes]) => `${token}  (used on ${[...routes].join(", ")})`),
    )
  }

  /* ── Copy hygiene on rendered text ─────────────────────────────────────── */

  suite("Copy hygiene", "tests/verify.mjs")

  const bodies = pages.map((p) => ({ ...p, text: textOf(bodyOf(p.html)) }))

  check("no scaffolding or placeholder language reaches a visitor", () => {
    const out = []
    const phrases = ["prototype reconstruction", "lorem ipsum", "placeholder copy", "TODO", "FIXME", "XXX"]
    for (const p of bodies) {
      const lower = p.text.toLowerCase()
      for (const phrase of phrases) {
        if (lower.includes(phrase.toLowerCase())) out.push(`${p.route} — "${phrase}"`)
      }
    }
    return out
  })

  check("no doubled words in visible copy", () => {
    const allow = new Set(["had had", "that that"])
    const out = []
    for (const p of bodies) {
      const re = /\b([A-Za-z][A-Za-z'-]{1,})\s+\1\b/gi
      let m
      while ((m = re.exec(p.text)) !== null) {
        if (allow.has(m[0].toLowerCase())) continue
        const around = p.text.slice(Math.max(0, m.index - 45), m.index + 45)
        out.push(`${p.route} — "${m[0]}" near …${around}…`)
      }
    }
    return out
  })

  check("the service-area city list is the same everywhere it is stated", () => {
    const out = []
    for (const p of pages) {
      const text = textOf(bodyOf(p.html))
      for (const m of text.matchAll(/Austin[^.;]{0,80}/g)) {
        const frag = m[0]
        if (!/(Buda|Kyle|San Marcos|Round Rock|Cedar Park|Pflugerville|Georgetown)/.test(frag)) continue
        const flat = frag.replace(/\s*·\s*/g, ", ").replace(/, and /g, ", ")
        const hasAll = ["Austin", "Buda", "Kyle", "San Marcos"].every((c) => flat.includes(c))
        const hasStrays = /Round Rock|Cedar Park|Pflugerville|Georgetown/.test(flat)
        if (!hasAll || hasStrays) {
          out.push(`${p.route} — "${frag.trim()}" (canonical: Austin, Buda, Kyle, and San Marcos)`)
        }
      }
    }
    return out
  })

  check("no sentence is repeated verbatim within one page", () => {
    const out = []
    for (const p of bodies) {
      const sentences = p.text
        .split(/(?<=[.!?])\s+/)
        .map((s) => s.trim().toLowerCase().replace(/\s+/g, " "))
        .filter((s) => s.split(" ").length >= 8)
      const seen = new Map()
      for (const s of sentences) seen.set(s, (seen.get(s) ?? 0) + 1)
      for (const [s, n] of seen) if (n > 1) out.push(`${p.route} — ×${n}: "${s.slice(0, 110)}…"`)
    }
    return out
  })

  check("the county name is not repeated to the point of noise", () => {
    // Global chrome (top bar, footer), the About band, the FAQ answer and the
    // two legal documents each legitimately state it once.
    const CEILING = 8
    return bodies
      .map((p) => [p, (p.text.match(/Hays, Travis, and Williamson counties/gi) ?? []).length])
      .filter(([, n]) => n > CEILING)
      .map(([p, n]) => `${p.route} — stated ${n}× (ceiling ${CEILING})`)
  })

  /*
   * `chrome.ts` composes the shared footer out of `chrome-markup.ts` with string
   * replaces. A replace whose needle stops matching fails SILENTLY — the page
   * still renders, just with the prototype's copy back, and nothing complains.
   * So these assert the rendered output rather than the seam.
   */
  check("the shared-chrome copy corrections reach the rendered footer", () => {
    const REMOVED = [
      "prototype reconstruction for demo purposes",
      "Licensed, bonded, and insured.",
      "Service area: Austin · Buda · Kyle · San Marcos",
    ]
    const out = []
    for (const p of pages) {
      const foot = siteFooter(p.html)
      if (!foot) {
        out.push(`${p.route} — no site footer in the rendered page`)
        continue
      }
      const text = textOf(foot)
      for (const gone of REMOVED) {
        if (text.includes(gone)) out.push(`${p.route} — footer still carries "${gone}"`)
      }
      if (!text.includes("All rights reserved.")) {
        out.push(`${p.route} — the copyright correction did not apply`)
      }
      // The service area must still be stated — the fix removed the duplicate,
      // not the fact.
      if (!/Serving Hays, Travis & Williamson counties/.test(text)) {
        out.push(`${p.route} — the footer no longer states the service area at all`)
      }
    }
    return out
  })

  check("every page's footer says the same thing", () => {
    // The shared chrome used by /contact and the three mirror pages' inline
    // footers are separate copies of the same markup, so they can drift apart
    // without anything failing. Compared as normalised text, because the copies
    // differ in incidental whitespace.
    const footerText = (p) => {
      const foot = siteFooter(p.html)
      return foot ? textOf(foot).replace(/\s+/g, " ").trim() : "(no site footer)"
    }
    const reference = footerText(pages[0])
    return pages
      .slice(1)
      .filter((p) => footerText(p) !== reference)
      .map((p) => `${p.route} — footer differs from ${pages[0].route}`)
  })

  /* ── Punch list v1.0.1 — the client-confirmed changes ─────────────────── */

  suite("Punch list (v1.0.1)", "tests/verify.mjs")

  const mirror = bodies.filter((p) => p.route !== "/contact")

  check("no page promises bonding any more", () => {
    // Client: delete the "bonded" promise everywhere. It shipped in the About
    // bullet, the FAQ answer, a commercial hero chip and every footer column.
    return bodies
      .filter((p) => /bonded/i.test(p.text))
      .map((p) => `${p.route} — still says "bonded"`)
  })

  check("the membership product is a membership, not a management contract", () => {
    // Client: drop "management" — it is Indigo Home / Facility Membership.
    return bodies
      .filter((p) => /Indigo (Home|Facility) Management/.test(p.text))
      .map((p) => `${p.route} — still names an "Indigo … Management" product`)
  })

  check("the ribbon carries one service-area line, phrased as a promise", () => {
    const out = []
    for (const p of bodies) {
      const bar = /<div class="pill-topbar[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/.exec(p.clean)
      if (!bar) {
        out.push(`${p.route} — no utility bar found`)
        continue
      }
      if (bar[0].includes("Residential &amp; commercial services")) {
        out.push(`${p.route} — the redundant "Residential & commercial services" span is back`)
      }
      if (!bar[0].includes("Proudly serving: Hays, Travis, and Williamson counties")) {
        out.push(`${p.route} — the ribbon does not say "Proudly serving: …"`)
      }
      if (!bar[0].includes("max-md:text-[14px]")) {
        out.push(`${p.route} — the ribbon's mobile size is not the bumped 14px`)
      }
    }
    return out
  })

  check("the header phone number is legible on mobile", () => {
    // Client: the phone in the top nav is not legible on mobile. It was hidden
    // below `md`, which left a bare icon with no number.
    const out = []
    for (const p of bodies) {
      const hdr = /<header[\s\S]*?<\/header>/i.exec(p.clean)
      if (!hdr) {
        out.push(`${p.route} — no <header>`)
        continue
      }
      const tel = /<a href="tel:[^"]*"[^>]*>/.exec(hdr[0])
      if (!tel) {
        out.push(`${p.route} — no tel: link in the header`)
        continue
      }
      if (tel[0].includes("max-md:[&>span]:hidden")) {
        out.push(`${p.route} — the header phone number is still hidden on mobile`)
      }
      if (!tel[0].includes("max-md:text-[15px]")) {
        out.push(`${p.route} — the header phone has no mobile size bump`)
      }
    }
    return out
  })

  check("the two unpublished home sections are gone", () => {
    const home = bodies.find((p) => p.route === "/")
    const out = []
    if (home.clean.includes('id="results"')) out.push('id="results" is still rendered')
    if (home.clean.includes('id="area"')) out.push('id="area" is still rendered')
    if (home.clean.includes('id="zip-form"')) out.push("the ZIP form is still rendered")
    if (home.text.includes("Real repairs. Real results.")) {
      out.push("the Real Repairs copy is still rendered")
    }
    return out
  })

  check("the home hero carries its punch-list changes", () => {
    const home = bodies.find((p) => p.route === "/")
    const out = []
    if (!home.clean.includes('id="hero-rotate"')) out.push("the hero has no rotation target")
    if (home.clean.includes("banner-plumber-img")) out.push("the plumber visual is still rendered")
    if (!home.clean.includes("52,550")) out.push("the jobs-completed stat is not 52,550+")
    if (!home.text.includes("Jobs Completed")) out.push('the stat is not labelled "Jobs Completed"')
    if (home.text.includes("Projects Completed")) out.push('the old "Projects Completed" label survives')
    /* The mobile Emergency card.
       The guard that used to sit here tested the source text for
       `navy-box … max-md:hidden`, and it stayed green for the whole life of a
       defect in which the card never appeared on a phone: the markup carried
       `max-md:static` (a previous attempt at this same request) while
       `index.css` hid `.navy-box` outright below 991px — and the stylesheet won.
       A markup-only assertion cannot see that, so this checks both layers. The
       detector is positive-controlled by the check immediately below. */
    const navyTag = /<a[^>]*class="([^"]*\bnavy-box\b[^"]*)"/.exec(home.clean)
    if (!navyTag) out.push("the home hero has no .navy-box Emergency card")
    else if (/(^|\s)(hidden|max-md:hidden|md:hidden)(\s|$)/.test(navyTag[1])) {
      out.push(`the Emergency card carries a hide utility: ${navyTag[1]}`)
    }
    if (css && /\.navy-box\s*\{[^}]*display:\s*none/.test(css)) {
      out.push(".navy-box is hidden by a stylesheet rule, so the card cannot render at any width")
    }
    if (!home.text.includes("One Call, All Services")) {
      out.push('the services eyebrow is not "One Call, All Services"')
    }
    if (!home.text.includes("Indigo Home & Facility Membership")) {
      out.push("the membership headline is not updated")
    }
    if (!home.text.includes("BECOME A MEMBER")) out.push("the membership CTA is missing")
    return out
  })

  check("the .navy-box hide detector still detects hiding", () => {
    // Positive control for the check above. That one asserts an ABSENCE, and a
    // pattern that matched nothing would satisfy it on a page that still hides
    // the card — which is precisely how the original defect survived the guard
    // it had. Feed the detector the rule that caused the bug and require a hit.
    const detector = /\.navy-box\s*\{[^}]*display:\s*none/
    const fixture = "@media (max-width:991px){.navy-box{display:none!important}}"
    return detector.test(fixture)
      ? []
      : ["the .navy-box hide detector is dead, so the assertion above proves nothing"]
  })

  check("the How It Works sequence numbers are legible", () => {
    // The numerals shipped as `text-mist` — #f4f8fe painted on the white card,
    // which is a contrast ratio of 1.07:1, i.e. invisible. The suite renders
    // markup and has no layout engine, so it cannot measure a colour; it asserts
    // the class that decides one instead. Every token listed here resolves to a
    // near-white surface, so on the white `.card` any of them is the same bug.
    const proc = element(home.clean, 'id="process"') ?? ""
    const nums = [...proc.matchAll(/<b class="([^"]*)"[^>]*>\s*(\d+)\s*<\/b>/g)]
    if (nums.length !== 4) return [`#process shows ${nums.length} sequence numbers, expected 4`]
    const INVISIBLE = /\btext-(mist|white|secondary|line|sky-soft)\b|\bopacity-(?:0|10|20)\b/
    return nums
      .filter((m) => INVISIBLE.test(m[1]))
      .map((m) => `#process numeral "${m[2]}" is painted with a surface token: ${m[1]}`)
  })

  check("the redundant small round frame is gone", () => {
    // The client asked for the smaller of the two overlapping round frames under
    // the Expert roll to be deleted: it duplicated the larger one. Scanned on
    // `clean`, never `html` — the comments left behind in all three pages name
    // `.banner-img2` and `repair-img2.jpg` on purpose, so a raw-markup scan would
    // match the explanation of the removal and pass on a page still shipping it.
    return pages
      .filter((p) => /banner-img2|repair-img2/.test(p.clean))
      .map((p) => `${p.route} — still references the removed small round frame`)
  })

  check("the hero rotation offers every service the client listed", () => {
    // The list lives in the hook, not in markup, so this reads the source. A
    // missing option is otherwise invisible until someone watches the hero.
    // The list moved out of the hook into `hero-rotation.ts` on 2026-09-22, so
    // the words and their arch photographs live together and cannot drift apart.
    const src = readFileSync(path.join(ROOT, "src/marketing/hero-rotation.ts"), "utf8")
    const m = /const ROTATION = \[([^\]]*)\]/.exec(src)
    if (!m) return ["no ROTATION list in hero-rotation.ts"]
    const words = [...m[1].matchAll(/"([^"]+)"/g)].map((x) => x[1])
    return ["Plumbing", "Electrical", "HVAC", "Home Services", "Facility Services"]
      .filter((w) => !words.includes(w))
      .map((w) => `ROTATION is missing "${w}"`)
  })

  check("each membership block reads name, then CTA, then body", () => {
    const out = []
    for (const p of mirror) {
      const cta = ["Become a Member", "BECOME A MEMBER"]
        .map((s) => p.text.indexOf(s))
        .filter((n) => n !== -1)
      if (cta.length === 0) {
        out.push(`${p.route} — no "Become a Member" CTA`)
        continue
      }
      const body = p.text.indexOf("All new customers are given")
      if (body !== -1 && Math.min(...cta) > body) {
        out.push(`${p.route} — the CTA renders after the body text`)
      }
    }
    return out
  })

  /* ── Brand lockup — the client-supplied icon + wordmark ───────────────────
   *
   * The client replaced the v1 `call-indigo-mark*.svg` imagery with a
   * `rounded-full` navy disc holding a lucide `phone` glyph, beside a "Call
   * Indigo" wordmark. It has to land in three chrome positions — header, drawer,
   * footer — on all four routes, which is four separate copies of the chrome:
   * `chrome.ts` builds `/contact` from `chrome-markup.ts`, and the three mirror
   * pages each carry their own inline copy. A change that reaches only one of
   * them is the exact failure this suite exists to catch.
   */

  suite("Brand lockup", "tests/verify.mjs")

  const PHONE_PATH = "M13.832 16.568"

  check("no page still loads the superseded v1 brand mark", () =>
    pages
      .filter((p) => /call-indigo-mark/.test(p.html))
      .map((p) => `${p.route} — still references call-indigo-mark`),
  )

  check("every chrome disc holds the client's phone glyph", () => {
    // Anchored to the disc, not to the page, so the header's `tel:` icon cannot
    // satisfy it. Three per page: one light disc in the header, two inverted
    // ones in the drawer and the footer.
    //
    // `shrink-0` is load-bearing. A looser `rounded-full (bg-…)` also matches the
    // "Schedule Online" button, whose arrow sits in its own `rounded-full bg-white`
    // circle - that reads as a fourth disc, and its arrow path as a second,
    // non-brand glyph. Every chrome lockup disc is `shrink-0 rounded-full`; the
    // CTA badge and that button are not.
    const re = /shrink-0 rounded-full (?:bg-\[#1e1b4b\]|bg-white)[^"]*">[\s\S]{0,600}?M13\.832 16\.568/g
    return pages
      .map((p) => ({ route: p.route, n: (p.html.match(re) ?? []).length }))
      .filter((r) => r.n !== 3)
      .map((r) => `${r.route} — ${r.n} branded disc(s), expected 3 (header, drawer, footer)`)
  })

  check("the header disc is navy and the dark-surface discs are inverted", () => {
    // Navy-on-navy would be invisible in the drawer and footer, which sit on
    // `bg-ink` / `bg-ink-2`, so those two invert to a white disc with a navy
    // glyph and a white wordmark. Anchored to the disc → glyph → wordmark
    // sequence: a bare `rounded-full bg-white` count is not usable, because the
    // same pair also appears in page content (measured: 4 on the home page).
    const re =
      /rounded-full (bg-\[#1e1b4b\]|bg-white)[^"]*">[\s\S]{0,600}?M13\.832 16\.568[\s\S]{0,400}?<span class="([^"]*)">Call Indigo<\/span>/g
    const out = []
    for (const p of pages) {
      const seen = { "bg-[#1e1b4b]": 0, "bg-white": 0 }
      let m
      while ((m = re.exec(p.html)) !== null) {
        const disc = m[1]
        const wordmark = m[2]
        seen[disc] += 1
        if (disc === "bg-[#1e1b4b]" && !wordmark.includes("text-[#1e1b4b]")) {
          out.push(`${p.route} — navy disc pairs with "${wordmark.slice(0, 50)}", expected text-[#1e1b4b]`)
        }
        if (disc === "bg-white" && !wordmark.includes("text-white")) {
          out.push(`${p.route} — inverted disc pairs with "${wordmark.slice(0, 50)}", expected text-white`)
        }
      }
      if (seen["bg-[#1e1b4b]"] !== 1) out.push(`${p.route} — ${seen["bg-[#1e1b4b]"]} navy disc(s), expected 1 (header)`)
      if (seen["bg-white"] !== 2) out.push(`${p.route} — ${seen["bg-white"]} inverted disc(s), expected 2 (drawer + footer)`)
    }
    return out
  })

  check("every brand wordmark carries the client's tracking value", () => {
    // The superseded lockup used tracking-[-.045em] in the header and
    // tracking-[-.02em] in the drawer and footer; the client's is -0.06em. A
    // half-applied change leaves one of the three on the old value.
    const out = []
    const re = /<span class="([^"]*)"[^>]*>Call Indigo<\/span>/g
    for (const p of pages) {
      let m
      let seen = 0
      while ((m = re.exec(p.html)) !== null) {
        seen += 1
        if (!/tracking-\[-0\.06em\]/.test(m[1])) {
          out.push(`${p.route} — wordmark span without tracking-[-0.06em]: ${m[1].slice(0, 70)}`)
        }
      }
      if (seen !== 3) out.push(`${p.route} — ${seen} wordmark span(s), expected 3`)
    }
    return out
  })

  check("the favicon is the new brand icon, not the superseded mark", () => {
    const html = readFileSync(path.join(ROOT, "index.html"), "utf8")
    const out = []
    if (!/call-indigo-icon\.svg/.test(html)) out.push("index.html does not reference call-indigo-icon.svg")
    if (/call-indigo-mark/.test(html)) out.push("index.html still points a favicon at call-indigo-mark")
    return out
  })

  check("the brand icon carries the client's navy, not the v1 indigo", () => {
    const file = path.join(ROOT, "public", "assets", "images", "call-indigo-icon.svg")
    if (!existsSync(file)) return ["public/assets/images/call-indigo-icon.svg is missing"]
    const svg = readFileSync(file, "utf8")
    const out = []
    if (!/1e1b4b/i.test(svg)) out.push("call-indigo-icon.svg does not carry #1e1b4b")
    if (/1f1c4a|2a2564|161335|4d47a8|37327c|211d52/i.test(svg)) {
      out.push("call-indigo-icon.svg still carries a v1 indigo gradient stop")
    }
    return out
  })

  check("the raster icons are the new brand, flattened where the platform needs it", () => {
    // PNG colour type is byte 25: 6 = truecolour + alpha, 2 = truecolour.
    // The 16/32 favicons keep a transparent surround (the disc is the shape);
    // apple-touch-icon is flattened onto the brand navy, because iOS masks the
    // square itself and a transparent corner renders black on some devices.
    const cases = [
      { file: "favicon-16.png", expect: 6, why: "transparent surround" },
      { file: "favicon-32.png", expect: 6, why: "transparent surround" },
      { file: "apple-touch-icon.png", expect: 2, why: "flattened for iOS" },
    ]
    const out = []
    for (const { file, expect, why } of cases) {
      const p = path.join(ROOT, "public", "assets", "images", file)
      if (!existsSync(p)) {
        out.push(`${file} is missing`)
        continue
      }
      const buf = readFileSync(p)
      if (buf.length < 26 || buf.slice(1, 4).toString() !== "PNG") {
        out.push(`${file} is not a PNG`)
        continue
      }
      if (buf[25] !== expect) {
        out.push(`${file} has PNG colour type ${buf[25]}, expected ${expect} (${why})`)
      }
    }
    return out
  })

  check("the dashboard uses the brand mark, not a CI monogram", () => {
    // PRD §7.1 forbids a hand-written component here, so the mark is inline
    // markup inside the two files that already render the brand.
    const out = []
    for (const f of ["src/components/app-sidebar.tsx", "src/admin/DesignSystemPage.tsx"]) {
      const src = readFileSync(path.join(ROOT, f), "utf8")
      if (/>CI</.test(src)) out.push(`${f} still renders the "CI" monogram`)
      if (!src.includes(PHONE_PATH)) out.push(`${f} does not render the brand phone glyph`)
    }
    return out
  })

  /* ── Legal copy — the policy must describe THIS build ─────────────────────
   *
   * The shipped Privacy Policy is flagged "Sample language". The client asked to replace
   * it with the old site's version, which turned out to be unedited WordPress boilerplate
   * describing blog comments, Gravatars and a login page this site does not have. The
   * same defect was already in our own copy: it claimed a service address the form never
   * asks for, automatic IP/browser collection with no analytics present anywhere, and
   * blanket consent to marketing texts the form never obtains.
   *
   * These checks couple the document to the implementation in BOTH directions, so
   * neither can move without the other: add an analytics script and this fails; delete
   * the sentence that says there is none and this fails too.
   */

  suite("Legal copy matches the build", "tests/verify.mjs")

  function walk(dir) {
    const out = []
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, e.name)
      if (e.isDirectory()) out.push(...walk(full))
      else out.push(full)
    }
    return out
  }

  const policy = pages.map((p) => ({ route: p.route, doc: element(p.clean, 'id="legal-privacy"') }))
  const terms = pages.map((p) => ({ route: p.route, doc: element(p.clean, 'id="legal-terms"') }))
  const policyText = policy.map((d) => textOf(d.doc ?? ""))

  check("both legal dialogs render on every route", () => [
    ...policy.filter((d) => !d.doc).map((d) => `${d.route} — no #legal-privacy dialog`),
    ...terms.filter((d) => !d.doc).map((d) => `${d.route} — no #legal-terms dialog`),
  ])

  check("the legal copy is identical on all four routes", () => {
    // It is duplicated four times — chrome-markup.ts, plus an inline copy on each
    // mirror page — so "corrected one copy, missed the others" is the expected
    // failure mode here, not a hypothetical one.
    const out = []
    for (const [label, list] of [["Privacy Policy", policy], ["Terms of Service", terms]]) {
      const first = list[0]
      for (const d of list.slice(1)) {
        if (d.doc !== first.doc) out.push(`${label} on ${d.route} differs from ${first.route}`)
      }
    }
    return out
  })

  check("the policy claims no tracking the build does not have", () => {
    // Matching bare product names is not usable: `segment` collides with the
    // Design System's "Segment Accents" tokens and `amplitude`/`fathom` are
    // ordinary English. Match the wiring instead — a script/link URL, a package
    // import, or a tracker global.
    const TRACKERS = [
      /(?:src|href)\s*=\s*["'][^"']*(?:googletagmanager|google-analytics|plausible|posthog|mixpanel|segment\.(?:com|io)|hotjar|amplitude|clarity\.ms|fathom|matomo|statcounter)[^"']*["']/i,
      /from\s+["'](?:posthog-js|mixpanel|@segment\/|@amplitude\/|react-ga|react-hotjar|@vercel\/analytics|plausible-tracker|fathom-client|@sentry\/)[^"']*["']/i,
      /\bgtag\s*\(|\bdataLayer\b|\bfbq\s*\(|\b_gaq\b|\bposthog\.(?:init|capture)\s*\(/,
    ]
    const out = []
    for (const f of [...walk(path.join(ROOT, "src")), path.join(ROOT, "index.html")]) {
      const text = readFileSync(f, "utf8")
      for (const re of TRACKERS) {
        const hit = re.exec(text)
        if (hit) out.push(`${path.relative(ROOT, f).replace(/\\/g, "/")} — matches ${re} ("${hit[0]}")`)
      }
    }
    for (const t of policyText) {
      if (!/runs no analytics/i.test(t)) {
        out.push("the policy no longer states that the site runs no analytics")
      }
    }
    return [...new Set(out)]
  })

  check("the policy does not promise to collect an address the form never asks for", () => {
    const form = readFileSync(path.join(ROOT, "src/marketing/pages/ContactPage.tsx"), "utf8")
    const names = [...form.matchAll(/name="([a-zA-Z-]+)"/g)].map((m) => m[1])
    const out = []
    if (names.includes("address")) {
      out.push("the inquiry form now collects an address — the policy has to be updated with it")
    }
    for (const t of policyText) {
      if (/service address/i.test(t)) out.push("the policy claims a service address the form does not collect")
    }
    return [...new Set(out)]
  })

  check("the policy and the form agree about marketing contact", () => {
    const form = textOf(readFileSync(path.join(ROOT, "src/marketing/pages/ContactPage.tsx"), "utf8"))
    const out = []
    // The promise the visitor actually reads, beside the submit button.
    if (!/only to answer this request/i.test(form)) {
      out.push('the form no longer promises to use details "only to answer this request"')
    }
    for (const t of policyText) {
      if (/including by text message/i.test(t)) out.push("the policy still asserts consent to marketing texts")
      if (!/do not send marketing texts/i.test(t)) out.push("the policy no longer rules out marketing texts")
    }
    return [...new Set(out)]
  })

  /* -------------------------------------------------------------------------
   * Credentials — the strip that used to be placeholders
   *
   * Until 2026-09-21 this band showed six stock "Logoipsum" marks under the
   * heading "Trusted By Leading Brands", with alt="Brand 1".."Brand 6". Every
   * text-based check in this file passed, because the whole defect lived inside
   * the IMAGES — there was no scaffolding word in the markup to catch. So these
   * assertions read the image references and the alt text instead of the copy.
   */
  suite("Credentials, not placeholder brands", "tests/verify.mjs")

  const brandStrips = pages.filter((p) => /id="brands"/.test(p.clean))

  check("the credentials band exists and is the only one", () => {
    if (brandStrips.length === 0) return ["no page carries the credentials band (#brands)"]
    return []
  })

  check("no page loads a placeholder brand mark", () => {
    const out = []
    for (const p of pages) {
      const srcs = [...p.clean.matchAll(/src="([^"]*assets\/images\/[^"]+)"/g)].map((m) => m[1])
      for (const src of srcs) {
        if (/tc-logo|logoipsum/i.test(src)) out.push(`${p.route} — placeholder brand image ${src}`)
      }
    }
    return [...new Set(out)]
  })

  check("the credentials band shows six badges with real alt text", () => {
    const out = []
    for (const p of brandStrips) {
      const strip = element(p.clean, 'id="brands"') ?? ""
      const imgs = strip.match(/<img[^>]*>/g) ?? []
      if (imgs.length !== 6) out.push(`${p.route} — ${imgs.length} credential badges, expected 6`)
      for (const tag of imgs) {
        // `attr()` returns every match, not the first one.
        const alt = (attr(tag, "alt")[0] ?? "").trim()
        // "Brand 1" is exactly the placeholder alt this replaced.
        if (!alt) out.push(`${p.route} — credential badge with no alt text`)
        else if (/^Brand\s*\d/i.test(alt)) out.push(`${p.route} — placeholder alt "${alt}"`)
      }
    }
    return [...new Set(out)]
  })

  check("the credentials heading does not claim unnamed brands", () => {
    const out = []
    for (const p of brandStrips) {
      const strip = element(p.clean, 'id="brands"') ?? ""
      const heading = (strip.match(/<h2[^>]*>([^<]*)<\/h2>/) ?? [])[1] ?? ""
      if (!heading.trim()) out.push(`${p.route} — credentials band has no heading`)
      else if (/leading brands/i.test(heading)) {
        out.push(`${p.route} — heading still claims "leading brands" over accreditation badges`)
      }
    }
    return out
  })

  check("the credentials band sits under the testimonials, not the FAQ", () => {
    // The client asked for this move explicitly: as a trust signal the band
    // belongs beside the reviews it corroborates, not underneath the FAQ. It is
    // asserted on DOM order because the move is invisible to every other check
    // in this file — the band renders identically wherever it sits, so nothing
    // else here would notice it sliding back down the page.
    const out = []
    for (const p of brandStrips) {
      const iReviews = p.clean.indexOf('id="reviews"')
      const iBrands = p.clean.indexOf('id="brands"')
      const iFaq = p.clean.indexOf('id="faq"')
      if (iReviews === -1 || iFaq === -1) {
        out.push(`${p.route} — cannot judge the order: the page has no #reviews or no #faq`)
        continue
      }
      if (!(iReviews < iBrands && iBrands < iFaq)) {
        out.push(`${p.route} — #brands is at ${iBrands}, outside #reviews(${iReviews}) … #faq(${iFaq})`)
      }
    }
    return out
  })

  // ───────────────────────────────────────────────────────────────────────────
  // Three defects, one shared property: every assertion that came before was
  // blind to them. One lived in CSS paint order (this suite renders markup, it
  // has no layout engine), and two lived in the header markup that each page
  // duplicates inline rather than genuinely sharing.
  //
  // So these checks assert on the class strings that DECIDE the rendering, and
  // on exact counts. A count is deliberate: "no page has the wrong chip" passes
  // when a page has no chips at all, which is precisely how the chip bug got
  // through the first time.
  // ───────────────────────────────────────────────────────────────────────────
  suite("Service heroes and page primaries", "tests/verify.mjs")

  const servicePages = pages.filter((p) => p.name === "residential" || p.name === "commercial")

  check("every service-card icon chip is positioned above its photo", () => {
    const out = []
    let positioned = 0
    for (const p of pages) {
      const chips = [...p.clean.matchAll(/<img[^>]*services-icon\d\.png[^>]*>/g)].map((m) => m[0])
      for (const tag of chips) {
        const cls = attr(tag, "class")[0] ?? ""
        // `relative` is what makes the chip paint after the photo. Without it the
        // photo wrapper's overflow:hidden covers the chip's top 32px — measured
        // at 27px of cyan visible instead of 56px.
        if (/(^|\s)relative(\s|$)/.test(cls)) positioned++
        else out.push(`${p.route} — icon chip is not positioned: "${cls.slice(0, 48)}…"`)
      }
    }
    if (positioned !== 12) {
      out.push(`found ${positioned} positioned chips, expected 12 (6 on /, 6 on /residential)`)
    }
    return out
  })

  check("the hero proof-pill rows are gone from both service pages", () => {
    const out = []
    for (const p of servicePages) {
      // `bg-white/10` + uppercase + that tracking value existed only in the hero
      // pill rows. A leftover anywhere on the page is a failure.
      const n = (p.clean.match(/bg-white\/10[^"]*uppercase[^"]*tracking-\[0\.16em\]/g) ?? []).length
      if (n) out.push(`${p.route} — still renders ${n} hero proof pill(s)`)
    }
    return out
  })

  check("both service heroes open with the same hero-eyebrow kicker", () => {
    const out = []
    const want = {
      residential: "Residential &amp; home services",
      commercial: "Commercial &amp; facility services",
    }
    for (const p of servicePages) {
      const found = [...p.clean.matchAll(/<span class="hero-eyebrow">([^<]*)<\/span>/g)].map((m) => m[1])
      if (found.length !== 1) {
        out.push(`${p.route} — ${found.length} hero eyebrows, expected exactly 1`)
      } else if (found[0].trim() !== want[p.name]) {
        out.push(`${p.route} — eyebrow reads "${found[0]}", expected "${want[p.name]}"`)
      }
    }
    return out
  })

  check("the three marketing pages each paint their hero a different primary", () => {
    const out = []
    const expected = { home: "bg-brand", residential: "bg-residential", commercial: "bg-commercial" }
    const seen = {}
    for (const p of pages) {
      const want = expected[p.name]
      if (!want) continue
      const m = p.clean.match(/<section[^>]*scrim-hero[^>]*>/)
      if (!m) {
        out.push(`${p.route} — no hero slab found`)
        continue
      }
      const cls = attr(m[0], "class")[0] ?? ""
      if (!new RegExp(`\\b${want}\\b`).test(cls)) {
        out.push(`${p.route} — hero slab lacks ${want}: "${cls.slice(0, 52)}…"`)
      }
      seen[p.name] = want
    }
    // Three pages, three distinct values. Also fails if a page went missing.
    if (Object.keys(seen).length !== 3) out.push(`only ${Object.keys(seen).length} heroes checked, expected 3`)
    if (new Set(Object.values(seen)).size !== 3) {
      out.push(`primaries collide: ${JSON.stringify(seen)}`)
    }
    return out
  })

  check("the header's active pill agrees with its page's primary", () => {
    const out = []
    const expected = {
      home: "bg-sky",
      residential: "bg-residential",
      commercial: "bg-commercial",
      contact: "bg-sky",
    }
    for (const p of pages) {
      const want = expected[p.name]
      if (!want) continue
      // Two nav presentations carry aria-current: the header pill (h-[42px]) and
      // the mobile drawer row (py-3). Only the header pill is under test.
      const pills = [...p.clean.matchAll(/<a[^>]*>/g)]
        .map((m) => m[0])
        .filter((t) => /aria-current="page"/.test(t) && /h-\[42px\]/.test(t))
      if (pills.length !== 1) {
        out.push(`${p.route} — ${pills.length} header active pills, expected 1`)
        continue
      }
      const cls = attr(pills[0], "class")[0] ?? ""
      if (!new RegExp(`\\b${want}\\b`).test(cls)) {
        out.push(`${p.route} — active pill is "${cls.slice(0, 40)}…", expected ${want}`)
      }
    }
    return out
  })

  check("each service page scopes its scrim to its own primary", () => {
    const out = []
    for (const p of servicePages) {
      const want = `page-${p.name}`
      // Without this the slab changes colour but the ::before scrim keeps the
      // template's blue at 88% opacity and the blue wins.
      if (!new RegExp(`class="[^"]*\\b${want}\\b`).test(p.clean)) {
        out.push(`${p.route} — root does not carry ${want}; the scrim would stay template-blue`)
      }
    }
    return out
  })

  check("the stylesheet defines a scrim tint and a utility per service primary", () => {
    const css = distCss()
    if (!css) return ["dist CSS not found — the suite expects the build to have run first"]
    const out = []
    const hex = { residential: "#215583", commercial: "#2c3a96" }
    for (const [name, value] of Object.entries(hex)) {
      if (!new RegExp(`--color-${name}\\s*:\\s*${value}`, "i").test(css)) {
        out.push(`--color-${name} is not ${value} in the built stylesheet`)
      }
      if (!new RegExp(`\\.bg-${name}\\s*\\{`).test(css)) {
        out.push(`.bg-${name} was not emitted by Tailwind`)
      }
      if (!new RegExp(`\\.page-${name}\\s*\\{[^}]*--color-scrim-hero`).test(css)) {
        out.push(`.page-${name} does not override --color-scrim-hero`)
      }
    }
    if (!/\.hero-eyebrow\s*\{/.test(css)) out.push(".hero-eyebrow was not emitted")
    return out
  })

  suite("CTA bands carry the client's mark and no floating badge", "tests/verify.mjs")

  /* The template shipped its own demo logo (`logo-vector.png`) as a decorative
     watermark on all three CTA bands, where it drew a large cyan glyph that read
     as a "P" over the photo. The client's official lockup replaces it.

     Everything here scans `clean`, not `html`. The replacement comments name the
     old asset, so a raw-markup scan would match the explanation of the change
     rather than the change - and would pass on a page that still shipped it. */
  check("no marketing page still loads the template's demo logo", () =>
    pages
      .filter((p) => /src="\/assets\/images\/logo-vector\.png"/.test(p.clean))
      .map((p) => `${p.route} — still loads logo-vector.png, the template's demo logo`),
  )

  /* Anchored to the badge's own positioning classes rather than to its size or
     its glyph, so the pattern survives a resize and stays usable as the positive
     control below. The 12 chrome lockups cannot satisfy it: they are not
     `absolute -right-7`.

     This suite is now INVERTED. It used to prove the badge was present on each
     CTA band and correctly built; the client asked for it to be deleted
     ("a phone logo floating between the visual and the information block"),
     so it now proves the badge is gone. An absence assertion is worth nothing
     unless the pattern can still see the thing it is asserting the absence of,
     which is why the first check below exists. */
  const BADGE = /<span class="[^"]*absolute -right-7 top-1\/2 hidden[^"]*rounded-full[^"]*">[\s\S]{0,700}?<\/span>/g

  check("the CTA badge pattern still matches the markup it was written for", () => {
    // Positive control for the check that follows. Without it, a pattern that had
    // quietly stopped matching would make "no page carries the badge" pass while
    // the badge sat on all three pages — which is exactly the shape of failure
    // this file has been bitten by before.
    const fixture =
      '<span class="absolute -right-7 top-1/2 hidden -translate-y-1/2 rounded-full bg-white shadow-xl md:grid">' +
      '<span class="grid size-[61px] place-items-center"><svg viewBox="0 0 24 24"><path d="M13.832 16.568"/></svg></span></span>'
    const n = (fixture.match(new RegExp(BADGE.source, "g")) ?? []).length
    return n === 1
      ? []
      : [`the CTA badge pattern matched ${n} of 1 synthetic badge(s) — it is dead, so the absence check proves nothing`]
  })

  check("no marketing page still floats the CTA phone badge", () => {
    return pages
      .map((p) => ({ route: p.route, n: (p.clean.match(BADGE) ?? []).length }))
      .filter((r) => r.n !== 0)
      .map((r) => `${r.route} — still carries ${r.n} CTA phone badge(s), expected 0`)
  })

  check("every chrome lockup still draws one and the same phone glyph", () => {
    // Salvaged from the badge suite, which compared the badge's glyph against the
    // chrome's. The badge is gone, but this half never depended on it: if the 12
    // lockups drifted to two different glyph paths, the brand mark would differ
    // between the header and the footer and nothing else in this file would say
    // so. This is what makes the lockup the *official* mark rather than a
    // lookalike — the path data has to be byte-identical everywhere it appears.
    //
    // `shrink-0 rounded-full` is the chrome-lockup signature. A looser pattern
    // also catches the "Schedule Online" button's arrow disc, which draws
    // `M7 17L17 7M9 7h8v8` and would read as a second, non-brand glyph.
    const chrome = new Set()
    for (const p of pages) {
      const re = /shrink-0 rounded-full (?:bg-\[#1e1b4b\]|bg-white)[^"]*">[\s\S]{0,600}?<path d="([^"]+)"/g
      let m
      while ((m = re.exec(p.clean)) !== null) chrome.add(m[1])
    }
    return chrome.size === 1 ? [] : [`the chrome lockups draw ${chrome.size} distinct glyph paths, expected 1`]
  })

  suite("Theme tokens are authorable", "tests/verify.mjs")

  /* The three marketing primaries are authorable from /admin/design. The colour
     values necessarily appear twice — `index.css` needs one for first paint,
     before any JS runs, and the picker needs one to seed its inputs — and CSS
     cannot import TypeScript. That duplication is the whole risk here, so it is
     asserted rather than trusted. */
  const theme = await load("src/lib/theme.ts", "theme")
  const cssSource = readFileSync(path.join(ROOT, "src", "index.css"), "utf8")

  /* Rendered up front, NOT inside the check below. `check` is synchronous and
     treats a returned promise as "no problems", so an `async` assertion would
     report a green tick while asserting nothing. Note this renders in the page's
     loading state — `renderToStaticMarkup` does not run effects, so `useApiData`
     never fires and the picker rows are skeletons. The caveat text sits outside
     that branch, which is why it is the thing worth asserting here. */
  const designHtml = await render("src/admin/DesignSystemPage.tsx", "design-system")

  check("the theme module's defaults match the stylesheet", () => {
    const out = []
    for (const t of theme.THEME_TOKENS) {
      // First declaration wins: the `@theme` block is the authoritative one, and
      // every later use of the token is a `var()` reference with no value.
      const m = new RegExp(`${t.token}\\s*:\\s*(#[0-9a-fA-F]{3,8})`).exec(cssSource)
      if (!m) {
        out.push(`${t.token} is not declared in src/index.css`)
      } else if (m[1].toLowerCase() !== t.default.toLowerCase()) {
        out.push(
          `${t.token}: index.css has ${m[1]}, src/lib/theme.ts default is ${t.default} — the picker would seed the wrong value`,
        )
      }
    }
    return out
  })

  check("a colour value is normalised or rejected", () => {
    const cases = [
      ["#215583", "#215583", "lowercase passes through"],
      ["#2C3A96", "#2c3a96", "uppercase is lowered"],
      ["  #2c3a96  ", "#2c3a96", "surrounding space is trimmed"],
      ["#abc", "#aabbcc", "the 3-digit form is expanded"],
      ["#21558", null, "5 digits is not a colour"],
      ["#2155830", null, "7 digits is not a colour"],
      ["215583", null, "a missing # is not a colour"],
      ["#gggggg", null, "non-hex characters are not a colour"],
      ["", null, "empty is not a colour"],
      [null, null, "null is not a colour"],
      [{}, null, "an object is not a colour"],
    ]
    return cases
      .filter(([input, want]) => theme.normaliseHex(input) !== want)
      .map(([input, want, why]) => `${why}: normaliseHex(${JSON.stringify(input)}) returned ${JSON.stringify(theme.normaliseHex(input))}, expected ${JSON.stringify(want)}`)
  })

  check("an invalid colour is dropped rather than applied", () => {
    // The load-bearing safety property. A corrupt localStorage record must not be
    // able to paint the site black, and a half-typed value must not blank a token.
    const applied = {}
    theme.applyTheme(
      { style: { setProperty: (k, v) => (applied[k] = v) } },
      { themeHome: "chartreuse", themeResidential: "#215583", themeCommercial: undefined },
    )
    const keys = Object.keys(applied)
    const out = []
    if (keys.length !== 1 || keys[0] !== "--color-residential") {
      out.push(`applied ${JSON.stringify(keys)}, expected only --color-residential`)
    }
    if (applied["--color-residential"] !== "#215583") {
      out.push(`--color-residential was set to ${applied["--color-residential"]}`)
    }
    return out
  })

  check("the copy-paste token block carries all three tokens", () => {
    const block = theme.cssTokenBlock({ themeHome: "#111111" })
    // A partial record must fall back to the shipped default, not emit a hole:
    // this text is what gets pasted into index.css, so a missing line would
    // silently delete a token from the stylesheet.
    const out = []
    for (const t of theme.THEME_TOKENS) {
      if (!new RegExp(`${t.token}\\s*:\\s*#[0-9a-f]{6}`, "i").test(block)) {
        out.push(`the block omits ${t.token}`)
      }
    }
    if (!block.includes("--color-brand: #111111")) {
      out.push("the block did not use the value it was given")
    }
    if (!block.includes(`--color-residential: ${theme.THEME_TOKENS[1].default}`)) {
      out.push("an absent key did not fall back to its shipped default")
    }
    return out
  })

  check("every shipped primary clears its contrast bars", () => {
    // The real product requirement, asserted on the shipped defaults rather than
    // on a formula: white body copy needs AA 4.5:1, and the cyan eyebrow is
    // large text at 3:1. A picker makes this easy to break by accident.
    const out = []
    for (const t of theme.THEME_TOKENS) {
      const body = theme.contrastRatio("#ffffff", t.default)
      const eyebrow = theme.contrastRatio(theme.EYEBROW_ACCENT, t.default)
      if (body === null || body < theme.CONTRAST_BARS.body) {
        out.push(`${t.label} ${t.default}: white copy is ${body?.toFixed(2)}:1, below ${theme.CONTRAST_BARS.body}`)
      }
      if (eyebrow === null || eyebrow < theme.CONTRAST_BARS.eyebrow) {
        out.push(`${t.label} ${t.default}: cyan eyebrow is ${eyebrow?.toFixed(2)}:1, below ${theme.CONTRAST_BARS.eyebrow}`)
      }
    }
    // Negative-control the maths itself: white on black is exactly 21:1.
    const known = theme.contrastRatio("#ffffff", "#000000")
    if (known === null || Math.abs(known - 21) > 0.01) {
      out.push(`contrastRatio(white, black) returned ${known}, expected 21 — the readout cannot be trusted`)
    }
    return out
  })

  check("each page scrim is derived from its own primary", () => {
    const css = distCss()
    if (!css) return ["dist CSS not found — the suite expects the build to have run first"]
    const out = []
    // The baseline pair lands on `:root,:host` (Tailwind emits both), so the
    // selector is matched as a pattern rather than as a literal string.
    const scopes = [
      ["--color-brand", ":root(?:,:host)?", "the baseline"],
      ["--color-residential", "\\.page-residential", "/residential"],
      ["--color-commercial", "\\.page-commercial", "/commercial"],
    ]
    for (const [token, selector, where] of scopes) {
      // Derived, not literal. A literal tint is pinned to whatever was current
      // when it was written, so a runtime override of the primary would leave the
      // old colour painting over the new slab — the hero would barely appear to
      // change, which is exactly the bug this derivation removes.
      const re = new RegExp(`${selector}\\{[^}]*color-mix\\(in srgb, var\\(${token}\\)`)
      if (!re.test(css)) {
        out.push(`${where} (${selector}) does not derive its scrim from var(${token}) with color-mix`)
      }
    }
    return out
  })

  check("the design page says a saved theme is per-browser", () => {
    // Not decoration: the picker rethemes the real pages the moment a colour
    // moves, so without this the page reads as though it published the change to
    // the live site. If the caveat is ever deleted, the UI becomes a lie.
    const text = textOf(designHtml).replace(/\s+/g, " ")
    const out = []
    if (!/this browser, not the live site/i.test(text)) {
      out.push("the per-browser limitation is not stated")
    }
    if (!/local storage|localStorage/i.test(text)) {
      out.push("the page does not say where a saved theme is stored")
    }
    return out
  })
}
