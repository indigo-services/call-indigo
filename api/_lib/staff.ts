/**
 * The `staff` table — who works here, and at what level.
 *
 * One read is on the hot path: every request from a non-Clerk-admin resolves its
 * level here. It is one indexed lookup on a primary key, which is the price of
 * being able to change someone's level without them signing in again.
 *
 * ⚠️ **A Clerk `org:admin` never reaches this file.** `api/_lib/auth.ts` short-
 * circuits before calling in, so the two existing operators keep working while
 * this table is empty — and a broken row, or the table itself being absent, can
 * only ever reduce what someone may do.
 *
 * ── Why the writer lives here now ───────────────────────────────────────────
 *
 * Until issue #102 a level was set by one statement in a psql session, and this
 * file deliberately had no writer: `PUT /api/staff` with nothing to press would
 * have been the dead surface #95 is cleaning up. The Team screen gives it a
 * caller, so the write path arrives in the same change as the screen — with its
 * rules decided here, in one place, rather than at the call site.
 *
 * The rules are three, and each exists because the alternative is a row that
 * silently does nothing or an operator who appears to have locked themselves out:
 *
 *   1. **The user must be a member of Indigo Services.** A row for a non-member
 *      is inert — `api/_lib/auth.ts` refuses them before the lookup — so
 *      accepting one would let an admin set a level and watch nothing happen.
 *      `api/staff.ts` asks Clerk; `membershipIncludes()` below is the guard that
 *      the answer is about *that* user and not the whole roster.
 *   2. **Nobody changes their own level.** The Clerk-admin short-circuit means a
 *      self-demotion cannot actually remove access, so it would not break
 *      anything — it would look broken, because the nav would keep offering the
 *      pages the new level says nothing about. Refusing is the honest answer to
 *      a control whose effect nobody can see.
 *   3. **`active` is tri-state.** Omitted means "do not touch it", so changing a
 *      leaver's role does not quietly restore their access. Withdrawing access
 *      is an explicit `false`, which is also why deleting is not offered: the
 *      row is the record of who was once allowed to read a customer's number.
 *
 * ── And a fourth thing the row cannot hold: who did it ──────────────────────
 *
 * `staff.updated_at` says when a level changed and never said who changed it, so
 * #102 turned an unattributable fact into an unattributable action. `staff_audit`
 * records every transition — including the ones a single `updated_by` column
 * would overwrite — and the write below puts the level change and its audit row in
 * ONE statement. Two requests would leave the failure #114 calls worse than
 * neither: a promotion that committed with no record of who made it, which is
 * indistinguishable from a promotion made before the audit existed.
 *
 * ⚠️ The actor is `auth.userId` from the verified session, never a body field.
 * A body field would let a caller attribute their own change to someone else,
 * which is worse than no attribution at all — it is a false one.
 */
import { sql } from "./db.js"
import { isStaffRole, type StaffRole } from "./roles.js"

/** A row, in the shape the API and the Team screen use. */
export interface StaffRecord {
  userId: string
  role: StaffRole
  active: boolean
  /** ISO 8601, as Neon returns `timestamptz`. */
  createdAt: string
  updatedAt: string
}

/** What a caller asked to change. `active: null` means "leave it as it is". */
export interface StaffUpdate {
  userId: string
  role: StaffRole
  active: boolean | null
}

interface DbRow {
  clerk_user_id: string
  role: string
  active: boolean
  created_at: string
  updated_at: string
}

const toRecord = (row: DbRow): StaffRecord => ({
  userId: row.clerk_user_id,
  // The column has a CHECK constraint, so anything else means the constraint was
  // dropped. Falling back to the narrowest level keeps a bad row from widening.
  role: isStaffRole(row.role) ? row.role : "service_rep",
  active: row.active === true,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
})

/**
 * The level for one person, or `null` when there is no active row.
 *
 * `null` is not "denied" — it is "no level has been assigned", and the caller
 * turns that into the `member` floor. Returning a default here would hide the
 * difference between "nobody set this up" and "somebody set it to rep".
 *
 * Throws when the database is unreachable, deliberately: `requireCapability`
 * turns that into `503`, because "I cannot tell" must not read as "you may not".
 */
