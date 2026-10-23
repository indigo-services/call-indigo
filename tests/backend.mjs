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
  const notify = await load("api/_lib/notifications.ts", "server-notify")
  const settings = await load("api/notification-settings.ts", "api-settings")
  const inquiry = await load("api/inquiry.ts", "api-inquiry")

  // The async work, done once and asserted synchronously below.
  const anonPut = await callHandler(settings.default, "PUT", { body: { to: "attacker@example.com" } })
  const anonInquiryGet = await callHandler(inquiry.default, "GET")
  const honeypotPost = await callHandler(inquiry.default, "POST", { body: { ...valid, company: "Acme" } })
  const invalidPost = await callHandler(inquiry.default, "POST", { body: { ...valid, email: "nope" } })

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

  check("admin is the pinned organization's admin role, not any organization's", () => {
    const out = []
    const cases = [
      [{ orgId: ORG, orgRole: "org:admin" }, true, "admin of Indigo Services"],
      [{ orgId: "org_someone_else", orgRole: "org:admin" }, false, "admin of a DIFFERENT organization"],
      [{ orgId: ORG, orgRole: "org:member" }, false, "member of Indigo Services"],
      [{ orgId: undefined, orgRole: undefined }, false, "a token with no organization claim"],
      [{ orgId: ORG, orgRole: "org:admin" }, true, "the same claims again (no state between calls)"],
    ]
    for (const [claims, expected, label] of cases) {
      const got = auth.grantsAdmin(claims)
      if (got !== expected) out.push(`${label}: grantsAdmin=${got}, expected ${expected}`)
    }
    return out
  })

  check("the membership fallback uses the same pinned organization", () => {
    const out = []
    const m = (id, role) => [{ organization: { id }, role }]
    if (!auth.membershipGrantsAdmin(m(ORG, "org:admin"))) out.push("an admin membership of Indigo Services was refused")
    if (auth.membershipGrantsAdmin(m("org_other", "org:admin"))) out.push("an admin of a DIFFERENT organization was allowed")
    if (auth.membershipGrantsAdmin(m(ORG, "org:member"))) out.push("a plain member was allowed to write settings")
    if (auth.membershipGrantsAdmin([])) out.push("an empty membership list was allowed")
    return out
  })

  check("the settings endpoint refuses an unauthenticated write, and checks auth before writing", () => {
    const out = []
    if (anonPut.status !== 401) out.push(`an unauthenticated PUT answered ${anonPut.status}, expected 401`)
    // ⚠️ The status alone cannot prove the ORDER: a handler that wrote first and
    // then returned 401 would pass the line above while having written.
    const src = readFileSync(path.join(ROOT, "api", "notification-settings.ts"), "utf8")
    const authAt = src.indexOf("await requireAdmin(")
    const writeAt = src.indexOf("writeNotificationSettings(parsed.value)")
    if (authAt < 0) out.push("the handler no longer calls requireAdmin")
    if (writeAt < 0) out.push("the handler no longer writes")
    if (authAt >= 0 && writeAt >= 0 && authAt > writeAt) out.push("requireAdmin is called AFTER the write")
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
    for (const name of ["DATABASE_URL", "RESEND_API_KEY", "CLERK_SECRET_KEY"]) {
      if (!src.includes(`Boolean(process.env.${name}`) && !src.includes(`Boolean(url)`)) {
        out.push(`health.ts no longer reports ${name} as a boolean`)
      }
    }
    if (/JSON\.stringify\(\s*process\.env/.test(src)) out.push("health.ts serialises the whole environment")
    if (/res\.json\(\s*process\.env/.test(src)) out.push("health.ts sends process.env directly")
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
}
