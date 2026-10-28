/**
 * The Team screen's rules, with no JSX and no imports that need a browser.
 *
 * `TeamPage.tsx` renders these; this file decides them. The split exists because
 * the page pulls in Radix's `Select`, whose CJS dependencies cannot be imported
 * into the test runner — so anything defined *inside* the page cannot be asserted,
 * only grepped. Grepping is what let a real bug through once already (a "Restore"
 * button offered to a member who had no row), so the decisions live here, where
 * `tests/auth.mjs` can call them.
 *
 * ⚠️ Nothing here is authorization. `api/staff.ts` re-checks both capabilities;
 * this decides what is *offered*.
 */
import type { StaffAuditEntry, StaffLevel, StaffMember } from "@/lib/data/types"

/** The three levels, strongest first, with what each one actually means. */
export const LEVELS: ReadonlyArray<{ value: StaffLevel; label: string; hint: string }> = [
  { value: "admin", label: "Admin", hint: "Everything, including every setting." },
  {
    value: "service_manager",
    label: "Service Manager",
    hint: "Works the inbox and deletes leads. Reads settings, cannot change them.",
  },
  { value: "service_rep", label: "Service Rep", hint: "Reads and works the inbox. Cannot delete a lead." },
]

export const LEVEL_LABEL: Record<StaffLevel, string> = {
  admin: "Admin",
  service_manager: "Service Manager",
  service_rep: "Service Rep",
}

/**
 * The server's refusal code, as a sentence.
 *
 * The endpoint answers with a code (`not_a_member`) rather than prose so the
 * wording lives in one place and the API stays machine-readable. An unknown code
 * falls through to itself rather than to a friendly nothing — a message nobody
 * anticipated is still a message.
 */
const REFUSALS: Record<string, string> = {
  not_a_member:
    "That account is not a member of Indigo Services, so a level would have no effect. Add them to the organization first.",
  cannot_change_own_level: "You cannot change your own level. Ask another admin.",
  missing_capability: "Your level cannot change staff levels.",
  auth_unavailable: "Clerk could not be reached, so nothing was changed. Try again.",
  unavailable: "The database could not be reached, so nothing was changed.",
  validation_failed: "That request was not understood. Nothing was changed.",
}

export const refusalText = (code: string): string => REFUSALS[code] ?? code

/**
 * What the server will actually do for this person.
 *
 * Mirrors `roleFromOrgRole()` on purpose: the Clerk role wins outright, and a row
 * that exists but is inactive grants nothing. Duplicated rather than fetched
 * because it is a *rendering* of the rule, and asking the server to describe a
 * third party's access would be a second answer that could disagree with the
 * first.
 */
export function accessText(member: StaffMember): string {
  if (member.orgRole === "org:admin") return "Admin"
  if (!member.active) return "Read-only inbox"
  return member.role ? LEVEL_LABEL[member.role] : "Read-only inbox"
}

/** What may be offered on one row. */
export interface RowState {
  /** The level select may be drawn. */
  editable: boolean
  /** "Remove access" may be drawn — a row exists and is currently active. */
  canWithdraw: boolean
  /** "Restore" may be drawn — a row exists and is currently withdrawn. */
  canRestore: boolean
  /** The Inactive badge belongs on this row. */
  showInactive: boolean
}

/**
 * Which controls belong on a row.
 *
 * ⚠️ **`role === null` is what "no row" means, never `active === false`.** A
 * member with no row reports `active: false` — the same value as a withdrawn rep —
 * so testing `active` alone offers a brand-new member a **Restore** button, which
 * would create a level out of nothing. That bug was in the page for one edit
 * before the rule moved here, which is the argument for it being a function: it is
 * the one decision on this screen where a wrong answer becomes a grant.
 *
 * Nothing is offered for a Clerk admin (their level is never read) or for yourself
 * (the endpoint refuses it) — the two lies #103 removed, one level down.
 */
export function rowState(
  member: StaffMember,
  options: { canWrite: boolean; isSelf: boolean },
): RowState {
  const isClerkAdmin = member.orgRole === "org:admin"
  const hasRow = member.role !== null
  const managed = options.canWrite && !isClerkAdmin && !options.isSelf
  return {
    editable: managed,
    canWithdraw: managed && hasRow && member.active,
    canRestore: managed && hasRow && !member.active,
    showInactive: !isClerkAdmin && hasRow && !member.active,
  }
}

/* ── The audit panel (#114) ───────────────────────────────────────────────── */

/**
 * A Clerk user id, as a name — when the roster still has one.
 *
 * Falls back to the id itself rather than to "someone". A record that cannot name
 * its actor is still a record, and the id is the one thing that can be looked up
 * in Clerk later; "someone" cannot be looked up at all. The fallback is reachable
 * in normal use: a person who left the organization is dropped from the roster,
 * and their past changes remain.
 */
export function personName(userId: string, roster: ReadonlyArray<StaffMember>): string {
  return roster.find((member) => member.userId === userId)?.name ?? userId
}

/**
 * One recorded change, as a sentence.
 *
 * The three shapes it can take, and why they are not one template:
 *
 *   · **A first assignment** has no previous level, so "No level → Service Rep"
 *     would be a transition that never happened — nothing was changed *from*.
 *     `Set to Service Rep` is what an operator did.
 *   · **A role change** is a transition, and the arrow is the shortest way to
 *     show both ends.
 *   · **An access change** is not a level at all. `Service Rep → Service Rep`
 *     would be a line that appears to do nothing; `Access withdrawn` is the fact,
 *     and it is the one an incident asks about.
 *
 * When both change, both are said — that is the case where a summary loses
 * information, and the one this function exists for.
 *
 * ⚠️ `fromActive` is `null` on a first assignment, not `false`. Reading it as
 * falsy would make a brand-new row look like a restored leaver.
 */
export function changeText(entry: StaffAuditEntry): string {
  const to = LEVEL_LABEL[entry.toRole]
  const firstAssignment = entry.fromRole === null
  const roleChanged = !firstAssignment && entry.fromRole !== entry.toRole
  const wasActive = entry.fromActive === true
  const accessChanged = !firstAssignment && wasActive !== entry.toActive

  const parts: string[] = []
  if (firstAssignment) parts.push(`Set to ${to}`)
  else if (roleChanged) parts.push(`${LEVEL_LABEL[entry.fromRole!]} → ${to}`)

  if (accessChanged) parts.push(entry.toActive ? "Access restored" : "Access withdrawn")
  // A first assignment made with `active: false` — a level nobody can use yet.
  // Rare, legal, and otherwise invisible: the row would read "Set to Service Rep"
  // while the person still could not sign in.
  else if (firstAssignment && !entry.toActive) parts.push("no access")

  // Unreachable through the writer, which only records a change. If it ever
  // happens, saying so is better than rendering an empty cell.
  return parts.length > 0 ? parts.join(" · ") : "No change recorded"
}