export async function staffRoleFor(userId: string): Promise<StaffRole | null> {
  const rows = await sql<{ role: string }>(
    "select role from staff where clerk_user_id = $1 and active = true",
    [userId],
  )
  const role = rows[0]?.role
  return isStaffRole(role) ? role : null
}

/**
 * Every row, active or not.
 *
 * Inactive rows are included on purpose: the screen has to show a leaver as a
 * leaver, and hiding them would make "their access is off" indistinguishable
 * from "they were never here".
 */
export async function listStaff(): Promise<StaffRecord[]> {
  const rows = await sql<DbRow>(
    `select clerk_user_id, role, active, created_at, updated_at
       from staff
      order by active desc, created_at asc`,
  )
  return rows.map(toRecord)
}

/**
 * Did this write change anything?
 *
 * The pure statement of the rule the SQL below applies in `where`. It is exported
 * so the truth table can be asserted offline — CI has no database, and "a PUT that
 * changes nothing writes no audit row" is the half of #114 that would otherwise
 * only ever be tested by a person with a psql session.
 *
 * ⚠️ `before === null` is a change. A first assignment moves someone from *no
 * level* to *a level*, which is the transition most worth recording: "who made
 * this person a manager" is usually the answer "nobody's predecessor, it was set
 * up on the first day".
 */
export function changesLevel(before: LevelState | null, after: LevelState): boolean {
  if (!before) return true
  return before.role !== after.role || before.active !== after.active
}

/** A level as the database holds it, without the timestamps. */
export interface LevelState {
  role: StaffRole
  active: boolean
}

/** What a level change produced, and whether it was worth recording. */
export interface StaffChange {
  staff: StaffRecord
  /** False when the row already said this — no audit row was written. */
  audited: boolean
}

/**
 * Set a level, record who set it, and return the stored row.
 *
 * ⚠️ `coalesce($3, staff.active)` on the conflict branch, not `excluded.active`:
 * an update that did not mention `active` must not resurrect a deactivated
 * person. `coalesce($3::boolean, true)` on the insert branch is the same idea
 * from the other side — a new row defaults to active, which is the only case
 * where "unspecified" can safely mean "yes".
 *
 * ── One statement, and why that is not an optimisation ──────────────────────
 *
 * The level change and its audit row are the same statement, so there is no
 * window in which one has committed and the other has not. Two requests would
 * give exactly the failure #114 says is worse than neither: a promotion with no
 * record of who made it, indistinguishable from a promotion made before the audit
 * existed.
 *
 * A data-modifying `WITH` is the only way to do that here — the driver prepares
 * one statement at a time, so `begin … commit` is not available. The three CTEs
 * are:
 *
 *   `previous` — the row as it was. Every sub-statement of a `WITH` query sees
 *                the SAME snapshot, so this reads the pre-statement state even
 *                though `upserted` writes the table.
 *   `upserted` — the write, returning what the database stored.
 *   `logged`   — the audit row, inserted only when `previous` and `upserted`
 *                disagree on the role or on `active`.
 *
 * `is distinct from` rather than `<>` throughout: on a first assignment
 * `previous.role` is NULL, and `NULL <> 'admin'` is NULL, which `where` reads as
 * false — so `<>` would silently drop the audit row for the one transition that
 * matters most.
 *
 * `audited` is returned rather than inferred by the caller, because the caller
 * cannot see which branch ran. It is the count of rows `logged` wrote.
 */
export async function upsertStaffLevel(
  update: StaffUpdate,
  actorId: string,
): Promise<StaffChange> {
  const rows = await sql<DbRow & { audit_rows: number | string }>(
    `with previous as (
       select role, active from staff where clerk_user_id = $1
     ), upserted as (
       insert into staff (clerk_user_id, role, active)
       values ($1, $2, coalesce($3::boolean, true))
       on conflict (clerk_user_id) do update
          set role = excluded.role,
              active = coalesce($3::boolean, staff.active),
              updated_at = now()
       returning clerk_user_id, role, active, created_at, updated_at
     ), logged as (
       insert into staff_audit (actor_id, subject_id, from_role, to_role, from_active, to_active)
       select $4, u.clerk_user_id, p.role, u.role, p.active, u.active
         from upserted u
         left join previous p on true
        where p.role is distinct from u.role
           or p.active is distinct from u.active
       returning id
     )
     select u.clerk_user_id, u.role, u.active, u.created_at, u.updated_at,
            (select count(*) from logged) as audit_rows
       from upserted u`,
    [update.userId, update.role, update.active, actorId],
  )
  const row = rows[0]
  if (!row) throw new Error("staff upsert returned no row")
  return { staff: toRecord(row), audited: Number(row.audit_rows) > 0 }
}

