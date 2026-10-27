/**
 * Who may do what — resolved once, server-side, before any handler touches data.
 *
 * This is the only authorization boundary in the project. The `/admin` gate is a
 * curtain: `src/admin/clerkAuth.ts` says so itself, and ADR 0002 records it as a
 * deliberate ceiling — with no server there was nothing to enforce against. There
 * is a server now, so every endpoint that reads a lead or writes a setting calls
 * `requireCapability()` and names the one capability it needs.
 *
 * ── Two sources, one decision ────────────────────────────────────────────────
 *
 *   · **Clerk** answers *are you in Indigo Services?* — the organization is
 *     pinned by id, because `creator_role` on this instance is `org:admin`, so
 *     "any organization where I am an admin" is reachable by anyone who can
 *     create one.
 *   · **`staff`** answers *at what level?* — see `api/_lib/roles.ts` for why the
 *     level is not in Clerk (custom roles are plan-gated: `POST
 *     /v1/organization_roles` returns `402 unsupported_subscription_plan_features`).
 *
 * The session's active organization is tried first and a membership lookup is the
 * fallback — a person can hold a membership without having selected that
 * organization, and a gate that only read `org_id` would lock a legitimate
 * operator out of every fresh sign-in.
 *
 * ⚠️ **Fail closed, and say which kind of failure it was.** "I cannot tell who
 * you are" is `503 auth_unavailable`; "I know who you are and you may not" is
 * `403`. Collapsing the two turns a database blip into a support ticket about
 * permissions, and turns a real refusal into something a caller retries.
 */
import { createClerkClient, verifyToken } from "@clerk/backend"
import { bearer, type ApiRequest } from "./http.js"
import { staffRoleFor } from "./staff.js"
import {
  capabilitiesFor,
  hasCapability,
  roleFromOrgRole,
  type AccessRole,
  type Capability,
  type StaffRole,
} from "./roles.js"

/** Indigo Services. Pinned, not discovered — see the docblock. */
export const ORGANIZATION_ID = "org_3KmfJ9xVJNIs6N6uNmJSsD5SqHb"

/** Clerk's built-in admin key. The only role on this plan that grants anything by itself. */
const CLERK_ADMIN_ROLE = "org:admin"

export interface AdminClaims {
  orgId?: string
  orgRole?: string
}

/**
 * The role key a session token's own claims carry, or `null`.
 *
 * Pure, and exported so it can be asserted directly: verifying the token is
 * Clerk's code, but comparing it against the *right* organization is ours, and
 * getting it wrong still returns a valid user.
 */
export function orgRoleFromClaims(claims: AdminClaims): string | null {
  if (claims.orgId !== ORGANIZATION_ID) return null
  return claims.orgRole ?? null
}

/** The role key a membership list (Backend API shape) carries for the pinned org. */
export function orgRoleFromMemberships(
  memberships: ReadonlyArray<{ organization: { id: string }; role: string }>,
): string | null {
  const match = memberships.find((m) => m.organization.id === ORGANIZATION_ID)
  return match?.role ?? null
}

/** What a caller may do. Returned on success so a handler can log the actor's level. */
export interface AccessGrant {
  userId: string
  role: AccessRole
  capabilities: readonly Capability[]
}

export type AuthResult =
  | ({ ok: true } & AccessGrant)
  | { ok: false; status: number; error: string; capability?: Capability }

const deny = (status: number, error: string): AuthResult => ({ ok: false, status, error })

/** The failure branch, narrowed — the only shape a handler ever sends back. */
export type AuthDenial = Extract<AuthResult, { ok: false }>

/**
 * The response body for a refusal.
 *
 * One function rather than the same ternary in every handler: the capability is
 * the useful half of a `403`, and an endpoint that dropped it would look
 * identical from the outside while being much harder to diagnose.
 */
export function denialBody(result: AuthDenial): Record<string, unknown> {
  return result.capability ? { error: result.error, capability: result.capability } : { error: result.error }
}

/**
 * Verify the caller and work out their level. Does **not** check a capability.
 *
 * `/api/me` needs exactly this: the caller's own role and capability list, which
 * is what the admin shell renders its nav from. Everything else wants
 * `requireCapability()` below.
 */
export async function resolveAccess(req: ApiRequest): Promise<AuthResult> {
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
  let orgRole: string | null
  try {
    const payload = await verifyToken(token, { secretKey })
    userId = payload.sub
    orgRole = orgRoleFromClaims({
      orgId: typeof payload.org_id === "string" ? payload.org_id : undefined,
      orgRole: typeof payload.org_role === "string" ? payload.org_role : undefined,
    })
  } catch {
    // Expired, forged, wrong instance — all the same answer to the caller.
    return deny(401, "invalid_token")
  }

  // Fallback: the token carries no usable organization claim (no active org in
  // this session). Ask the Backend API for the memberships instead of refusing.
  if (!orgRole) {
    try {
      const clerk = createClerkClient({ secretKey })
      const memberships = await clerk.users.getOrganizationMembershipList({ userId })
      orgRole = orgRoleFromMemberships(memberships.data)
    } catch (err) {
      console.error("auth: membership lookup failed", err)
      return deny(503, "auth_unavailable")
    }
  }

  // Signed in, but not in Indigo Services. There is no level to look up.
  if (!orgRole) return deny(403, "not_staff")

  // A Clerk admin is admin outright, and never reaches the database — which is
  // what keeps the operators working while `staff` is empty, and what stops a bad
  // row from demoting the only person who could fix it.
  let staffRole: StaffRole | null = null
  if (orgRole !== CLERK_ADMIN_ROLE) {
    try {
      staffRole = await staffRoleFor(userId)
    } catch (err) {
      // The table is missing or unreachable. We cannot tell this person's level,
      // which is not the same as deciding they have none.
      console.error("auth: staff lookup failed", err)
      return deny(503, "auth_unavailable")
    }
  }

  const role = roleFromOrgRole(orgRole, staffRole)
  return { ok: true, userId, role, capabilities: capabilitiesFor(role) }
}

/**
 * Resolve the caller and require one capability.
 *
 * Call this **before** parsing a query, reading a body or touching the database:
 * a caller who is about to be refused should cause no work and learn nothing.
 * `tests/backend.mjs` asserts the ordering at every call site, because a status
 * code alone cannot distinguish "refused" from "refused after writing".
 */
export async function requireCapability(req: ApiRequest, capability: Capability): Promise<AuthResult> {
  const access = await resolveAccess(req)
  if (!access.ok) return access
  if (!hasCapability(access.role, capability)) {
    // The capability is named in the response on purpose: it is not a secret, and
    // "you need settings:write" is the difference between a bug report and a fix.
    return { ok: false, status: 403, error: "missing_capability", capability }
  }
  return access
}
