import * as React from "react"

const MOBILE_BREAKPOINT = 768
const QUERY = `(max-width: ${MOBILE_BREAKPOINT - 1}px)`

/**
 * The browser is the store here, so `useSyncExternalStore` is the right tool:
 * the media query is the subscription, and the snapshot is read during render
 * instead of being copied into state by an effect. The effect version rendered
 * `false` once on mount and corrected itself afterwards, which also meant a
 * synchronous setState in an effect (react-hooks/set-state-in-effect).
 */
function subscribe(onChange: () => void) {
  const mql = window.matchMedia(QUERY)
  mql.addEventListener("change", onChange)
  return () => mql.removeEventListener("change", onChange)
}

function getSnapshot() {
  return window.innerWidth < MOBILE_BREAKPOINT
}

export function useIsMobile() {
  return React.useSyncExternalStore(subscribe, getSnapshot, () => false)
}
