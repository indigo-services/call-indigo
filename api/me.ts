/**
 * `GET /api/me` — who the caller is, and what they may do.
 *
 * The admin shell renders its navigation from this, and from nothing else. Before
 * it existed the client had its own role→page table in `src/admin/clerkAuth.ts`,
 * which had already drifted: it showed `org:member` the Settings page that
 * `api/settings.ts` refused with `403`. A UI that promises what the server denies
 * is worse than a missing page, because the operator reads the error as a bug in
 * the feature rather than a boundary.
 *
 * One call per shell mount, cached for the session. The capability list is small
 * and non-secret — it is the same list this person's own requests are checked
 * against, so telling them is telling them nothing they cannot already infer.
 *
 * ── Why this will grow rather than be replaced ──────────────────────────────
 *
 * Membership state (`lead` / `customer` / `member`) is the next field here, once
 * there is a subscription to derive it from. Deliberately one endpoint: two calls
 * to answer "what may I do" is two chances to render a half-loaded shell.
 */
import { methodNotAllowed, type ApiRequest, type ApiResponse } from "./_lib/http.js"
import { resolveAccess } from "./_lib/auth.js"

const ALLOWED = "GET"

export default async function handler(req: ApiRequest, res: ApiResponse): Promise<void> {
  const method = req.method ?? "GET"
  if (method !== "GET") {
    methodNotAllowed(res, ALLOWED)
    return
  }

  const access = await resolveAccess(req)
  if (!access.ok) {
    res.status(access.status).json({ error: access.error })
    return
  }

  res.status(200).json({
    userId: access.userId,
    role: access.role,
    capabilities: access.capabilities,
  })
}