/* ── The audit log ───────────────────────────────────────────────────────── */

/** One recorded transition, as the API and the Team screen use it. */
export interface StaffAuditRecord {
  id: number
  /** Who made the change. A Clerk user id — see the migration on why it is not a foreign key. */
  actorId: string
  /** Whose level changed. */
  subjectId: string
  /** Null on a first assignment: there was no previous level. */
  fromRole: StaffRole | null
  toRole: StaffRole
  fromActive: boolean | null
  toActive: boolean
  /** ISO 8601, as Neon returns `timestamptz`. */
  at: string
}

interface DbAuditRow {
  id: number | string
  actor_id: string
  subject_id: string
  from_role: string | null
  to_role: string
  from_active: boolean | null
  to_active: boolean
  at: string
}

/**
 * The most recent transitions, newest first.
 *
 * A limit rather than pagination: the panel answers "what changed lately", and a
 * screen that has to paginate an audit log is a screen nobody reads. The full
 * history for one person is a query away and is not built yet — #114 asks for a
 * record that can be read, not for a compliance export.
 *
 * `id` is `bigint`, which Neon may return as a string to avoid losing precision
 * past 2^53. Coerced here so the type is honest rather than "number, usually".
 */
export async function listStaffAudit(limit = 25): Promise<StaffAuditRecord[]> {
  const rows = await sql<DbAuditRow>(
    `select id, actor_id, subject_id, from_role, to_role, from_active, to_active, at
       from staff_audit
      order by at desc, id desc
      limit $1`,
    [limit],
  )
  return rows.map((row) => ({
    id: Number(row.id),
    actorId: row.actor_id,
    subjectId: row.subject_id,
    // `from_role` is genuinely nullable and must stay so: "from nothing" is a
    // fact, and a default here would invent a promotion that never happened.
    fromRole: isStaffRole(row.from_role) ? row.from_role : null,
    toRole: isStaffRole(row.to_role) ? row.to_role : "service_rep",
    fromActive: row.from_active === null ? null : row.from_active === true,
    toActive: row.to_active === true,
    at: row.at,
  }))
}

/* ── The roster: Clerk's membership, Postgres's level ─────────────────────── */

/** One person, as the Team screen renders them. */
export interface RosterEntry {
  userId: string
  /** Display name, or the identifier when the account has no name set. */
  name: string
  /** The email (or username) Clerk shows for the account. */
  email: string
  imageUrl: string
  /** Clerk's role in Indigo Services — `org:admin` or `org:member`. */
  orgRole: string
  /**
   * The staff level, or `null` when no row exists.
   *
   * `null` is not "denied": the server gives that person the `member` floor, and
   * the screen says so. A row that exists but is inactive reports its level with
   * `active: false` — "was a rep, no longer" is a different fact from "never was".
   */
  role: StaffRole | null
  /**
   * Whether a row exists **and** is active.
   *
   * ⚠️ Only meaningful when `role` is non-null. A person with no row reports
   * `false` here, because "no level was ever set" and "the level was withdrawn"
   * both mean nothing is granted. `role === null` is what tells them apart — read
   * the pair, never this field alone.
   */
  active: boolean
}

/** The parts of Clerk's `OrganizationMembership` this needs. Structural, so a test can pass plain objects. */
export interface RosterMember {
  role: string
  publicUserData?:
    | {
        userId?: string | null
        firstName?: string | null
        lastName?: string | null
        identifier?: string | null
        imageUrl?: string | null
      }
    | null
}

/** Sort order for the roster: strongest level first, then no-level, then by name. */
const ROLE_RANK: Record<string, number> = {
  admin: 0,
  service_manager: 1,
  service_rep: 2,
}

/**
 * Clerk's members joined to the `staff` rows.
 *
 * ⚠️ **The roster comes from Clerk, not from the table.** The question the screen
 * answers is "who works here, and at what level", and the table alone can only
 * answer the second half — a member with no row is exactly the state that needs
 * showing, and they are absent from `staff` by definition. It also means a row
 * for someone who has left the organization cannot appear as a person.
 *
 * Pure, so the join can be asserted without Clerk or Postgres: a member with no
 * row, a member with a row, an inactive row, and a row whose owner is not a
 * member (dropped) are all one-liners here and impossible to stage through the
 * endpoint offline.
 */
