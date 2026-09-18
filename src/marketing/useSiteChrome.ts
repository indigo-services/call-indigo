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
 *   6. service-area check     `#zip-form` submit -> reveal `#zip-result`
 *
 * The prototype is a single long-lived page, so main.js can register listeners
 * once and forget them. Here the hook is mounted per route and unmounted on
 * navigation, so every listener, the observer, and the body scroll lock are
 * released in the cleanup.
 */
import { useEffect } from "react"

/** `#terms` / `#privacy` deep links, and the modal ids themselves, all resolve. */
const LEGAL_HASHES: Record<string, string> = {
  "#terms": "legal-terms",
  "#privacy": "legal-privacy",
  "#legal-terms": "legal-terms",
  "#legal-privacy": "legal-privacy",
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

    /* ---------- Service-area availability check ---------- */
    const zipForm = document.getElementById("zip-form")
    if (zipForm) {
      on(zipForm, "submit", (e) => {
        e.preventDefault()
        const input = document.getElementById("zip-input") as HTMLInputElement | null
        const result = document.getElementById("zip-result") as HTMLElement | null
        if (!input || !result) return
        if (input.value.trim().length >= 3) result.hidden = false
      })
    }

    /* ---------- Cleanup ---------- */
    return () => {
      disposers.forEach((d) => d())
      io?.disconnect()
      document.body.style.overflow = ""
    }
  }, [])
}
