/**
 * Admin access — the organization check, and the capabilities the server granted.
 *
 * ⚠️ THIS IS A UI GATE, NOT AUTHORIZATION. Everything it protects is rendered in
 * the browser and can be bypassed by anyone willing to edit the bundle. Every
 * admin read and write is authorized again by the function that serves it —
 * `api/inquiries.ts`, `api/settings.ts` and `api/notification-settings.ts` each
 * call `requireCapability()` before they touch the database. What this file
 * decides is which screens an operator is *shown*.
 *
 * ── What changed, and why ───────────────────────────────────────────────────
 *
 * Until issue #100 this file held its own role→page table: `admin` got every area,
 * `member` got the inbox and settings. The server disagreed. `requireAdmin`
 * refused `org:member` outright, so a member was shown a Settings page that
 * answered `403 not_an_admin` on every save — a UI promising what the server
 * denies, which reads to the operator as a broken feature rather than a boundary.
 *
 * The table is gone. Capabilities now come from `GET /api/me`, which is the same
 * list `requireCapability()` checks against, so the two cannot disagree. What
 * remains here is:
 *
 *   1. the organization check, which only Clerk can answer, and
 *   2. a **floor** — what a Clerk role is guaranteed to be able to do before the
 *      server has replied.
 *
 * ⚠️ The floor is deliberately the narrowest reading, never the widest. A member
 * sees the inbox before `/api/me` answers and gains nothing it cannot have; if
 * the call fails, the floor stands and the operator sees less than they are
 * entitled to, never more. Over-promising would put the 403 back.
 *
 * ── The model, and why it changed once already ──────────────────────────────
 *
 * Before #74 this was one flat flag on the user's public metadata — a single
 * `role === "admin"` string. One boolean, no organization, no per-feature access:
 * every signed-in admin saw all nine pages.
 *
 * Access now comes from a membership in a specific Clerk organization. Measured
 * against the production instance before choosing:
 *
 *   · organizations are ENABLED (`organization_settings.enabled = true`);
 *   · the organization is "Indigo Services" (`org_3KmfJ9xVJNIs6N6uNmJSsD5SqHb`);
 *   · both existing users are already `org:admin` in it.
 *
 * ⚠️ Read the membership list, not the "active organization". A user can be a
 * member of an organization without having selected it in this session, so a gate
 * that only looked at `orgId` would lock out a legitimate operator on every fresh
 * sign-in. `resolveOrgAccess` therefore accepts both, and treats the active
 * session as a second view of the same fact rather than a separate rule.
 *
 * ⚠️ **Only two organization roles exist on this Clerk plan.** `org:admin` and
 * `org:member`. Custom roles are plan-gated (`POST /v1/organization_roles` →
 * `402 unsupported_subscription_plan_features`), so the three staff levels —
 * Admin, Service Manager, Service Rep — live in Postgres and reach the browser
 * through `/api/me`. See `api/_lib/roles.ts`.
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

/** The two roles this Clerk plan can issue. Nothing else is accepted. */
export type OrgRole = "admin" | "member"

const ORG_ROLE_KEYS: Record<OrgRole, string> = {
  admin: "org:admin",
  member: "org:member",
}

/**
 * The capability names this build understands.
 *
 * A **duplicate** of `ALL_CAPABILITIES` in `api/_lib/roles.ts`, and the one place
 * in this app where a copy is unavoidable: the two sides are built by different
 * toolchains (`tsconfig.app.json` vs `tsconfig.api.json`) and `api/` may not be
 * imported from `src/`. `tests/backend.mjs` asserts the two lists are identical,
 * so a capability added on the server and forgotten here fails the build rather
 * than silently hiding a page from everybody.
 */
export const KNOWN_CAPABILITIES = [
  "inbox:read",
  "inbox:write",
  "inbox:delete",
  "settings:read",
  "settings:write",
  "reference:read",
] as const

export type Capability = (typeof KNOWN_CAPABILITIES)[number]

