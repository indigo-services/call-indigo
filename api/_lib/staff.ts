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
 * ── Why there is no writer here yet ─────────────────────────────────────────
 *
 * A level is set by one statement (see `docs/60-reference/data-layer.md` § "Setting
 * a level"), not by an endpoint. There are two people in this organization and
 * both are Clerk admins, so a `PUT /api/staff` would be an endpoint with no
 * caller — the same dead surface #95 is cleaning up. The team screen that gives it
 * a caller is filed as its own issue rather than half-built here.
 *
 * Adding `setStaffRole` later is a dozen lines; guessing at its validation now is
 * how a write path ends up with a rule nobody decided.
 */
import { sql } from "./db.js"
import { isStaffRole, type StaffRole } from "./roles.js"

interface Row {
  role: string
}

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
  const rows = await sql<Row>("select role from staff where clerk_user_id = $1 and active = true", [userId])
  const role = rows[0]?.role
  return isStaffRole(role) ? role : null
}
