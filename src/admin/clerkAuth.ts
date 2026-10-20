/**
 * Admin access — resolved in ONE function, from Clerk organization membership.
 *
 * ⚠️ THIS IS A UI GATE, NOT AUTHORIZATION. Everything it protects is rendered in
 * the browser and can be bypassed by anyone willing to edit the bundle. There is
 * no server yet (see `docs/40-project/audit-backend-and-clerk-readiness-2026-10-20.md`,
 * F1), so there is nothing here that could authorize data. Its job is to decide
 * which screens an operator is shown, and to say plainly why when the answer is
 * "none". When a backend lands, the same role has to be re-checked there.
 *
 * ── The model, and why it changed ────────────────────────────────────────────
 *
 * Until issue #74 this was one flat flag on the user's public metadata — a single
 * `role === "admin"` string. One boolean, no organization, no per-feature access:
 * every signed-in admin saw all nine pages.
 *
 * Access now comes from a membership in a specific Clerk organization, and the
 * membership's role decides which feature areas are visible. Measured against the
 * production instance before choosing:
 *
 *   · organizations are ENABLED (`organization_settings.enabled = true`);
 *   · the organization is "Indigo Services" (`org_3KmfJ9xVJNIs6N6uNmJSsD5SqHb`);
 *   · both existing users are already `org:admin` in it.
 *
 * So the migration is a code change only — nobody has to be re-provisioned, and
 * the flat flag is retired rather than kept as a fallback. A fallback would be a
 * second grant path that nothing exercises, which is how a permission model rots:
 * it would keep working long after the thing it was bridging away from is gone.
 *
 * ⚠️ Read the membership list, not the "active organization". A user can be an
 * admin of an organization without having selected it in this session, so a gate
 * that only looked at `orgId` would lock out a legitimate operator on every fresh
 * sign-in. `resolveAdminAccess` therefore accepts both, and treats the active
 * session as a second view of the same fact rather than a separate rule.
 */

/**
 * A feature area, not a page.
 *
 * Deliberately coarser than `ADMIN_ROUTES`: grouping is a presentation decision
 * (#73 collapses Design and Reference into Settings sub-panes) and must not
 * change who can see what. One area per *reason* someone is trusted with it.
 */
export type AdminFeature = "inbox" | "settings" | "design" | "reference"

export const ALL_ADMIN_FEATURES: readonly AdminFeature[] = [
  "inbox",
  "settings",
  "design",
  "reference",
]

/**
 * The one organization whose membership grants dashboard access.
 *
 * Pinned by id, not by role alone. Clerk's `creator_role` on this instance is
 * `org:admin`, so "any organization where the user is an admin" would let anyone
 * able to create an organization make themselves an admin of it — and pass the
 * gate. Comparing the id is what makes the role meaningful.
 *
 * Hard-coded rather than read from a `VITE_*` variable: this is a single
 * production instance, the id never varies between local, preview and production,
 * and a missing variable would fail the gate open or shut depending on how it was
 * read. A second Clerk instance needs this line changed, which is the point — it
 * is a decision, not configuration.
 */
export const ADMIN_ORG_ID = "org_3KmfJ9xVJNIs6N6uNmJSsD5SqHb"

/** The organization's display name, for the message shown when access is denied. */
export const ADMIN_ORG_NAME = "Indigo Services"

export type AdminRole = "admin" | "member"

/** Clerk's built-in organization role keys. Custom roles are not accepted. */
const ROLE_KEYS: Record<AdminRole, string> = {
  admin: "org:admin",
  member: "org:member",
}

/**
 * What each role can see.
 *
 * `admin` is every area. `member` is the day-to-day surfaces — the inbox and the
 * settings that include the member's own profile, notifications and security —
 * but not the brand system or the engineering documentation, which are for
 * whoever changes the site. Adding a feature here is the whole of granting it.
 */
const FEATURES_BY_ROLE: Record<AdminRole, readonly AdminFeature[]> = {
  admin: ALL_ADMIN_FEATURES,
  member: ["inbox", "settings"],
}

const NO_FEATURES: ReadonlySet<AdminFeature> = new Set<AdminFeature>()

export type AdminDenialReason = "granted" | "no-membership" | "insufficient-role"

export interface AdminAccess {
  allowed: boolean
  /** The role that granted access, or null when denied. */
  role: AdminRole | null
  features: ReadonlySet<AdminFeature>
  /** Why. Drives the message `AccessDenied` shows, so it can be specific. */
  reason: AdminDenialReason
}

/**
 * The parts of Clerk's `User` and `AuthObject` this needs.
 *
 * Structural rather than imported: `resolveAdminAccess` is the only thing in the
 * app that decides access, and it must be testable against plain objects without
 * a Clerk provider. Clerk's own types satisfy these shapes.
 */
export interface AdminAccessSubject {
  /** `user.organizationMemberships` — independent of the active organization. */
  memberships?:
    | ReadonlyArray<{
        organization?: { id?: string | null } | null
        role?: string | null
      }>
    | null
  /** `useAuth().orgId` — the organization selected in this session, if any. */
  activeOrgId?: string | null
  /** `useAuth().orgRole` — the role in that organization. */
  activeOrgRole?: string | null
}

function denied(reason: AdminDenialReason): AdminAccess {
  return { allowed: false, role: null, features: NO_FEATURES, reason }
}

/**
 * The single resolver. Every access decision in the app comes from here.
 *
 * Admin is checked before member so a user holding both roles gets the wider one
 * regardless of the order Clerk returns the memberships in.
 */
export function resolveAdminAccess(subject: AdminAccessSubject | null | undefined): AdminAccess {
  if (!subject) return denied("no-membership")

  const roles: (string | null | undefined)[] = []

  for (const membership of subject.memberships ?? []) {
    if (membership?.organization?.id === ADMIN_ORG_ID) roles.push(membership.role)
  }

  // The active session is the same fact seen from a different endpoint. Only
  // trusted for the pinned organization — `orgId` comes from the session, so it
  // cannot be forged from the client.
  if (subject.activeOrgId === ADMIN_ORG_ID && subject.activeOrgRole) {
    roles.push(subject.activeOrgRole)
  }

  if (roles.length === 0) return denied("no-membership")

  for (const role of ["admin", "member"] as const) {
    if (roles.includes(ROLE_KEYS[role])) {
      return {
        allowed: true,
        role,
        features: new Set(FEATURES_BY_ROLE[role]),
        reason: "granted",
      }
    }
  }

  return denied("insufficient-role")
}

/** Whether this access includes a feature area. */
export function can(access: AdminAccess, feature: AdminFeature): boolean {
  return access.allowed && access.features.has(feature)
}
