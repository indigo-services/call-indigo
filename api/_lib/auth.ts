/**
 * Who may change where the business's leads are sent.
 *
 * This is the first **server-side** authorization in the project. Until now the
 * `/admin` gate was a curtain — `src/admin/clerkAuth.ts` says so itself, and ADR
 * 0002 records it as a deliberate ceiling: with no server there was nothing to
 * enforce against. There is a server now, so an endpoint that can redirect every
 * future lead to an arbitrary inbox cannot rely on the curtain.
 *
 * The rule is deliberately the SAME rule the client uses, restated here because
 * the client's copy cannot be trusted:
 *
 *   · the organization is pinned BY ID — `creator_role` on this instance is
 *     `org:admin`, so "any organization where I am an admin" is reachable by
 *     anyone who can create one;
 *   · the session's active organization is tried first, and a membership lookup
 *     is the fallback — a person can hold an Admin membership without having
 *     selected that organization, and a gate that only read `org_id` would lock a
 *     legitimate operator out of every fresh sign-in.
 */
import { createClerkClient, verifyToken } from "@clerk/backend"
import { bearer, type ApiRequest } from "./http"

/** Indigo Services. Pinned, not discovered — see the docblock. */
const ORGANIZATION_ID = "org_3KmfJ9xVJNIs6N6uNmJSsD5SqHb"
const ADMIN_ROLE = "org:admin"

export interface AdminClaims {
  orgId?: string
  orgRole?: string
}

/**
 * Does a session token's own claims grant admin?
 *
 * Pure, and exported so it can be asserted directly. The token verification above
 * it is Clerk's code; this is the part that could be wrong in a way that still
 * returns a valid user — a comparison against the wrong organization, or against
 * a role name that this instance does not use.
 */
export function grantsAdmin(claims: AdminClaims): boolean {
  return claims.orgId === ORGANIZATION_ID && claims.orgRole === ADMIN_ROLE
}

/** Does a membership list (Backend API shape) grant admin? */
export function membershipGrantsAdmin(
  memberships: ReadonlyArray<{ organization: { id: string }; role: string }>,
): boolean {
  return memberships.some((m) => m.organization.id === ORGANIZATION_ID && m.role === ADMIN_ROLE)
}

export type AuthResult =
  | { ok: true; userId: string }
  | { ok: false; status: number; error: string }

const deny = (status: number, error: string): AuthResult => ({ ok: false, status, error })

export async function requireAdmin(req: ApiRequest): Promise<AuthResult> {
  const token = bearer(req)
  if (!token) return deny(401, "missing_token")

  const secretKey = process.env.CLERK_SECRET_KEY
  if (!secretKey) {
    // A missing secret is our misconfiguration, not the caller's fault — but it
    // must not fall open.
    console.error("auth: CLERK_SECRET_KEY is not set")
    return deny(500, "not_configured")
  }

  let userId: string
  let claimOrgId: string | undefined
  let claimRole: string | undefined
  try {
    const payload = await verifyToken(token, { secretKey })
    userId = payload.sub
    claimOrgId = typeof payload.org_id === "string" ? payload.org_id : undefined
    claimRole = typeof payload.org_role === "string" ? payload.org_role : undefined
  } catch {
    // Expired, forged, wrong instance — all the same answer to the caller.
    return deny(401, "invalid_token")
  }

  if (grantsAdmin({ orgId: claimOrgId, orgRole: claimRole })) {
    return { ok: true, userId }
  }

  // Fallback: the token carries no usable organization claim (no active org in
  // this session). Ask the Backend API for the memberships instead of refusing.
  try {
    const clerk = createClerkClient({ secretKey })
    const memberships = await clerk.users.getOrganizationMembershipList({ userId })
    if (membershipGrantsAdmin(memberships.data)) return { ok: true, userId }
  } catch (err) {
    console.error("auth: membership lookup failed", err)
    return deny(503, "auth_unavailable")
  }

  return deny(403, "not_an_admin")
}
