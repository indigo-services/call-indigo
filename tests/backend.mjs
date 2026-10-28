/**
 * backend — the first server this project has had (#68).
 *
 * Everything here runs **offline**. That is a constraint, not a shortcut: CI has no
 * `DATABASE_URL` and no `RESEND_API_KEY`, so a check that reached for either would
 * be green on one machine and red on the gate that matters. What is left is the
 * part that can be wrong in a way a screenshot cannot show — the validation rules,
 * the authorization rule, and the one rewrite that decides whether `/api` is
 * reachable at all.
 *
 * ⚠️ **Every module and every handler call is awaited BEFORE `check()`.** `check()`
 * is synchronous, and a Promise returned from its callback used to print ✓ while
 * asserting nothing; `tests/harness.mjs` now fails that case by name.
 *
 * The live proof is deliberately not a check: `.preview/drive-inquiry.mjs` drove
 * the real handler against the real Neon database and the real Resend account on
 * 2026-10-22 — 201, `notified: true`, one row, deleted after. CI cannot do that,
 * and pretending it can would be the defect this suite exists to catch.
 */
import { readFileSync, readdirSync } from "node:fs"
import path from "node:path"
import { ROOT, check, load, suite } from "./harness.mjs"

const ORG = "org_3KmfJ9xVJNIs6N6uNmJSsD5SqHb"

/** Repo-relative path with forward slashes, for messages that can be grepped. */
const rel = (abs) => path.relative(ROOT, abs).split(path.sep).join("/")

const valid = {
  name: "Dana Reyes",
  email: "dana@example.com",
  phone: "+1 512 555 0134",
  propertyType: "residential",
  service: "Plumbing",
  urgency: "soon",
  message: "Water is pooling under the kitchen sink.",
  member: "no",
  /**
   * The form's own opening time (#92). A minute old, so the time-to-submit floor is
   * satisfied by construction and every other check here is testing the thing it
   * names rather than accidentally testing the clock.
   */
  openedAt: Date.now() - 60_000,
}

/** Call a Vercel-style handler and capture what it answered. */
function callHandler(handler, method, { token, body } = {}) {
  return new Promise((resolve) => {
    const res = {
      status(code) {
        this._code = code
        return res
      },
      json(payload) {
        resolve({ status: this._code ?? 0, payload })
      },
      setHeader() {},
      end() {
        resolve({ status: this._code ?? 0, payload: null })
      },
    }
    const headers = token ? { authorization: `Bearer ${token}` } : {}
    handler({ method, headers, body }, res).catch((err) => resolve({ status: -1, payload: { thrown: String(err) } }))
  })
}