/**
 * Which feature areas each capability opens.
 *
 * ⚠️ **Only capabilities that make a page *usable* appear here.** `settings:read`
 * deliberately opens nothing: a Service Manager carries it, but the settings pages
 * are forms whose only action is Save, and saving needs `settings:write`. Showing a
 * manager a page where every control is disabled is the same lie as showing a member
 * a page that answers `403` — just quieter. `settings:read` still has a real job
 * server-side (it gates `GET` on the private keys); the read-only delivery view that
 * gives it a client surface is #93's Notifications rewrite.
 *
 * `settings:write` opens two areas because the Design page writes the `site` key,
 * and writing any key is `settings:write`.
 *
 * An unknown capability opens nothing, so a server that grows a capability before
 * this table does hides a page instead of inventing one.
 */
const FEATURES_FOR_CAPABILITY: Partial<Record<Capability, readonly AdminFeature[]>> = {
  "inbox:read": ["inbox"],
  "settings:write": ["settings", "design"],
  "reference:read": ["reference"],
}

/**
 * What a Clerk role is guaranteed to be able to do, before `/api/me` answers.
 *
 * `admin` is every capability because Clerk's `org:admin` *is* admin on the
 * server — `roleFromOrgRole` short-circuits on it without reading the `staff`
 * table, so this is exact rather than optimistic.
 *
 * `member` is `inbox:read` alone. A staff row may raise that to rep or manager;
 * nothing may lower it, and this file must not assume the raise has happened.
 */
const FLOOR_CAPABILITIES: Record<OrgRole, readonly Capability[]> = {
  admin: KNOWN_CAPABILITIES,
  member: ["inbox:read"],
}

export type AdminDenialReason = "granted" | "no-membership" | "insufficient-role"

/**
 * What Clerk alone can say: whether this person is in Indigo Services, and in
 * which of the two built-in roles.
 *
 * A discriminated union rather than `{ allowed, reason }`, so that after
 * `if (!access.allowed)` the compiler knows `orgRole` exists and no caller has to
 * assert it.
 */
export type OrgAccess =
  | { allowed: true; orgRole: OrgRole; capabilities: readonly Capability[] }
  | { allowed: false; reason: AdminDenialReason }

/**
 * The parts of Clerk's `User` and `AuthObject` this needs.
 *
 * Structural rather than imported: this is the only thing in the app that decides
 * which organization a person is in, and it must be testable against plain
 * objects without a Clerk provider. Clerk's own types satisfy these shapes.
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

/**
 * The organization check. Every access decision starts here.
 *
 * Admin is checked before member so a user holding both roles gets the wider one
 * regardless of the order Clerk returns the memberships in.
 */
export function resolveOrgAccess(subject: AdminAccessSubject | null | undefined): OrgAccess {
  if (!subject) return { allowed: false, reason: "no-membership" }

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

  if (roles.length === 0) return { allowed: false, reason: "no-membership" }

  for (const role of ["admin", "member"] as const) {
    if (roles.includes(ORG_ROLE_KEYS[role])) {
      return { allowed: true, orgRole: role, capabilities: FLOOR_CAPABILITIES[role] }
    }
  }

  return { allowed: false, reason: "insufficient-role" }
}

/** What the shell renders from. Only constructed when access has been granted. */
export interface AdminAccess {
  /** The level the request is running as: admin, service_manager, service_rep or member. */
  role: string
  capabilities: ReadonlySet<Capability>
  features: ReadonlySet<AdminFeature>
}

/** The capability list as the shell needs it: a set of areas. */
export function featuresForCapabilities(
  capabilities: readonly string[],
): ReadonlySet<AdminFeature> {
  const features = new Set<AdminFeature>()
  for (const capability of capabilities) {
    for (const feature of FEATURES_FOR_CAPABILITY[capability as Capability] ?? []) {
      features.add(feature)
    }
  }
  return features
}

/** Build the shell's view from a role and the capabilities the server granted. */
export function accessFrom(role: string, capabilities: readonly Capability[]): AdminAccess {
  return {
    role,
    capabilities: new Set(capabilities),
    features: featuresForCapabilities(capabilities),
  }
}

/** Whether this access includes a feature area. */
export function can(access: AdminAccess, feature: AdminFeature): boolean {
  return access.features.has(feature)
}
