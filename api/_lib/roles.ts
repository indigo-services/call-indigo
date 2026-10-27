/**
 * Who may do what, in one table.
 *
 * ── Why this is not in Clerk ─────────────────────────────────────────────────
 *
 * It was going to be. Clerk organizations are enabled on this instance and
 * `organization_settings.max_allowed_roles` reports **10**, which reads as "ten
 * custom roles are available". They are not. Measured 2026-10-27:
 *
 *     POST /v1/organization_roles
 *     → 402  unsupported_subscription_plan_features
 *            { unsupported_features: ["org:roles"] }
 *
 * `max_allowed_roles` is the ceiling for a plan that *includes* the feature; this
 * plan does not include it. `max_allowed_permissions` is **0** as well, so even
 * if a custom role could be created it could not carry a capability. The only
 * roles that exist are `org:admin` and `org:member`.
 *
 * So the split is: **Clerk says whether you are in Indigo Services; this table
 * says what that entitles you to.** `db/migrations/0003_staff.sql` holds the
 * level per person, and this file is the only place that turns a level into a
 * capability.
 *
 * That is a better arrangement than the one it replaces, and not only because it
 * is free:
 *
 *   · a permission map in a vendor dashboard is invisible to `git`, cannot be
 *     reviewed in a PR, and cannot be asserted by a test — this one can be all
 *     three, and `tests/backend.mjs` exercises it directly;
 *   · the level takes effect on the next request, where a Clerk role would be
 *     baked into the session token until it refreshed;
 *   · a capability that lives in code has an obvious place to be *checked*, and
 *     every endpoint below names the one it needs.
 *
 * ── The rule that makes this safe ────────────────────────────────────────────
 *
 * ⚠️ A capability is a **grant**, and `member` is the floor. A signed-in person
 * with no `staff` row is not denied the dashboard — they are given the one thing
 * an organization membership already implies: the right to *see* the work. Every
 * mutation needs a row. A missing table, a missing row or an inactive row can
 * therefore only ever reduce access, never raise it.
 */

/**
 * A capability, named `<area>:<action>`.
 *
 * Coarser than a page and finer than a role, because an endpoint needs exactly
 * one of these and a role is a bundle of them. `inbox:write` and `inbox:delete`
 * are separate because deleting a lead is the one action nobody can undo.
 */
export type Capability =
  | "inbox:read"
  | "inbox:write"
  | "inbox:delete"
  | "settings:read"
  | "settings:write"
  | "reference:read"

/** Every capability, in a stable order, so a test can assert the set exactly. */
export const ALL_CAPABILITIES: readonly Capability[] = [
  "inbox:read",
  "inbox:write",
  "inbox:delete",
  "settings:read",
  "settings:write",
  "reference:read",
]

/**
 * The three levels a `staff` row may hold.
 *
 * `admin` here is *not* Clerk's `org:admin`. A staff row can say `admin`, and a
 * Clerk admin is treated as `admin` regardless of their row — see
 * `roleFromOrgRole`. The two agree by default and disagree only if someone edits
 * a row to demote a Clerk admin, which the code refuses.
 */
export type StaffRole = "admin" | "service_manager" | "service_rep"

export const STAFF_ROLES: readonly StaffRole[] = ["admin", "service_manager", "service_rep"]

/**
 * The role the access decision actually ran as.
 *
 * `member` is not a staff level and never appears in the database: it is what a
 * verified organization member gets when there is no staff row for them. Keeping
 * it in this union rather than returning `null` means every consumer has a role
 * to display, and the "why can't I do this" message can say something specific.
 */
export type AccessRole = StaffRole | "member"

export const ACCESS_ROLES: readonly AccessRole[] = [...STAFF_ROLES, "member"]

/**
 * The whole model.
 *
 * Reading it as a table is the point — this is the artifact a reviewer checks.
 *
 * | | admin | manager | rep | member |
 * |---|---|---|---|---|
 * | read the inbox | ✓ | ✓ | ✓ | ✓ |
 * | change a lead's status or notes | ✓ | ✓ | ✓ | |
 * | delete a lead | ✓ | ✓ | | |
 * | read the notification address | ✓ | ✓ | | |
 * | change any setting | ✓ | | | |
 *
 * `settings:read` is granted to a manager on purpose: the notification address
 * decides where every future lead is emailed, and the person who runs the desk is
 * the person who notices it is wrong. Changing it is still admin-only, because a
 * write there redirects the business's leads.
 *
 * `reference:read` guards nothing on the server — the reference pages are static
 * documents — so it only decides whether the nav shows them. It is in the table
 * anyway, rather than derived from "is admin", so that adding a server-side
 * surface later means adding a check, not inventing a capability.
 */
export const CAPABILITIES: Record<AccessRole, readonly Capability[]> = {
  admin: ALL_CAPABILITIES,
  service_manager: ["inbox:read", "inbox:write", "inbox:delete", "settings:read", "reference:read"],
  service_rep: ["inbox:read", "inbox:write"],
  member: ["inbox:read"],
}

/** Is this string one of the three levels a `staff` row may hold? */
export function isStaffRole(value: unknown): value is StaffRole {
  return typeof value === "string" && (STAFF_ROLES as readonly string[]).includes(value)
}

/** The capabilities a role carries. Unknown roles get nothing, never everything. */
export function capabilitiesFor(role: AccessRole | null | undefined): readonly Capability[] {
  if (!role) return []
  return CAPABILITIES[role] ?? []
}

export function hasCapability(role: AccessRole | null | undefined, capability: Capability): boolean {
  return capabilitiesFor(role).includes(capability)
}

/**
 * Clerk's organization role plus the staff row → the role the request runs as.
 *
 * Two rules, and the first one is the important one:
 *
 * 1. **Clerk's `org:admin` wins outright.** It does not consult `staffRole` at
 *    all. This is what makes an empty `staff` table harmless — the two existing
 *    operators are both `org:admin`, so they keep full access on the day this
 *    ships — and it is also what stops a bad row from demoting the only person
 *    who could fix it.
 * 2. **Anything else is a `staff` row, or `member`.** `org:member` is the only
 *    other role this instance can issue, but the comparison is written against
 *    `org:admin` rather than in favour of `org:member`, so a role this code has
 *    never heard of degrades to the floor instead of falling through a gap.
 */
export function roleFromOrgRole(orgRole: string | null, staffRole: StaffRole | null): AccessRole {
  if (orgRole === "org:admin") return "admin"
  return staffRole ?? "member"
}