export async function run() {
  suite("Backend (#68)", "api/ · vercel.json")

  const validate = await load("api/_lib/validate.ts", "server-validate")
  const auth = await load("api/_lib/auth.ts", "server-auth")
  const roles = await load("api/_lib/roles.ts", "server-roles")
  const notify = await load("api/_lib/notifications.ts", "server-notify")
  const settings = await load("api/notification-settings.ts", "api-settings")
  const inquiry = await load("api/inquiry.ts", "api-inquiry")
  const me = await load("api/me.ts", "api-me")
  const staffApi = await load("api/staff.ts", "api-staff")
  const staff = await load("api/_lib/staff.ts", "server-staff")
  const throttle = await load("api/_lib/throttle.ts", "server-throttle")

  // The async work, done once and asserted synchronously below.
  const anonPut = await callHandler(settings.default, "PUT", { body: { to: "attacker@example.com" } })
  const anonInquiryGet = await callHandler(inquiry.default, "GET")
  const anonMe = await callHandler(me.default, "GET")
  const anonMePost = await callHandler(me.default, "POST")
  const anonStaffGet = await callHandler(staffApi.default, "GET")
  const anonStaffPut = await callHandler(staffApi.default, "PUT", {
    body: { userId: "user_2abcdef", role: "service_rep" },
  })
  const anonStaffPost = await callHandler(staffApi.default, "POST")
  const honeypotPost = await callHandler(inquiry.default, "POST", { body: { ...valid, company: "Acme" } })
  const invalidPost = await callHandler(inquiry.default, "POST", { body: { ...valid, email: "nope" } })

  /* ── The rate limit, driven through an injected counter (#94) ──────────────
   *
   * The real counter is a Postgres upsert, and CI has no database. Injecting the
   * `record` function is what makes the REFUSAL branch testable at all — without it
   * every check here would observe the fail-open path and prove nothing about the
   * limit, which is the "green that means nothing" this suite exists to prevent.
   */
  const savedSalt = process.env.THROTTLE_SALT
  const throttleReq = { headers: { "x-forwarded-for": "203.0.113.7, 10.0.0.1" } }
  const keysSeen = []
  const countingRecorder = async (key) => {
    keysSeen.push(key)
    return { hits: keysSeen.length, retryAfter: 42 }
  }

  process.env.THROTTLE_SALT = "test-salt"
  const withinLimit = []
  for (let i = 0; i < throttle.THROTTLE.limit; i++) {
    withinLimit.push(await throttle.enforce(throttleReq, countingRecorder))
  }
  const overLimit = await throttle.enforce(throttleReq, countingRecorder)
  const keyForAddress = throttle.throttleKey("203.0.113.7", "test-salt")
  const keyWithoutSalt = throttle.throttleKey("203.0.113.7", "")
  const ipFromList = throttle.clientIp(throttleReq)
  const ipFromRealIp = throttle.clientIp({ headers: { "x-real-ip": "198.51.100.9" } })
  const ipFromNothing = throttle.clientIp({ headers: {} })

  // No salt: the key cannot be built, so the limit must decline to enforce AND say so.
  process.env.THROTTLE_SALT = ""
  const noSalt = await throttle.enforce(throttleReq, countingRecorder)
  // Store unavailable: the catch branch, exercised without touching a real database.
  process.env.THROTTLE_SALT = "test-salt"
  const storeDown = await throttle.enforce(throttleReq, async () => {
    throw new Error("no connection string")
  })
  // A request with no address at all.
  const noAddress = await throttle.enforce({ headers: {} }, countingRecorder)
  if (savedSalt === undefined) delete process.env.THROTTLE_SALT
  else process.env.THROTTLE_SALT = savedSalt

  check("a submission the form would accept is accepted, and stored normalised", () => {
    const out = []
    const r = validate.validateInquiry({ ...valid, name: "  Dana Reyes  ", email: "Dana@Example.COM" })
    if (!r.ok) return [`a valid submission was refused: ${JSON.stringify(r.errors ?? r)}`]
    if (r.value.name !== "Dana Reyes") out.push(`name not trimmed: "${r.value.name}"`)
    if (r.value.email !== "dana@example.com") out.push(`email not lowercased: "${r.value.email}"`)
    if (r.value.source !== "contact") out.push(`default source is "${r.value.source}", expected "contact"`)
    return out
  })

  check("every field the form marks required is required on the server too", () => {
    // Named per field rather than "some error came back": a rule that stopped
    // applying would still leave the error object non-empty.
    const out = []
    for (const field of ["name", "email", "phone", "propertyType", "service", "urgency", "message", "member"]) {
      const r = validate.validateInquiry({ ...valid, [field]: "" })
      if (r.ok) out.push(`${field} was accepted empty`)
      else if (!(field in r.errors)) out.push(`${field} empty did not report itself: [${Object.keys(r.errors)}]`)
    }
    // Positive control: the loop above passes on a validator that refuses everything.
    if (!validate.validateInquiry(valid).ok) out.push("the control (valid body) was refused — this check proves nothing")
    return out
  })

  check("the server's copy of the service list equals the one the form renders", () => {
    const out = []
    // Read from the constant the form renders, so this cannot pass while the form
    // offers a service the server rejects.
    const types = readFileSync(path.join(ROOT, "src", "lib", "data", "types.ts"), "utf8")
    const block = /export const SERVICES = \[([\s\S]*?)\] as const/.exec(types)
    if (!block) return ["SERVICES is no longer an array literal — update this check"]
    const client = [...block[1].matchAll(/"([^"]+)"/g)].map((m) => m[1])
    if (client.length === 0) return ["no services parsed — this check would pass vacuously"]

    // The server keeps its own copy because a runtime import of a .ts file outside
    // `api/` fails to load in the deployed function (measured 2026-10-23: every
    // endpoint sharing it answered FUNCTION_INVOCATION_FAILED). A copy is only safe
    // if it is compared, which is what this is.
    const server = [...validate.SERVICES]
    if (server.join(" | ") !== client.join(" | ")) {
      out.push(`server list [${server.join(", ")}] does not equal the form's [${client.join(", ")}]`)
    }

    for (const service of client) {
      if (!validate.validateInquiry({ ...valid, service }).ok) {
        out.push(`the form offers "${service}" but the server refuses it`)
      }
    }
    const bad = validate.validateInquiry({ ...valid, service: "Wizardry" })
    if (bad.ok || !bad.errors.service) out.push("a service the site does not offer was accepted")
    return out
  })

  check("a filled honeypot is answered like a success, and creates nothing", () => {
    const out = []
    const r = validate.validateInquiry({ ...valid, company: "Acme Inc" })
    if (r.ok) out.push("a filled honeypot was treated as a real submission")
    else if (!("honeypot" in r)) out.push(`a filled honeypot reported field errors: ${JSON.stringify(r.errors)}`)
    // 200 with no id: a bot that gets a 4xx learns which field to leave empty.
    if (honeypotPost.status !== 200) out.push(`the endpoint answered ${honeypotPost.status}, expected 200`)
    if (honeypotPost.payload?.id) out.push("the honeypot response carries an id — something was stored")
    return out
  })

  check("an invalid submission is refused with the fields named, and stores nothing", () => {
    const out = []
    if (invalidPost.status !== 422) out.push(`answered ${invalidPost.status}, expected 422`)
    if (!invalidPost.payload?.fields?.email) out.push(`no field error for email: ${JSON.stringify(invalidPost.payload)}`)
    if (invalidPost.payload?.id) out.push("a refused submission returned an id")
    return out
  })

  check("the rate limit accepts the limit and refuses the next one, with a retry time", () => {
    // #94 acceptance 1. Both halves matter: a limit that refuses everything passes
    // the "refused" half, and one that refuses nothing passes the other.
    const out = []
    const refusedInside = withinLimit.filter((v) => !v.allowed)
    if (refusedInside.length > 0) {
      out.push(`${refusedInside.length} of the first ${throttle.THROTTLE.limit} submissions were refused`)
    }
    if (overLimit.allowed) {
      out.push(`submission ${throttle.THROTTLE.limit + 1} was accepted — the limit does nothing`)
    }
    if (overLimit.retryAfter !== 42) {
      out.push(`retryAfter is ${overLimit.retryAfter}, expected the counter's 42 — Retry-After would lie`)
    }
    if (overLimit.unenforced) out.push(`the refusal was actually a fail-open (${overLimit.unenforced})`)
    // One key for the whole run: a key that varied per request would never limit anyone.
    if (new Set(keysSeen).size !== 1) out.push(`${new Set(keysSeen).size} distinct keys over one address`)
    return out
  })

  check("the counter is keyed on a salted hash, never on the address itself", () => {
    // The privacy decision #94 asked for. An unsalted hash of an IPv4 address is an
    // encoding, not anonymisation — so "it is hashed" is not the property worth
    // asserting; "it is hashed AND a salt is required" is.
    const out = []
    if (typeof keyForAddress !== "string" || !/^[0-9a-f]{64}$/.test(keyForAddress)) {
      out.push(`the key is not a sha256 hex digest: ${keyForAddress}`)
    }
    if (keyForAddress && keyForAddress.includes("203.0.113.7")) {
      out.push("the key contains the address — it is not a hash")
    }
    if (keyWithoutSalt !== null) {
      out.push("a key was produced with an empty salt — the hash would be reversible by brute force")
    }
    // Two addresses must not collide, and one address must be stable.
    if (throttle.throttleKey("203.0.113.7", "test-salt") !== keyForAddress) {
      out.push("the same address and salt produced a different key")
    }
    if (throttle.throttleKey("203.0.113.8", "test-salt") === keyForAddress) {
      out.push("two different addresses produced the same key")
    }
    return out
  })

  check("the client address is the first entry of x-forwarded-for", () => {
    // Taking the last entry, or the whole list, buckets every visitor behind one
    // proxy into a single counter — the limit would then refuse real people.
    const out = []
    if (ipFromList !== "203.0.113.7") out.push(`x-forwarded-for parsed as "${ipFromList}"`)
    if (ipFromRealIp !== "198.51.100.9") out.push(`x-real-ip fallback parsed as "${ipFromRealIp}"`)
    if (ipFromNothing !== "") out.push(`a request with no address headers parsed as "${ipFromNothing}"`)
    return out
  })

  check("an unenforceable limit fails open, and says which reason", () => {
    // #94's design note. A missing salt or a missing table must not refuse a lead —
    // but a fail-open that is silent is indistinguishable from a limit that works,
    // so the reason is part of the contract rather than only a log line.
    const out = []
    if (!noSalt.allowed) out.push("a missing THROTTLE_SALT refused a submission instead of failing open")
    if (noSalt.unenforced !== "no-salt") out.push(`missing salt reported "${noSalt.unenforced}"`)
    if (!storeDown.allowed) out.push("an unreachable counter refused a submission instead of failing open")
    if (storeDown.unenforced !== "store-unavailable") {
      out.push(`an unreachable counter reported "${storeDown.unenforced}"`)
    }
    if (!noAddress.allowed) out.push("a request with no address refused a submission instead of failing open")
    if (noAddress.unenforced !== "no-ip") out.push(`no address reported "${noAddress.unenforced}"`)
    return out
  })

  check("the limit is enforced after the honeypot and before anything is stored", () => {
    // #94 acceptance 2, and the ordering is the point: a limit checked BEFORE the
    // honeypot tells a bot exactly where the ceiling is, and one checked AFTER the
    // insert has already written the row and sent the email it was meant to prevent.
    // Only the source can show order — the status code cannot.
    const src = readFileSync(path.join(ROOT, "api", "inquiry.ts"), "utf8")
    const code = src.replace(/^\s*\/\/.*$/gm, "").replace(/\/\*[\s\S]*?\*\//g, "")
    const honeypotAt = code.indexOf('"honeypot" in parsed')
    const enforceAt = code.indexOf("await enforce(")
    const insertAt = code.indexOf("await insertInquiry(")
    const out = []
    if (honeypotAt < 0) out.push("api/inquiry.ts no longer checks the honeypot — this check would pass vacuously")
    if (enforceAt < 0) out.push("api/inquiry.ts does not call enforce() — the limit is not wired in")
    if (insertAt < 0) out.push("api/inquiry.ts does not call insertInquiry() — this check would pass vacuously")
    if (honeypotAt >= 0 && enforceAt >= 0 && enforceAt < honeypotAt) {
      out.push("the rate limit runs BEFORE the honeypot — a bot can discover the ceiling")
    }
    if (enforceAt >= 0 && insertAt >= 0 && enforceAt > insertAt) {
      out.push("the rate limit runs AFTER the insert — a refused request would already be stored")
    }
    if (!/Retry-After/.test(src)) out.push("a 429 is returned without a Retry-After header")
    return out
  })

  check("a submission faster than the floor is refused, and a missing timestamp is refused", () => {
    // #92. The floor is what replaces a third-party captcha, and the case it exists
    // for is the body with NO timestamp at all — that is a bot which never executed
    // the page's JavaScript, and it is the majority of form spam.
    const out = []
    const now = 1_800_000_000_000
    const instant = validate.validateInquiry({ ...valid, openedAt: now - 500 }, now)
    const patient = validate.validateInquiry({ ...valid, openedAt: now - 10_000 }, now)
    const absent = validate.validateInquiry({ ...valid, openedAt: undefined }, now)
    const nulled = validate.validateInquiry({ ...valid, openedAt: null }, now)
    const ahead = validate.validateInquiry({ ...valid, openedAt: now + 120_000 }, now)

    if (instant.ok) out.push("a submission 0.5s after the form opened was accepted")
    else if (!instant.errors.openedAt) out.push(`a too-fast submission did not name openedAt: ${JSON.stringify(instant.errors)}`)
    if (!patient.ok) out.push(`a submission 10s after the form opened was refused: ${JSON.stringify(patient.errors ?? {})}`)
    if (absent.ok) out.push("a submission with NO timestamp was accepted — a bot that runs no JS gets through")
    else if (absent.errors.openedAt !== "missing") out.push(`a missing timestamp reported "${absent.errors.openedAt}"`)
    if (nulled.ok) out.push("a null timestamp was accepted")
    // A client clock ahead of ours must not lock a real person out forever.
    if (!ahead.ok) out.push("a future timestamp was refused — a fast client clock would lose the lead")
    return out
  })

  check("the capability matrix is exactly the table in the docblock", () => {
    // The matrix is the artifact a reviewer reads, so the check restates it
    // independently rather than importing the expectation from the same file.
    const expected = {
      admin: ["inbox:read", "inbox:write", "inbox:delete", "settings:read", "settings:write", "reference:read", "accounts:read"],
      service_manager: ["inbox:read", "inbox:write", "inbox:delete", "settings:read", "reference:read"],
      service_rep: ["inbox:read", "inbox:write"],
      member: ["inbox:read"],
    }
    const out = []
    for (const [role, caps] of Object.entries(expected)) {
      const got = [...roles.capabilitiesFor(role)].sort().join(",")
      const want = [...caps].sort().join(",")
      if (got !== want) out.push(`${role}: ${got || "(nothing)"} — expected ${want}`)
    }
    // A role this build has never heard of gets NOTHING. A default of "everything"
    // is how a typo in a staff row becomes an admin.
    if (roles.capabilitiesFor("org:owner").length !== 0) out.push("an unknown role was granted capabilities")
    if (roles.capabilitiesFor(null).length !== 0) out.push("a null role was granted capabilities")

    // The one asymmetry worth stating: deleting a lead is the only irreversible
    // action in the dashboard, and it is the whole difference between a manager and
    // a rep. If these two ever agree, the third role exists for nothing.
    if (roles.hasCapability("service_rep", "inbox:delete")) out.push("a service rep can delete a lead")
    if (!roles.hasCapability("service_manager", "inbox:delete")) out.push("a service manager cannot delete a lead")
    if (roles.hasCapability("member", "inbox:write")) out.push("a member with no staff row can change a lead")

    // #104. `accounts:read` guards no endpoint, so nothing on the server fails
    // when it is mis-granted — the only symptom is a sidebar link to a vendor
    // dashboard the holder cannot open. Asserted per role rather than left to
    // the exact-set comparison above, because that comparison says "these seven"
    // and this one says "not this one, and here is why it matters".
    if (!roles.hasCapability("admin", "accounts:read")) out.push("an admin cannot see the vendor dashboards")
    if (roles.hasCapability("service_manager", "accounts:read")) {
      out.push("a service manager can see the vendor dashboards — they are org-level accounts, not desk tools")
    }
    if (roles.hasCapability("service_rep", "accounts:read")) out.push("a service rep can see the vendor dashboards")
    return out
  })

  check("a Clerk admin outranks the staff table, and a row can never widen a member", () => {
    const out = []
    const r = roles.roleFromOrgRole
    if (r("org:admin", null) !== "admin") out.push("a Clerk admin with no staff row was not admin")
    // Load-bearing: the table starts empty and both operators are Clerk admins. If
    // a row could demote them, the first bad INSERT locks everyone out of the page
    // that would fix it.
    if (r("org:admin", "service_rep") !== "admin") out.push("a staff row demoted a Clerk admin")
    if (r("org:member", null) !== "member") out.push("a member with no row was not the member floor")
    if (r("org:member", "service_manager") !== "service_manager") out.push("a staff row did not raise a member")
    if (r("org:member", "admin") !== "admin") out.push("a staff row could not grant admin")
    // A role this code has never seen must land on the floor, not fall through a gap.
    if (r("org:auditor", null) !== "member") out.push("an unknown Clerk role did not degrade to the floor")
    return out
  })

  check("the organization is pinned by id, in the token and in the membership list", () => {
    const out = []
    const cases = [
      [{ orgId: ORG, orgRole: "org:admin" }, "org:admin", "admin of Indigo Services"],
      [{ orgId: "org_someone_else", orgRole: "org:admin" }, null, "admin of a DIFFERENT organization"],
      [{ orgId: ORG, orgRole: "org:member" }, "org:member", "member of Indigo Services"],
      [{ orgId: ORG }, null, "the pinned organization with no role claim"],
      [{ orgId: undefined, orgRole: undefined }, null, "a token with no organization claim"],
    ]
    for (const [claims, expected, label] of cases) {
      const got = auth.orgRoleFromClaims(claims)
      if (got !== expected) out.push(`${label}: ${JSON.stringify(got)}, expected ${JSON.stringify(expected)}`)
    }
    const m = (id, role) => [{ organization: { id }, role }]
    if (auth.orgRoleFromMemberships(m(ORG, "org:admin")) !== "org:admin") {
      out.push("an admin membership of Indigo Services was not read")
    }
    if (auth.orgRoleFromMemberships(m("org_other", "org:admin")) !== null) {
      out.push("a membership of a DIFFERENT organization was read")
    }
    if (auth.orgRoleFromMemberships([]) !== null) out.push("an empty membership list returned a role")
    return out
  })

  check("a Clerk admin is resolved without reading the staff table", () => {
    // The property that keeps the two existing operators working on the day this
    // ships, and the one that makes a broken table harmless. A status code cannot
    // show it, so it is asserted by position in the source.
    const src = readFileSync(path.join(ROOT, "api", "_lib", "auth.ts"), "utf8")
    const code = src.replace(/^\s*\/\/.*$/gm, "").replace(/\/\*[\s\S]*?\*\//g, "")
    const out = []
    const guardAt = code.indexOf("if (orgRole !== CLERK_ADMIN_ROLE)")
    const lookupAt = code.indexOf("await staffRoleFor(")
    if (guardAt === -1) out.push("the admin short-circuit is gone — an empty staff table would lock every operator out")
    if (lookupAt === -1) out.push("auth.ts no longer reads the staff table at all")
    if (guardAt !== -1 && lookupAt !== -1 && lookupAt < guardAt) {
      out.push("the staff lookup runs BEFORE the admin short-circuit")
    }
    return out
  })

  check("the settings endpoint refuses an unauthenticated write, and checks auth before writing", () => {
    const out = []
    if (anonPut.status !== 401) out.push(`an unauthenticated PUT answered ${anonPut.status}, expected 401`)
    // ⚠️ The status alone cannot prove the ORDER: a handler that wrote first and
    // then returned 401 would pass the line above while having written.
    const src = readFileSync(path.join(ROOT, "api", "notification-settings.ts"), "utf8")
    const authAt = src.indexOf("await requireCapability(")
    const writeAt = src.indexOf("writeNotificationSettings(parsed.value)")
    if (authAt < 0) out.push("the handler no longer calls requireCapability")
    if (writeAt < 0) out.push("the handler no longer writes")
    if (authAt >= 0 && writeAt >= 0 && authAt > writeAt) out.push("requireCapability is called AFTER the write")
    return out
  })

  check("the inquiry endpoint answers a non-POST with 405 and an Allow header", () => {
    const out = []
    if (anonInquiryGet.status !== 405) out.push(`GET answered ${anonInquiryGet.status}, expected 405`)
    if (anonInquiryGet.payload?.allowed !== "POST") out.push(`Allow was "${anonInquiryGet.payload?.allowed}"`)
    return out
  })

  check("the subject template substitutes known tokens and leaves an unknown one visible", () => {
    const out = []
    const rendered = notify.renderSubject("New {{service}} lead — {{name}} ({{nope}})", valid)
    if (!rendered.includes("Plumbing")) out.push(`{{service}} not substituted: "${rendered}"`)
    if (!rendered.includes("Dana Reyes")) out.push(`{{name}} not substituted: "${rendered}"`)
    // Visible, not blanked: a typo in the template should look like a typo.
    if (!rendered.includes("{{nope}}")) out.push(`an unknown token was swallowed: "${rendered}"`)
    if (notify.addresses("a@b.co, c@d.co; e@f.co").length !== 3) out.push("address list did not split on , and ;")
    if (notify.addresses("  ").length !== 0) out.push("a blank address list produced entries")
    return out
  })

  check("vercel.json sends /api to the function instead of rewriting it to the SPA", () => {
    const out = []
    const { rewrites = [] } = JSON.parse(readFileSync(path.join(ROOT, "vercel.json"), "utf8"))
    if (rewrites.length === 0) return ["vercel.json has no rewrites — deep links would 404"]
    for (const rule of rewrites) {
      const source = rule.source ?? ""
      if (!source.startsWith("/(") || !source.endsWith(")")) {
        // A path-to-regexp source cannot be tested here without reimplementing it,
        // and a check that cannot see the thing passes forever.
        out.push(`rewrite "${source}" is not a plain regex — this check cannot verify it`)
        continue
      }
      const re = new RegExp(`^${source}$`)
      for (const probe of ["/api/inquiry", "/api/notification-settings"]) {
        if (re.test(probe)) out.push(`"${source}" rewrites ${probe} to ${rule.destination} — the function is unreachable`)
      }
      // Positive control: the rewrite must still catch a real deep link, or the
      // exclusion has simply broken the SPA.
      if (!re.test("/residential")) out.push(`"${source}" no longer rewrites a deep link like /residential`)
    }
    return out
  })

  check("the health endpoint shares nothing, and reports presence rather than values", () => {
    const out = []
    const src = readFileSync(path.join(ROOT, "api", "health.ts"), "utf8")
    // Its whole value is that it can load when the shared graph cannot — that is how
    // the production 500 was localised on 2026-10-23. An import from server/ or src/
    // would make it fail with everything else and answer nothing.
    const imports = [...src.matchAll(/^import\s[^\n]*from\s+"([^"]+)"/gm)].map((m) => m[1])
    for (const spec of imports) {
      if (!spec.startsWith("node:")) out.push(`health.ts imports "${spec}" — it must share nothing`)
    }
    // A health check that printed a connection string would be a disclosure.
    // What leaves the process is presence, never a value: each variable is reported
    // through Boolean(...), and nothing serialises the environment wholesale.
    for (const name of ["RESEND_API_KEY", "CLERK_SECRET_KEY"]) {
      if (!src.includes(`Boolean(process.env.${name}`)) {
        out.push(`health.ts no longer reports ${name} as a boolean`)
      }
    }
    // The connection string is reported by NAME rather than by boolean: which
    // variable resolved is the operational answer, and it is still not a value.
    if (!/dbSource:/.test(src)) {
      out.push("health.ts no longer reports which variable supplied the connection string")
    }
    if (/dbSource:\s*source\?*\.url/.test(src)) out.push("health.ts reports the connection string itself")
    if (/JSON\.stringify\(\s*process\.env/.test(src)) out.push("health.ts serialises the whole environment")
    if (/res\.json\(\s*process\.env/.test(src)) out.push("health.ts sends process.env directly")
    return out
  })

  check("the health endpoint and the server read the same connection variables", () => {
    // health.ts cannot import api/_lib/db.ts — being import-free is what makes it a
    // diagnostic — so the list exists twice and this keeps the copies honest.
    //
    // The defect this prevents, measured in Production 2026-10-23: the Neon Vercel
    // integration injects NEON_DATABASE_URL and friends, not DATABASE_URL. Code that
    // read only DATABASE_URL loaded correctly and could not reach the database, and
    // health reported the same wrong absence because it had the same wrong list.
    const list = (file, pattern) => {
      const src = readFileSync(path.join(ROOT, file), "utf8")
      const m = src.match(pattern)
      if (!m) return null
      return [...m[1].matchAll(/"([^"]+)"/g)].map((x) => x[1])
    }
    const server = list("api/_lib/db.ts", /CONNECTION_VARS\s*=\s*\[([\s\S]*?)\]/)
    const health = list("api/health.ts", /CANDIDATES\s*=\s*\[([\s\S]*?)\]/)
    if (!server) return ["api/_lib/db.ts has no CONNECTION_VARS list — this check would pass vacuously"]
    if (!health) return ["api/health.ts has no CANDIDATES list — this check would pass vacuously"]
    if (server.length === 0 || health.length === 0) return ["a connection-variable list is empty"]

    const out = []
    if (server.join(",") !== health.join(",")) {
      out.push(`the lists disagree — db.ts: [${server.join(", ")}]; health.ts: [${health.join(", ")}]`)
    }
    // The Neon names are the ones Production actually has, so losing them is the
    // regression that matters most.
    for (const name of ["NEON_DATABASE_URL", "NEON_POSTGRES_URL"]) {
      if (!server.includes(name)) out.push(`db.ts no longer falls back to ${name}`)
    }
    if (server[0] !== "DATABASE_URL") out.push("DATABASE_URL is no longer first — an explicit override must win")
    return out
  })

  check("the public form posts to the server, and a failed send is visible", () => {
    // Measured 2026-10-23: the endpoint worked and the form still wrote the visitor's
    // own `localStorage`, so a real lead went nowhere and the site said "sent".
    const apiSrc = readFileSync(path.join(ROOT, "src", "lib", "data", "api.ts"), "utf8")
    const method = apiSrc.match(/async createInquiry\([\s\S]*?\n  \},/)
    if (!method) return ["api.ts has no createInquiry method — this check would pass vacuously"]
    const body = method[0]
    // Comments in this method explain why the browser is no longer written, so they
    // contain the word. Only code counts — a grep cannot tell the two apart.
    const code = body.replace(/^\s*\/\/.*$/gm, "")

    const out = []
    if (!/fetch\(\s*"\/api\/inquiry"/.test(code)) {
      out.push("createInquiry no longer POSTs to /api/inquiry")
    }
    if (/writeInquiries|localStorage/.test(code)) {
      out.push("createInquiry still writes the browser — the inbox and the dashboard would disagree")
    }

    // The other half: a lead must never be told it was sent when it was not.
    const page = readFileSync(path.join(ROOT, "src", "marketing", "pages", "ContactPage.tsx"), "utf8")
    if (!/setFailure\(/.test(page)) out.push("ContactPage no longer has a failure state")
    if (!/role="alert"/.test(page)) out.push("the failure is no longer announced to a screen reader")

    // The messages moved into `describeFailure()` when #92 and #94 gave a refusal more
    // than one cause to report. Checked there rather than at `setFailure(`, and still
    // required to keep the phone number: it is the channel that works when the site
    // does not. A check that looked only for a literal at the call site would now pass
    // vacuously, which is the failure mode this suite exists to catch.
    const describe = page.match(/function describeFailure\([\s\S]*?\n\}/)
    if (!describe) {
      out.push("ContactPage has no describeFailure() — cannot check that a refusal is actionable")
    } else {
      if (!/\(\d{3}\)\s*\d{3}-\d{4}/.test(describe[0])) {
        out.push("no refusal message offers a phone number")
      }
      if (!/429/.test(describe[0])) {
        out.push("describeFailure has no 429 branch — a rate-limited visitor gets the generic message")
      }
      if (!/fields\.openedAt/.test(describe[0])) {
        out.push("describeFailure does not explain a too-fast submission (#92)")
      }
    }
    return out
  })

  check("the inquiries endpoint authorises before it touches the database", () => {
    // This endpoint can read every lead and delete any of them, so the order matters:
    // a handler that parses the query or the body first does work for a caller it is
    // about to refuse, and one that queries first has already leaked the answer.
    const src = readFileSync(path.join(ROOT, "api", "inquiries.ts"), "utf8")
    const code = src.replace(/^\s*\/\/.*$/gm, "").replace(/\/\*[\s\S]*?\*\//g, "")
    const out = []

    const authAt = code.indexOf("await requireCapability(req, capability)")
    if (authAt === -1) return ["inquiries.ts never calls requireCapability — every method would be public"]
    for (const call of ["listInquiries(", "getInquiry(", "updateInquiry(", "deleteInquiry(", "queryParam(", "body<"]) {
      const at = code.indexOf(call)
      if (at !== -1 && at < authAt) out.push(`${call} runs before the authorization check`)
    }
    if (!/const ALLOWED = "GET, PATCH, DELETE"/.test(code)) {
      out.push("the 405 Allow header no longer names GET, PATCH and DELETE")
    }
    // One gate for all methods: if the check sat inside a branch, a new method would
    // arrive unguarded.
    if ((code.match(/await requireCapability\(/g) ?? []).length !== 1) {
      out.push("requireCapability is not called exactly once — a per-method gate can be bypassed")
    }
    // The capability is chosen by the method, before the gate. A single capability
    // for all three would let a rep delete a lead.
    for (const name of ["inbox:read", "inbox:write", "inbox:delete"]) {
      if (!code.includes(`"${name}"`)) out.push(`inquiries.ts no longer names ${name}`)
    }
    return out
  })

  check("the dashboard sends the session token with every inquiry read and write", () => {
    const apiSrc = readFileSync(path.join(ROOT, "src", "lib", "data", "api.ts"), "utf8")
    const out = []
    // The header is built in exactly one place, so there is one thing to get right.
    if (!/Authorization: `Bearer \$\{value\}`/.test(apiSrc)) {
      out.push("api.ts no longer sends an Authorization header")
    }
    const tokenised = (apiSrc.match(/token\?: TokenGetter/g) ?? []).length
    if (tokenised < 4) out.push(`only ${tokenised} of the four inquiry methods accept a token`)

    // And every page that reads or writes them has to hand one over.
    for (const file of [
      "src/admin/InquiriesPage.tsx",
      "src/admin/NotificationsPage.tsx",
      "src/components/app-sidebar.tsx",
    ]) {
      const src = readFileSync(path.join(ROOT, file), "utf8")
      if (!/useAuth\(\)/.test(src)) out.push(`${file} does not read the Clerk session`)
      if (!/getToken/.test(src)) out.push(`${file} never passes the session token to the api`)
    }
    return out
  })

  check("no file under api/ imports a VALUE from outside api/", () => {
    // Code outside `api/` is not part of the function's bundle, so a value import
    // across that boundary is a load-time failure that no build reports.
    //
    // ⚠️ Measured 2026-10-23: this check was written as the *diagnosis* of a
    // production FUNCTION_INVOCATION_FAILED, and that diagnosis was wrong. The
    // runtime log said `Cannot find module '/var/task/api/_lib/http' imported from
    // /var/task/api/inquiry.js` — a missing `.js` extension, not a missing
    // directory. The boundary is still worth enforcing (it is a real failure mode),
    // but it is not what broke that deploy; the next check is.
    //
    // `import type` is allowed to cross the boundary because it is erased before
    // the bundle exists — that is why the type imports from `src/lib/data/types`
    // are harmless and a value import would not be.
    const out = []
    const files = []
    const walk = (dir) => {
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name)
        if (entry.isDirectory()) walk(full)
        else if (entry.name.endsWith(".ts")) files.push(full)
      }
    }
    walk(path.join(ROOT, "api"))
    if (files.length === 0) return ["no .ts files under api/ — this check would pass vacuously"]

    for (const file of files) {
      const src = readFileSync(file, "utf8")
      for (const m of src.matchAll(/^\s*import\s+(type\s+)?[^;\n]*?from\s+"([^"]+)"/gm)) {
        const isTypeOnly = Boolean(m[1]) || /^\s*import\s+type\s/.test(m[0])
        const spec = m[2]
        if (!spec.startsWith(".")) continue
        if (isTypeOnly) continue
        const resolved = path.resolve(path.dirname(file), spec)
        if (!resolved.startsWith(path.join(ROOT, "api") + path.sep)) {
          out.push(`${rel(file)} imports "${spec}" as a value — it is outside api/ and will not be bundled`)
        }
      }
    }
    return out
  })

  check("every relative import under api/ carries its .js extension", () => {
    // The defect this encodes, measured in production 2026-10-23:
    //
    //   Error [ERR_MODULE_NOT_FOUND]: Cannot find module '/var/task/api/_lib/http'
    //     imported from /var/task/api/inquiry.js
    //
    // `package.json` has `"type": "module"`, so Vercel compiles each `api/*.ts` to
    // an ESM `.js` file and copies the specifier through unchanged. Node's ESM
    // resolver requires an extension; `./_lib/http` never resolves, while
    // `./_lib/http.js` does. TypeScript accepts both, the build accepts both, and
    // `tsc -b` cannot see the difference — the only place it fails is at runtime,
    // where it costs a round trip through a deploy to notice.
    //
    // This covers `import type` too, even though it is erased: one rule is easier
    // to hold than "which of these survives the compiler".
    const out = []
    const files = []
    const walk = (dir) => {
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name)
        if (entry.isDirectory()) walk(full)
        else if (entry.name.endsWith(".ts")) files.push(full)
      }
    }
    walk(path.join(ROOT, "api"))
    if (files.length === 0) return ["no .ts files under api/ — this check would pass vacuously"]

    let seen = 0
    for (const file of files) {
      const src = readFileSync(file, "utf8")
      for (const m of src.matchAll(/^\s*import\s+[^;\n]*?from\s+"([^"]+)"/gm)) {
        const spec = m[1]
        if (!spec.startsWith(".")) continue
        seen += 1
        if (!spec.endsWith(".js") && !spec.endsWith(".json")) {
          out.push(`${rel(file)} imports "${spec}" without an extension — Node ESM will not resolve it in the deployed function`)
        }
      }
    }
    // A check that finds nothing to inspect passes for the wrong reason.
    if (seen === 0) out.push("no relative imports found under api/ — this check would pass vacuously")
    return out
  })

  check("every migration can be applied twice", () => {
    const dir = path.join(ROOT, "db", "migrations")
    const files = readdirSync(dir).filter((f) => f.endsWith(".sql")).sort()
    if (files.length === 0) return ["db/migrations is empty — nothing would ever be applied"]
    const out = []
    for (const file of files) {
      const sql = readFileSync(path.join(dir, file), "utf8")
      for (const m of sql.matchAll(/create\s+table\s+(if\s+not\s+exists\s+)?/gi)) {
        if (!m[1]) out.push(`${file}: a create table without "if not exists" fails on a second run`)
      }
      for (const m of sql.matchAll(/insert\s+into\s+(\w+)/gi)) {
        // A seed with no conflict clause inserts a second row on every run.
        const tail = sql.slice(m.index, m.index + 400)
        if (!/on\s+conflict/i.test(tail)) out.push(`${file}: insert into ${m[1]} has no "on conflict" clause`)
      }
    }
    return out
  })

  /* ── Admin settings, moved out of the browser (A2) ─────────────────────────
   *
   * `site`, `profile` and `notifications` used to live in `localStorage`. Two
   * things were wrong with that and only one of them is visible in a screenshot:
   * an operator who edited the business phone number changed it for themselves
   * alone, and `use-theme` reads the `site` record, so **a visitor's own browser
   * decided the site's theme colours**.
   *
   * The validator is exercised for real here — it is a pure function over a plain
   * object, so importing it is cheap and a behaviour test beats a grep. The
   * endpoint's *ordering* can only be asserted from the source, because calling it
   * needs a Clerk token and a database.
   */
  suite("Admin settings on the server (A2)", "api/settings.ts")

  const settingsLib = await load("api/_lib/adminSettings.ts", "admin-settings")
  const settingsSeed = await load("src/lib/data/seed.ts", "settings-seed")

  check("the settings validator drops unknown keys instead of storing them", () => {
    const out = []
    const shipped = settingsSeed.DEFAULT_SETTINGS
    // A client must not be able to smuggle anything into the stored row: the
    // record is read back by the public site, so an extra key is an extra thing
    // that ships to every visitor.
    const accepted = settingsLib.validateSettings("site", {
      ...shipped,
      __injected: "<script>",
      isAdmin: true,
    })
    if (!accepted.ok) {
      return [`the shipped defaults are rejected by their own validator: ${JSON.stringify(accepted.fields)}`]
    }
    for (const key of ["__injected", "isAdmin"]) {
      if (key in accepted.value) out.push(`validateSettings kept the unknown key "${key}"`)
    }
    // The other direction: a shape that lost a field would drop the operator's
    // value on the next save, silently, because a whole-record write replaces it.
    for (const key of Object.keys(shipped)) {
      if (!(key in accepted.value)) out.push(`"${key}" is in DEFAULT_SETTINGS but not in the stored record`)
    }
    if (Object.keys(accepted.value).length !== Object.keys(shipped).length) {
      out.push(
        `stored ${Object.keys(accepted.value).length} fields for a ${Object.keys(shipped).length}-field record`,
      )
    }
    return out
  })

  check("a colour or an hour outside the shape is refused, with the field named", () => {
    const site = settingsSeed.DEFAULT_SETTINGS
    const prefs = settingsSeed.DEFAULT_NOTIFICATIONS
    const cases = [
      ["site", { ...site, themeHome: "chartreuse" }, "themeHome", "a colour name is not a hex value"],
      ["site", { ...site, themeHome: "#21558" }, "themeHome", "five digits is not a colour"],
      ["site", { ...site, brandName: 42 }, "brandName", "a number is not text"],
      ["site", { ...site, brandName: "x".repeat(81) }, "brandName", "over the 80-character limit"],
      ["notifications", { ...prefs, digestHour: 24 }, "digestHour", "hour 24 does not exist"],
      ["notifications", { ...prefs, digestHour: 7.5 }, "digestHour", "a fractional hour is not an hour"],
      ["notifications", { ...prefs, emailOnLead: "yes" }, "emailOnLead", "a string is not a boolean"],
    ]
    const out = []
    for (const [key, record, field, why] of cases) {
      const result = settingsLib.validateSettings(key, record)
      if (result.ok) out.push(`${key}.${field} accepted ${why}`)
      else if (!(field in result.fields)) {
        // The message has to name the field: the form marks inputs by key, so a
        // rejection that says "invalid" marks nothing and reads as a dead save.
        out.push(`${key}.${field} was rejected but the error named ${JSON.stringify(Object.keys(result.fields))}`)
      }
    }

    // The uppercase form is normalised, not stored as typed — `index.css` and the
    // picker compare strings, and `#2A5AA2` !== `#2a5aa2`.
    const upper = settingsLib.validateSettings("site", { ...site, themeHome: "#2A5AA2" })
    if (!upper.ok) out.push("an uppercase hex was rejected outright")
    else if (upper.value.themeHome !== "#2a5aa2") {
      out.push(`uppercase hex was stored as ${JSON.stringify(upper.value.themeHome)}`)
    }

    if (settingsLib.validateSettings("site", null).ok) out.push("a null body was accepted")
    if (settingsLib.validateSettings("site", []).ok) out.push("an array body was accepted")
    return out
  })

  check("the settings endpoint gates every write and opens only the site read", () => {
    const src = readFileSync(path.join(ROOT, "api", "settings.ts"), "utf8")
    const code = src.replace(/^\s*\/\/.*$/gm, "").replace(/\/\*[\s\S]*?\*\//g, "")
    const out = []

    const authAt = code.indexOf("await requireCapability(")
    if (authAt === -1) return ["settings.ts never calls requireCapability — every write would be public"]
    for (const call of ["body<", "validateSettings(", "readSettings(", "writeSettings("]) {
      const at = code.indexOf(call)
      if (at !== -1 && at < authAt) out.push(`${call} runs before the authorization check`)
    }
    if ((code.match(/await requireCapability\(/g) ?? []).length !== 1) {
      out.push("requireCapability is not called exactly once — a per-branch gate can be bypassed")
    }
    // A private read and a write are different grants: a manager may read the
    // notification address and may not change it.
    if (!code.includes('"settings:read"') || !code.includes('"settings:write"')) {
      out.push("settings.ts no longer distinguishes reading from writing")
    }

    // The exception has to stay narrow. `site` is public because the marketing
    // pages read it for their colours and their phone number; widening this to a
    // method or a key it does not name would publish `profile` and `notifications`.
    if (settingsLib.PUBLIC_KEYS.join(",") !== "site") {
      out.push(`PUBLIC_KEYS is ${JSON.stringify(settingsLib.PUBLIC_KEYS)}, expected ["site"]`)
    }
    if (!/method === "GET" && PUBLIC_KEYS\.includes\(key\)/.test(code)) {
      out.push("the un-gated read is no longer limited to GET on PUBLIC_KEYS")
    }
    if (!/const ALLOWED = "GET, PUT"/.test(code)) {
      out.push("the 405 Allow header no longer names GET and PUT")
    }
    return out
  })

  check("no page writes the admin's settings to the browser any more", () => {
    const apiSrc = readFileSync(path.join(ROOT, "src", "lib", "data", "api.ts"), "utf8")
    const out = []
    const pairs = [
      ["getSettings", "site"],
      ["saveSettings", "site"],
      ["getProfile", "profile"],
      ["saveProfile", "profile"],
      ["getNotifications", "notifications"],
      ["saveNotifications", "notifications"],
    ]
    for (const [method, key] of pairs) {
      const block = apiSrc.match(new RegExp(`async ${method}\\([\\s\\S]*?\\n  \\},`))
      if (!block) {
        out.push(`api.ts has no ${method} method — this check would skip it`)
        continue
      }
      // The docblocks in these methods explain what moved where, so they contain
      // the word `localStorage`. Only code counts.
      const body = block[0].replace(/^\s*\/\/.*$/gm, "")
      if (!body.includes(`/api/settings?key=${key}`)) {
        out.push(`${method} no longer calls /api/settings?key=${key}`)
      }
      if (/backend\.(read|write)(Settings|Profile|Notifications)/.test(body)) {
        out.push(`${method} still goes through the browser backend`)
      }
    }

    // The token is what makes a write admin-only, so every write path has to
    // accept one. `getSettings` is the deliberate exception: it is the public read.
    if (!/async saveSettings\(value: SiteSettings, token\?: TokenGetter\)/.test(apiSrc)) {
      out.push("saveSettings no longer accepts a token")
    }
    for (const file of [
      "src/admin/SettingsPage.tsx",
      "src/admin/ProfilePage.tsx",
      "src/admin/NotificationsPage.tsx",
      "src/admin/DesignSystemPage.tsx",
    ]) {
      const page = readFileSync(path.join(ROOT, file), "utf8")
      if (!/useAuth\(\)/.test(page)) out.push(`${file} does not read the Clerk session`)
      if (!/getToken/.test(page)) out.push(`${file} never passes the session token to the api`)
    }

    // And the one read that must stay token-free: a visitor has no session, and a
    // theme that needs one would leave every marketing page on the shipped colours.
    const theme = readFileSync(path.join(ROOT, "src", "lib", "use-theme.ts"), "utf8")
    if (!/api\.getSettings\(\)/.test(theme)) {
      out.push("use-theme no longer reads the settings record without a token")
    }
    return out
  })

  check("the client knows every capability the server can grant", () => {
    // The one duplicated list in the app: `api/_lib/roles.ts` and
    // `src/admin/clerkAuth.ts` are built by different tsconfigs, so `src/` cannot
    // import `api/`. A capability the server grants and the client has never heard
    // of opens no page — the nav would hide an area the operator is entitled to,
    // and nothing else in the suite would notice.
    const client = readFileSync(path.join(ROOT, "src", "admin", "clerkAuth.ts"), "utf8")
    const block = client.match(/KNOWN_CAPABILITIES = \[([\s\S]*?)\] as const/)
    if (!block) return ["clerkAuth.ts no longer declares KNOWN_CAPABILITIES"]
    const names = [...block[1].matchAll(/"([a-z]+:[a-z]+)"/g)].map((m) => m[1]).sort()
    // A vacuity guard: an empty list would make both loops below pass.
    if (names.length === 0) return ["the client's capability list is empty — this check would pass vacuously"]

    const out = []
    const server = [...roles.ALL_CAPABILITIES].sort()
    for (const capability of server) {
      if (!names.includes(capability)) {
        out.push(`${capability} is granted by the server and unknown to the client — its page would be hidden`)
      }
    }
    for (const capability of names) {
      if (!server.includes(capability)) {
        out.push(`${capability} is known to the client and granted by no server role`)
      }
    }
    return out
  })

  check("every capability an endpoint names is one a role can hold", () => {
    // A typo here is a permanent 403 for everyone including an admin, and it reads
    // as "the page is broken" rather than "the name is wrong".
    const out = []
    const files = [
      "api/inquiries.ts",
      "api/settings.ts",
      "api/notification-settings.ts",
      "api/staff.ts",
    ]
    for (const file of files) {
      const src = readFileSync(path.join(ROOT, file), "utf8")
      const code = src.replace(/^\s*\/\/.*$/gm, "").replace(/\/\*[\s\S]*?\*\//g, "")
      const named = [...code.matchAll(/"(inbox|settings|reference):([a-z]+)"/g)].map((m) => `${m[1]}:${m[2]}`)
      if (named.length === 0) {
        out.push(`${file} names no capability — is it gated at all?`)
        continue
      }
      for (const capability of new Set(named)) {
        if (!roles.ALL_CAPABILITIES.includes(capability)) {
          out.push(`${file} requires "${capability}", which no role can hold`)
        }
      }
    }
    return out
  })

  check("/api/me refuses an anonymous caller and answers only GET", () => {
    const out = []
    if (anonMe.status !== 401) out.push(`an anonymous GET answered ${anonMe.status}, expected 401`)
    if (anonMe.payload?.error !== "missing_token") out.push(`the refusal was ${JSON.stringify(anonMe.payload)}`)
    // No role or capability list may leak to a caller who was refused — that is the
    // whole payload, and an anonymous caller has not earned any of it.
    if (anonMe.payload?.role || anonMe.payload?.capabilities) out.push("a refused response carries access details")
    if (anonMePost.status !== 405) out.push(`POST answered ${anonMePost.status}, expected 405`)
    if (anonMePost.payload?.allowed !== "GET") out.push(`Allow was ${JSON.stringify(anonMePost.payload?.allowed)}`)

    // And the shell must read it from here, not from a second table of its own.
    const guard = readFileSync(path.join(ROOT, "src", "admin", "RequireAuth.tsx"), "utf8")
    if (!/useCapabilities\(/.test(guard)) out.push("RequireAuth does not ask the server for its capabilities")
    const clerkAuth = readFileSync(path.join(ROOT, "src", "admin", "clerkAuth.ts"), "utf8")
    if (/FEATURES_BY_ROLE/.test(clerkAuth)) {
      out.push("clerkAuth.ts has a role→feature table again — that is the drift /api/me removed")
    }
    return out
  })

  check("the staff endpoint gates both methods, authorises first, and checks the membership answer", () => {
    // The roster is readable by a manager and writable only by an admin, so the
    // two methods name different capabilities. A single gate here would either
    // hide the page from the person who runs the desk or let them hand out access.
    const out = []
    if (anonStaffGet.status !== 401) out.push(`an anonymous GET answered ${anonStaffGet.status}, expected 401`)
    if (anonStaffPut.status !== 401) out.push(`an anonymous PUT answered ${anonStaffPut.status}, expected 401`)
    if (anonStaffPut.payload?.error !== "missing_token") {
      out.push(`the PUT refusal was ${JSON.stringify(anonStaffPut.payload)}`)
    }
    if (anonStaffPost.status !== 405) out.push(`POST answered ${anonStaffPost.status}, expected 405`)
    if (anonStaffPost.payload?.allowed !== "GET, PUT") {
      out.push(`Allow was ${JSON.stringify(anonStaffPost.payload?.allowed)}`)
    }

    // ⚠️ A status code cannot show the ORDER. A handler that read and validated
    // the body first would answer the same 401 while having parsed a stranger's
    // payload — and, on a future change, while having written.
    const src = readFileSync(path.join(ROOT, "api", "staff.ts"), "utf8")
    const code = src.replace(/^\s*\/\/.*$/gm, "").replace(/\/\*[\s\S]*?\*\//g, "")
    const authAt = code.indexOf("await requireCapability(")
    const bodyAt = code.indexOf("body<unknown>(req)")
    if (authAt < 0) out.push("staff.ts no longer calls requireCapability")
    if (bodyAt < 0) out.push("staff.ts no longer reads a body — this check would pass vacuously")
    if (authAt >= 0 && bodyAt >= 0 && authAt > bodyAt) out.push("the body is read BEFORE the caller is authorised")
    if (!/"settings:read" : "settings:write"/.test(code)) {
      out.push("the two methods no longer name different capabilities")
    }

    // ⚠️ `membershipIncludes()` is asserted on its own above, and that check
    // passed a mutation that replaced the call with `memberships.data.length > 0`
    // — the pure function was covered, its USE was not. The negative assertion is
    // the one that catches it: a length test trusts Clerk's filter, so an ignored
    // filter would admit anyone in the roster.
    if (/memberships\.data\.length\s*[><]/.test(code)) {
      out.push("the endpoint trusts the response length instead of checking the answer names the user")
    }
    if (!/membershipIncludes\(memberships\.data,/.test(code)) {
      out.push("the endpoint no longer checks the Clerk answer against the target user")
    }
    return out
  })

  check("a staff change is validated as a shape before it can reach the database", () => {
    const out = []
    const ok = staff.validateStaffUpdate({ userId: "  user_2abcdef  ", role: "service_manager" })
    if (!ok.ok) return [`a well-formed change was refused: ${JSON.stringify(ok.fields ?? ok)}`]
    if (ok.value.userId !== "user_2abcdef") out.push(`userId not trimmed: "${ok.value.userId}"`)
    // Omitted `active` is NOT "true": it means "leave the row alone", which is what
    // stops a role change from resurrecting a deactivated person.
    if (ok.value.active !== null) out.push(`an omitted active became ${JSON.stringify(ok.value.active)}, expected null`)

    const cases = [
      [{ userId: "dana@example.com", role: "service_rep" }, "userId", "an email address as a user id"],
      [{ userId: "", role: "service_rep" }, "userId", "an empty user id"],
      [{ userId: "user_2abcdef", role: "org:owner" }, "role", "a level that is not one of the three"],
      [{ userId: "user_2abcdef", role: "service_rep", active: "false" }, "active", "a string where a boolean belongs"],
    ]
    for (const [input, field, label] of cases) {
      const got = staff.validateStaffUpdate(input)
      if (got.ok) out.push(`${label} was accepted`)
      else if (!got.fields[field]) out.push(`${label} was refused without naming "${field}": ${JSON.stringify(got.fields)}`)
    }

    const off = staff.validateStaffUpdate({ userId: "user_2abcdef", role: "service_rep", active: false })
    if (!off.ok || off.value.active !== false) out.push("an explicit active:false was not carried through")
    const admin = staff.validateStaffUpdate({ userId: "user_2abcdef", role: "admin" })
    if (!admin.ok) out.push("the admin level was refused as a staff level")
    return out
  })

  check("nobody changes their own level, and only a member of the organization gets a row", () => {
    const out = []
    const target = { userId: "user_2target", role: "service_rep", active: null }
    if (staff.staffRefusal("user_2target", target) !== "cannot_change_own_level") {
      out.push("an operator was allowed to change their own level")
    }
    if (staff.staffRefusal("user_2actor", target) !== null) {
      out.push("an operator was refused a change to someone else's level")
    }

    // The membership answer has to be about THAT user. If Clerk ever ignored the
    // `userId` filter the response would be the whole roster, every id would look
    // like a member, and a stranger would be accepted with no error anywhere.
    const roster = [{ publicUserData: { userId: "user_2member" } }]
    if (!staff.membershipIncludes(roster, "user_2member")) out.push("a member was not recognised")
    if (staff.membershipIncludes(roster, "user_2stranger")) {
      out.push("a stranger was accepted because someone ELSE is in the roster — the filter was ignored")
    }
    if (staff.membershipIncludes([], "user_2member")) out.push("an empty answer was read as a membership")
    if (staff.membershipIncludes([{ publicUserData: null }], "user_2member")) {
      out.push("a membership with no user data was counted as a match")
    }
    return out
  })

  check("the roster is Clerk's members joined to the levels, and a missing row is a state", () => {
    // Three states the screen has to tell apart, and they are indistinguishable
    // from any status code: a member with a level, a member with no row (the
    // read-only floor), and a row for someone who has left the organization.
    const members = [
      {
        role: "org:member",
        publicUserData: { userId: "user_2rep", firstName: "Dana", lastName: "Reyes", identifier: "dana@example.com" },
      },
      {
        role: "org:member",
        publicUserData: { userId: "user_2new", firstName: "Sam", lastName: "Lee", identifier: "sam@example.com" },
      },
      {
        role: "org:admin",
        publicUserData: { userId: "user_2boss", firstName: "Jaden", lastName: "Black", identifier: "jaden@example.com" },
      },
    ]
    const rows = [
      {
        userId: "user_2rep",
        role: "service_rep",
        active: true,
        createdAt: "2026-10-27T00:00:00Z",
        updatedAt: "2026-10-27T00:00:00Z",
      },
      {
        userId: "user_2gone",
        role: "service_manager",
        active: true,
        createdAt: "2026-10-01T00:00:00Z",
        updatedAt: "2026-10-01T00:00:00Z",
      },
    ]
    const roster = staff.buildRoster(members, rows)
    const out = []
    if (roster.length !== 3) out.push(`the roster has ${roster.length} people, expected 3 (a row for a non-member must not appear)`)
    if (roster.some((e) => e.userId === "user_2gone")) out.push("a staff row for a non-member appeared on the roster")

    const rep = roster.find((e) => e.userId === "user_2rep")
    if (rep?.role !== "service_rep" || rep.active !== true) out.push(`the rep came back as ${JSON.stringify(rep)}`)
    if (rep?.name !== "Dana Reyes") out.push(`the rep's name is "${rep?.name}"`)

    // The one the issue is really about: a member with no row is a STATE, not an
    // absence. `role: null` is what the screen renders as "no level set — read-only".
    const fresh = roster.find((e) => e.userId === "user_2new")
    if (fresh?.role !== null) out.push(`a member with no row came back with role ${JSON.stringify(fresh?.role)}`)
    if (fresh?.active !== false) out.push("a member with no row was reported as active")

    // Clerk admins sort first, because the screen's order should be the order of
    // who can do what, not the order rows happen to exist.
    if (roster[0]?.userId !== "user_2boss") out.push(`the roster leads with ${roster[0]?.userId}, expected the Clerk admin`)
    return out
  })
}
