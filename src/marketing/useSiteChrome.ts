/**
 * useSiteChrome — the page behaviour of the static prototype, as a hook.
 *
 * The marketing pages render their markup from `BODY_HTML` via
 * `dangerouslySetInnerHTML`, so the elements the reference drives with
 * `valvoro-prototype/js/main.js` are present in the DOM but have no listeners
 * attached. Without this hook the ported design system renders an inert page —
 * most visibly, `.reveal { opacity: 0 }` never gets its `.visible` class, so
 * every scroll-revealed band stays blank.
 *
 * This is a faithful port of main.js, one-to-one:
 *
 *   1. footer year            `#year`            -> current year
 *   2. sticky header shadow   `#top`             -> `.is-scrolled` past 8px
 *   3. menu drawer            `#burger` / `#menu-panel` / `#menu-backdrop` /
 *                             `#menu-close`, plus the shared scroll lock
 *   4. legal modals           `[data-legal]` open, `[data-legal-x]` /
 *                             `[data-legal-close]` / Escape / scrim close,
 *                             Tab focus trap, and `#terms` / `#privacy` deep links
 *   5. reveal on scroll       `.reveal`          -> `.visible` via IntersectionObserver
 *   6. service-area check     `#zip-form` submit -> validate `#zip-input`
 *                             against the served ZIP ranges, reveal `#zip-result`
 *                             (INERT since 2026-09-21 — the client unpublished the
 *                             `#area` section that carried the form, so the guard
 *                             finds no form and does nothing. Kept because the
 *                             section is expected back; see CHANGELOG.)
 *   7. hero headline rotation `#hero-rotate`     -> cycles the hero's second word
 *                             through Plumbing / Electrical / HVAC / Home Services
 *                             / Facility Services, swapping `#hero-arch` to the
 *                             matching photograph as it goes, and auto-fitting
 *                             the font size so the longest option cannot reflow
 *                             the hero
 *
 * There is no item 8. A testimonial carousel was built for client item 6 on
 * 2026-09-29 and reverted the same day on the client's instruction — one review
 * at a time read sparser than the 3-across row it replaced. See the testimonials
 * note in `index.css` for the measurements.
 *
 * The prototype is a single long-lived page, so main.js can register listeners
 * once and forget them. Here the hook is mounted per route and unmounted on
 * navigation, so every listener, the observer, and the body scroll lock are
 * released in the cleanup.
 */
import { useEffect } from "react"

import { checkServiceArea } from "@/marketing/service-area"
import {
  ARCH_ALT_BY_SERVICE,
  ARCH_BY_SERVICE,
  ROTATION,
  fitFontSize,
  type ServiceCategory,
} from "@/marketing/hero-rotation"

/** `#terms` / `#privacy` deep links, and the modal ids themselves, all resolve. */
const LEGAL_HASHES: Record<string, string> = {
  "#terms": "legal-terms",
  "#privacy": "legal-privacy",
  "#legal-terms": "legal-terms",
  "#legal-privacy": "legal-privacy",
}

/**
 * Width of the text immediately after `el` — the "." in `Expert <word>.`.
 *
 * It is a SIBLING text node rather than part of the rotating span, so it inherits
 * the h1's font-size and does NOT shrink when the span is scaled down. The fit
 * has to budget for it or the period is orphaned onto a line of its own and the
 * hero grows by a line-height on the longest option. Returns 0 when there is no
 * trailing text, so the fit still behaves if the punctuation is ever dropped.
 */
function trailingWidth(el: Element): number {
  const next = el.nextSibling
  if (!next || next.nodeType !== Node.TEXT_NODE || !next.nodeValue?.trim()) return 0
  const range = document.createRange()
  range.selectNodeContents(next)
  let width = 0
  for (const rect of Array.from(range.getClientRects())) width += rect.width
  return width
}