export function buildRoster(
  members: ReadonlyArray<RosterMember>,
  rows: ReadonlyArray<StaffRecord>,
): RosterEntry[] {
  const byUserId = new Map(rows.map((row) => [row.userId, row]))

  const entries: RosterEntry[] = []
  for (const member of members) {
    const userId = member.publicUserData?.userId
    if (!userId) continue
    const row = byUserId.get(userId)
    const name =
      [member.publicUserData?.firstName, member.publicUserData?.lastName]
        .filter((part): part is string => typeof part === "string" && part.trim() !== "")
        .join(" ") || member.publicUserData?.identifier || userId

    entries.push({
      userId,
      name,
      email: member.publicUserData?.identifier ?? "",
      imageUrl: member.publicUserData?.imageUrl ?? "",
      orgRole: member.role,
      role: row?.role ?? null,
      active: row?.active ?? false,
    })
  }

  // A Clerk admin is `admin` whatever their row says, so they sort as admins —
  // the order on screen should match the order of who can do what, not the order
  // of who happens to have a row.
  const rank = (entry: RosterEntry): number => {
    if (entry.orgRole === "org:admin") return 0
    if (entry.role === null) return 3
    return ROLE_RANK[entry.role] ?? 3
  }

  return entries.sort((a, b) => rank(a) - rank(b) || a.name.localeCompare(b.name))
}

/* ── Validation, pure ─────────────────────────────────────────────────────── */

export type StaffValidation =
  | { ok: true; value: StaffUpdate }
  | { ok: false; fields: Record<string, string> }

/**
 * The shape of a `PUT /api/staff` body.
 *
 * Pure and exported so the rules can be asserted without a database or a token —
 * the same reason `validateInquiry()` is separate from the handler that calls it.
 *
 * `userId` is checked against Clerk's id shape, which is a **typo check, not a
 * validity check**: it turns "I pasted their email address" into a field error
 * naming the field, instead of a row for a user who does not exist. Whether the
 * id is real is Clerk's answer, asked by the endpoint.
 */
export function validateStaffUpdate(raw: unknown): StaffValidation {
  const input = (raw ?? {}) as Record<string, unknown>
  const fields: Record<string, string> = {}

  const userId = typeof input.userId === "string" ? input.userId.trim() : ""
  if (!/^user_[A-Za-z0-9_]+$/.test(userId)) fields.userId = "a Clerk user id, like user_2ab…"

  if (!isStaffRole(input.role)) fields.role = "admin, service_manager or service_rep"

  // `undefined` and `null` both mean "not mentioned". Anything else must be a
  // boolean: `active: "false"` is a string, and reading it as truthy would
  // restore access the caller meant to withdraw.
  let active: boolean | null = null
  if (input.active !== undefined && input.active !== null) {
    if (typeof input.active !== "boolean") fields.active = "true or false"
    else active = input.active
  }

  if (Object.keys(fields).length > 0) return { ok: false, fields }
  return { ok: true, value: { userId, role: input.role as StaffRole, active } }
}

/**
 * Why this change is refused before it is attempted, or `null`.
 *
 * Pure, and separate from the endpoint, so "nobody edits their own level" is a
 * rule a test can hold rather than a condition buried in a handler.
 */
export function staffRefusal(actorId: string, update: StaffUpdate): string | null {
  if (actorId === update.userId) return "cannot_change_own_level"
  return null
}

/**
 * Did Clerk answer about **this** user?
 *
 * The membership list is requested with a `userId` filter, and this checks the
 * answer actually honours it. If the filter were ever ignored — a renamed
 * parameter, a changed response shape — `data` would be the whole roster, every
 * id would "be a member", and the endpoint would accept a stranger with no error
 * anywhere. That is a failure mode a status code cannot show, so it is a
 * function.
 */
export function membershipIncludes(
  rows: ReadonlyArray<{ publicUserData?: { userId?: string | null } | null }>,
  userId: string,
): boolean {
  return rows.some((row) => row.publicUserData?.userId === userId)
}
