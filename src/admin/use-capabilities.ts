/**
 * The capabilities this session actually has, from `GET /api/me`.
 *
 * The server is the only authority here — this hook exists so the shell can stop
 * keeping a second role table that drifts from it. What it returns is filtered
 * against `KNOWN_CAPABILITIES`, so a capability a newer deploy introduced is
 * ignored by an older bundle instead of being trusted blindly.
 *
 * ⚠️ `null` means "not answered yet", and the caller falls back to the floor in
 * `clerkAuth.ts`. That direction is deliberate: an unanswered call must never
 * look like a grant, and a failed one must never look like a denial either — the
 * pages behind the shell each report their own errors, and they are the ones that
 * know what they were refused.
 */
import { useEffect, useState } from "react"
import { useAuth } from "@clerk/react"
import { KNOWN_CAPABILITIES, type Capability } from "@/admin/clerkAuth"
import { api } from "@/lib/data/api"

export interface GrantedAccess {
  role: string
  capabilities: readonly Capability[]
}

export function useCapabilities(enabled: boolean): GrantedAccess | null {
  const { getToken } = useAuth()
  const [granted, setGranted] = useState<GrantedAccess | null>(null)

  useEffect(() => {
    if (!enabled) return
    // A late response must not overwrite a newer one — sign-out, or a switch of
    // organization, unmounts or re-runs this effect and flips the flag.
    let cancelled = false

    void (async () => {
      try {
        const data = await api.getMe(getToken)
        const known = new Set<string>(KNOWN_CAPABILITIES)
        const capabilities = (Array.isArray(data.capabilities) ? data.capabilities : []).filter(
          (c): c is Capability => typeof c === "string" && known.has(c),
        )
        if (cancelled) return
        setGranted({
          role: typeof data.role === "string" ? data.role : "member",
          capabilities,
        })
      } catch {
        // Offline, or the function is down. The floor stands.
      }
    })()

    return () => {
      cancelled = true
    }
  }, [enabled, getToken])

  return granted
}