export function useSiteChrome() {
  useEffect(() => {
    const disposers: Array<() => void> = []
    const on = (
      target: EventTarget,
      type: string,
      handler: EventListener,
      options?: AddEventListenerOptions,
    ) => {
      target.addEventListener(type, handler, options)
      disposers.push(() => target.removeEventListener(type, handler, options))
    }

    /* ---------- Footer year ---------- */
    const yearEl = document.getElementById("year")
    if (yearEl) yearEl.textContent = String(new Date().getFullYear())

    /* ---------- Sticky header shadow ---------- */
    const header = document.getElementById("top")
    const onScroll = () => {
      if (header) header.classList.toggle("is-scrolled", window.scrollY > 8)
    }
    on(window, "scroll", onScroll, { passive: true })
    onScroll()

    /* ---------- Scroll lock ----------
       Two independent layers can be open (the menu drawer and a legal modal), so
       the body lock is derived from their state instead of being set and cleared
       by each one — otherwise closing either would unlock the page while the
       other is still open. */
    const panel = document.getElementById("menu-panel")
    const legalModals = Array.from(document.querySelectorAll<HTMLElement>("[data-legal-modal]"))

    const syncScrollLock = () => {
      const locked =
        (panel?.classList.contains("open") ?? false) ||
        legalModals.some((m) => m.classList.contains("open"))
      document.body.style.overflow = locked ? "hidden" : ""
    }

    /* ---------- Menu drawer (hamburger) ---------- */
    const burger = document.getElementById("burger")
    const backdrop = document.getElementById("menu-backdrop")
    const closeBtn = document.getElementById("menu-close")

    const setMenu = (open: boolean) => {
      if (!panel) return
      panel.classList.toggle("open", open)
      panel.setAttribute("aria-hidden", String(!open))
      if (backdrop) backdrop.classList.toggle("show", open)
      if (burger) burger.setAttribute("aria-expanded", String(open))
      syncScrollLock()
    }

    if (burger) on(burger, "click", () => setMenu(!(panel?.classList.contains("open") ?? false)))
    if (closeBtn) on(closeBtn, "click", () => setMenu(false))
    if (backdrop) on(backdrop, "click", () => setMenu(false))
    if (panel) {
      on(panel, "click", (e) => {
        if ((e.target as Element)?.tagName === "A") setMenu(false)
      })
    }

    /* ---------- Full-page legal modals ---------- */
    let lastLegalTrigger: Element | null = null

    const openLegal = (id: string, trigger: Element | null) => {
      const modal = document.getElementById(id)
      if (!modal) return
      legalModals.forEach((m) => {
        const isOn = m === modal
        m.classList.toggle("open", isOn)
        m.setAttribute("aria-hidden", String(!isOn))
        if (isOn) {
          // Always reopen at the top, not where it was left off.
          const body = m.querySelector<HTMLElement>(".legal-body")
          if (body) body.scrollTop = 0
        }
      })
      lastLegalTrigger = trigger
      syncScrollLock()
      const x = modal.querySelector<HTMLElement>("[data-legal-x]")
      // preventScroll: `html { scroll-behavior: smooth }` would otherwise animate
      // the page behind the modal while it is trying to lock.
      if (x) x.focus({ preventScroll: true })
    }

    const closeLegal = () => {
      const wasOpen = legalModals.some((m) => m.classList.contains("open"))
      if (!wasOpen) return
      legalModals.forEach((m) => {
        m.classList.remove("open")
        m.setAttribute("aria-hidden", "true")
      })
      syncScrollLock()
      if (lastLegalTrigger && document.contains(lastLegalTrigger)) {
        ;(lastLegalTrigger as HTMLElement).focus({ preventScroll: true })
      }
      lastLegalTrigger = null
      // Drop the #terms / #privacy deep link so a reload does not reopen it.
      if (LEGAL_HASHES[location.hash]) {
        history.replaceState(null, "", location.pathname + location.search)
      }
    }

    on(document, "click", (e) => {
      const el = e.target as Element | null
      if (!el?.closest) return
      const trigger = el.closest("[data-legal]")
      if (trigger) {
        e.preventDefault()
        openLegal("legal-" + trigger.getAttribute("data-legal"), trigger)
        return
      }
      if (el.closest("[data-legal-close]")) {
        e.preventDefault()
        closeLegal()
      }
    })

    on(document, "keydown", (e) => {
      const key = (e as KeyboardEvent).key
      const open = legalModals.filter((m) => m.classList.contains("open"))[0]
      if (!open) {
        if (key === "Escape") setMenu(false)
        return
      }
      if (key === "Escape") {
        closeLegal()
        return
      }
      if (key !== "Tab") return
      // Keep Tab inside the dialog while it is open.
      const focusable = open.querySelectorAll<HTMLElement>('a[href], button:not([disabled])')
      if (!focusable.length) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if ((e as KeyboardEvent).shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!(e as KeyboardEvent).shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    })

    on(window, "hashchange", () => {
      const id = LEGAL_HASHES[location.hash]
      if (id) openLegal(id, null)
      else closeLegal()
    })

    if (LEGAL_HASHES[location.hash]) openLegal(LEGAL_HASHES[location.hash], null)

    /* ---------- Reveal on scroll ---------- */
    const revealEls = Array.from(document.querySelectorAll<HTMLElement>(".reveal"))
    let io: IntersectionObserver | null = null
    if ("IntersectionObserver" in window) {
      io = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add("visible")
              io?.unobserve(entry.target)
            }
          })
        },
        { threshold: 0.12 },
      )
      revealEls.forEach((el) => io?.observe(el))
    } else {
      revealEls.forEach((el) => el.classList.add("visible"))
    }

    /* ---------- Service-area availability check ----------
       The decision itself lives in `service-area.ts` so it can be tested without
       a browser; this only binds it to the DOM. The prototype revealed the
       result on any three characters typed, so "00000" was told we cover it. */
    const zipForm = document.getElementById("zip-form")
    if (zipForm) {
      const input = document.getElementById("zip-input") as HTMLInputElement | null
      const result = document.getElementById("zip-result") as HTMLElement | null

      const setResult = (message: string | null) => {
        if (!result) return
        if (message === null) {
          result.hidden = true
          result.textContent = ""
          return
        }
        result.textContent = message
        result.hidden = false
      }

      on(zipForm, "submit", (e) => {
        e.preventDefault()
        const verdict = checkServiceArea(input?.value ?? "")
        setResult(verdict.message)
        // Nothing was typed that could be a ZIP — put the cursor back rather than
        // making the visitor click the field again to correct it.
        if (!verdict.valid) input?.focus()
      })

      // A stale verdict next to a freshly typed ZIP is worse than no verdict.
      if (input) on(input, "input", () => setResult(null))
    }

    /* ---------- Hero headline rotation ----------
       The hero h1 reads "Expert <word>." and the client asked for the word to
       cycle, with the arch photograph beside it changing to match. The words and
       their photographs both live in `@/marketing/hero-rotation`, so the two
       lists cannot drift apart.

       `fit` keeps the headline a fixed height. The options differ in width by
       more than 3x — "HVAC" against "Facility Services" — and the period after
       the word is a SIBLING text node, so it stays at the h1's full size while
       the span shrinks. `fitFontSize` budgets for it explicitly; without that the
       column is filled exactly and the period drops to a line of its own on every
       pass of the longest option, growing the hero by one line-height. It re-runs
       on resize and once webfonts land.

       Rotation is skipped under `prefers-reduced-motion`, which leaves the first
       word — and its arch — in place, so the headline still reads correctly. */
    const rotator = document.getElementById("hero-rotate")
    const arch = document.getElementById("hero-arch") as HTMLImageElement | null
    let rotateTimer = 0
    let swapTimer = 0
    let fitObserver: ResizeObserver | null = null

    if (rotator) {
      const fit = () => {
        const available = rotator.parentElement?.clientWidth ?? 0
        if (!available) return
        rotator.style.fontSize = ""
        const base = parseFloat(getComputedStyle(rotator).fontSize)
        const shown = rotator.textContent
        let widest = 0
        for (const word of ROTATION) {
          rotator.textContent = word
          widest = Math.max(widest, rotator.scrollWidth)
        }
        rotator.textContent = shown
        const size = fitFontSize(base, widest, available, trailingWidth(rotator))
        if (size !== null) rotator.style.fontSize = `${size}px`
      }

      fit()
      if ("ResizeObserver" in window) {
        fitObserver = new ResizeObserver(fit)
        if (rotator.parentElement) fitObserver.observe(rotator.parentElement)
      }
      // Measurements taken before the webfont loads are in the fallback face.
      if (document.fonts?.ready) document.fonts.ready.then(fit).catch(() => {})

      /* Warm every arch up front. The rotation swaps `src` mid-cycle, so without
         this the first pass through the list would paint an empty frame while
         each file is fetched. The swap itself is deliberately NOT faded: the img
         carries the cyan ring and its 12px padding, so fading it would blink the
         frame. It changes while the word is at opacity 0 instead. */
      if (arch) {
        for (const word of ROTATION) {
          const src = ARCH_BY_SERVICE[word]
          if (arch.getAttribute("src") !== src) new Image().src = src
        }
      }

      if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        rotateTimer = window.setInterval(() => {
          rotator.style.opacity = "0"
          swapTimer = window.setTimeout(() => {
            const at = ROTATION.indexOf((rotator.textContent ?? "") as ServiceCategory)
            const next = ROTATION[(at + 1) % ROTATION.length]
            rotator.textContent = next
            rotator.style.opacity = "1"
            if (arch) {
              arch.src = ARCH_BY_SERVICE[next]
              arch.alt = ARCH_ALT_BY_SERVICE[next]
            }
          }, 280)
        }, 2600)
      }
    }

    /* ---------- Testimonial carousel — REMOVED 2026-09-29 ----------
       Client item 6 asked for a carousel because the 3-across review row read as
       too much white space. It was built, measured, and then reverted on the
       client's own instruction: one review at a time read SPARSER than the row
       it replaced (numbers in `index.css` under the testimonials note), so the
       white space is addressed by spacing instead. The section is a plain
       3-across grid again and needs no behaviour here.

       The driver that used to live at this point is deleted rather than left
       inert: an unused block matching `[data-reviews-carousel]` would find
       nothing and silently do nothing, which is exactly the "assertion that
       cannot see the thing it claims to check" shape this repo keeps hitting. */

    /* ---------- Cleanup ---------- */
    return () => {
      disposers.forEach((d) => d())
      io?.disconnect()
      if (rotateTimer) window.clearInterval(rotateTimer)
      if (swapTimer) window.clearTimeout(swapTimer)
      fitObserver?.disconnect()
      document.body.style.overflow = ""
    }
  }, [])
}
