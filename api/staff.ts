/**
 * `/api/staff` — the roster, and the level each person holds.
 *
 *   GET  /api/staff                 settings:read
 *   PUT  /api/staff  { userId, … }  settings:write
 *
 * Until this existed the only way to give someone a level was a psql session
 * against production, and the only way to see who held which level was the same.
 * That is fine for two operators who are both Clerk admins and it is not a
 * permanent answer, which is what issue #102 is about.
 *
 * ── Why GET returns a joined roster ─────────────────────────────────────────
 *
 * The screen has to answer "who works here, and at what level", and `staff` alone
 * can only answer the second half: a member with **no row** is the state that
 * most needs showing, and they are absent from the table by definition. So `GET`
 * reads Clerk's organization memberships and merges the levels onto them, in
 * `buildRoster()`.
 *
 * Issue #102 planned to do this join in the browser on the grounds that "the
 * client already has the members from `useUser()`". It does not: `useUser()`
 * carries the signed-in user's *own* memberships — one entry per organization —
 * so the client would have needed `useOrganization()` plus its own pagination to
 * obtain the same list. Joining here is one call instead of two and puts the
 * "not a member" rule next to the "set a level" rule.
 *
 * ── Why the roster is readable by a manager ─────────────────────────────────
 *
 * `GET` needs `settings:read`, not `settings:write`. Who works here is not a
 * secret from the person who runs the desk, and the read is what makes the screen
 * honest for them: it shows the levels they cannot change rather than hiding the
 * page and leaving them to guess. The write is admin-only because it hands out
 * access to a customer's phone number.
 *
 * ⚠️ **The authorization check runs before the body is read.** A caller about to
 * be refused should cause no work and learn nothing — and a status code alone
 * cannot show the ordering, which is why `tests/backend.mjs` asserts it by
 * position in this file.
 *
 * ── Two questions the write has to ask Clerk ────────────────────────────────
 *
 * 1. *Is the target a member of Indigo Services?* A row for a non-member is
 *    inert: `api/_lib/auth.ts` refuses them before the `staff` lookup, so the
 *    row would never be read. Accepting one would let an admin set a level and
 *    watch nothing happen, so it is refused with `not_a_member` — the message
 *    that turns a silent no-op into a fixable problem.
 * 2. *Does the answer name that user?* See `membershipIncludes()`: the request is
 *    filtered by user id, and the response is checked to honour the filter.
 *
 * A Clerk failure is `503 auth_unavailable`, not `422`: "I could not ask" is not
 * "the answer was no", and collapsing them would tell an admin their colleague is
 * not a member during a vendor outage.
 */
import { createClerkClient } from "@clerk/backend"
import { body, methodNotAllowed, type ApiRequest, type ApiResponse } from "./_lib/http.js"
import { ORGANIZATION_ID, denialBody, requireCapability } from "./_lib/auth.js"
import {
  buildRoster,
  listStaff,
  membershipIncludes,
  staffRefusal,
  upsertStaffLevel,
  validateStaffUpdate,
} from "./_lib/staff.js"

const ALLOWED = "GET, PUT"

/** Clerk's page size. Its maximum, so the loop below usually runs once. */
const PAGE = 100

/**
 * Every membership of Indigo Services, following the pagination.
 *
 * A single `limit: 100` call would be a silent cap: the roster would look complete
 * and one person would be missing from it, which on this screen reads as "they
 * have no access" rather than "the page ended". Two members today; the loop costs
 * one extra call in the year it stops being two.
 */
async function allMemberships(clerk: ReturnType<typeof createClerkClient>) {
  const members = []
  for (let offset = 0; ; offset += PAGE) {
    const page = await clerk.organizations.getOrganizationMembershipList({
      organizationId: ORGANIZATION_ID,
      limit: PAGE,
      offset,
    })
    members.push(...page.data)
    if (page.data.length === 0 || members.length >= page.totalCount) break
  }
  return members
}

export default async function handler(req: ApiRequest, res: ApiResponse): Promise<void> {
  const method = req.method ?? "GET"
  if (method !== "GET" && method !== "PUT") {
    methodNotAllowed(res, ALLOWED)
    return
  }

  // Reading the roster is `settings:read`; handing out a level is
  // `settings:write`. Named before anything else is touched.
  const auth = await requireCapability(req, method === "GET" ? "settings:read" : "settings:write")
  if (!auth.ok) {
    res.status(auth.status).json(denialBody(auth))
    return
  }

  // `requireCapability` has already refused a request without a key, so this is a
  // belt-and-braces branch rather than a reachable state.
  const secretKey = process.env.CLERK_SECRET_KEY
  if (!secretKey) {
    res.status(500).json({ error: "not_configured" })
    return
  }
  const clerk = createClerkClient({ secretKey })

  try {
    if (method === "GET") {
      const members = await allMemberships(clerk)
      res.status(200).json({ staff: buildRoster(members, await listStaff()) })
      return
    }

    const valid = validateStaffUpdate(body<unknown>(req))
    if (!valid.ok) {
      res.status(422).json({ error: "validation_failed", fields: valid.fields })
      return
    }

    const refusal = staffRefusal(auth.userId, valid.value)
    if (refusal) {
      res.status(422).json({ error: refusal })
      return
    }

    let isMember: boolean
    try {
      const memberships = await clerk.organizations.getOrganizationMembershipList({
        organizationId: ORGANIZATION_ID,
        userId: [valid.value.userId],
      })
      isMember = membershipIncludes(memberships.data, valid.value.userId)
    } catch (err) {
      console.error("staff: membership lookup failed", err)
      res.status(503).json({ error: "auth_unavailable" })
      return
    }

    if (!isMember) {
      res.status(422).json({ error: "not_a_member" })
      return
    }

    res.status(200).json({ staff: await upsertStaffLevel(valid.value) })
  } catch (err) {
    console.error("staff: request failed", err)
    res.status(503).json({ error: "unavailable" })
  }
}
