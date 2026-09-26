/**
 * auth — the dashboard gate (`src/admin/auth.ts`, `LoginPage`, `RequireAuth`).
 *
 * WHY THIS SUITE IS MOSTLY STRUCTURAL. `renderToStaticMarkup` has no layout and
 * runs no effects, so it cannot actually sign anyone in: the KDF is async, the
 * session lives in `sessionStorage`, and the guard's decision is a store
 * subscription. What *is* checkable here is everything that would make the gate
 * a lie — the cost of the hash, the encoding of the stored digests, the absence
 * of any plaintext credential constant, and the page copy that used to say there
 * was no gate at all. The sign-in itself is verified in a real browser, with
 * `scripts/_probe_admin_gate.cjs`.
 *
 * ⚠️ NOTHING IN THIS FILE MAY CONTAIN THE CREDENTIALS. The whole point of the
 * gate is that they are not in the repository. The suite checks the *shape* of
 * what is stored and proves the KDF agrees with the tool that produced it, so it
 * never needs to know the secret — and a future edit cannot "fix" a failure here
 * by pasting the password in.
 */
import { readFileSync, readdirSync } from "node:fs"
import path from "node:path"
import { pbkdf2Sync } from "node:crypto"
import { ROOT, check, load, render, suite } from "./harness.mjs"

const read = (rel) => readFileSync(path.join(ROOT, rel), "utf8")

function sourceFiles(dir = path.join(ROOT, "src")) {
  const out = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) out.push(...sourceFiles(full))
    else if (/\.(ts|tsx)$/.test(entry.name)) out.push(full)
  }
  return out
}

/**
 * `auth.ts` with its comments removed, then every plain double-quoted literal.
 *
 * Comments first, because the file's own doc block quotes `if (input ===
 * "hunter2")` as an example of what this build does NOT do — and a scanner that
 * reads comments would report that as a plaintext credential.
 */
const stripJsComments = (src) =>
  src.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/^[ \t]*\/\/.*$/gm, " ")

const longLiterals = (src) =>
  [...stripJsComments(src).matchAll(/"([^"\\\n]*)"/g)].map((m) => m[1]).filter((s) => s.length >= 8)

/**
 * Long string literals in `auth.ts` that are code rather than data.
 *
 * Listed explicitly instead of filtered by a length or character-class heuristic,
 * so that adding a fourth one is a deliberate act: the check fails and the fix is
 * to say here why the string is there — which is the moment someone notices they
 * were about to add a secret. (Filtering by "contains a digit or a symbol" would
 * have let a plain alphabetic password through.)
 */
const CODE_LITERALS = new Set(["deriveBits", "undefined", "unavailable"])

export async function run() {
  suite("Dashboard gate", "tests/auth.mjs")

  const auth = await load("src/admin/auth.ts", "auth")
  const loginHtml = await render("src/admin/LoginPage.tsx", "login")

  /* ── the KDF ─────────────────────────────────────────────────────────────
   *
   * Async work happens here, outside every `check` callback: `check` is
   * synchronous and reads a returned Promise as "no problems", so an async
   * assertion inside one reports green while asserting nothing.
   */
  const KAT_PASSWORD = "correct horse battery staple"
  const katSalt = new Uint8Array(16).fill(7)
  const kat = async (iterations) =>
    Buffer.from(await auth.derivePasswordForTest(KAT_PASSWORD, katSalt, iterations))

  const katAgrees = kat(1000).then((ours) =>
    ours.equals(pbkdf2Sync(KAT_PASSWORD, katSalt, 1000, 32, "sha256")),
  )
  const kat1000 = await kat(1000)
  const kat2000 = await kat(2000)
  const agreesWithNode = await katAgrees

  check("the password KDF is slow enough to be worth something", () => {
    // The cost of the hash IS the security property: with no server, the only
    // thing standing between a stolen bundle and the password is that guessing
    // is expensive. A future "make the suite faster" edit lands here.
    const n = auth.PBKDF2_ITERATIONS
    if (typeof n !== "number" || !Number.isFinite(n)) return [`PBKDF2_ITERATIONS is ${String(n)}`]
    return n >= 100_000
      ? []
      : [`PBKDF2_ITERATIONS is ${n}; under 100,000 the offline cost stops being a real barrier`]
  })

  check("the browser KDF reproduces the one that generated the digest", () => {
    // The stored digests were produced outside the browser, so the whole scheme
    // rests on WebCrypto's PBKDF2 and Node's agreeing byte for byte. If they did
    // not, every sign-in would fail for a reason nobody could see from the UI.
    return agreesWithNode
      ? []
      : ["WebCrypto's PBKDF2 and Node's disagree on identical inputs, so the stored digest can never be matched"]
  })

  check("the iteration count actually reaches the KDF", () => {
    // A constant that is declared and then not passed through would leave the
    // digest computable in microseconds while the test above still passed.
    return kat1000.equals(kat2000)
      ? ["1000 and 2000 iterations produce the same digest, so the iteration count is not an input"]
      : []
  })

  /* ── what is stored ────────────────────────────────────────────────────── */

  check("the stored credential is a salt and a digest, never a plaintext", () => {
    const out = []
    if (!/^[0-9a-f]{32}$/.test(auth.USERNAME_SALT_HEX)) {
      out.push(`USERNAME_SALT_HEX is not 16 bytes of hex: ${String(auth.USERNAME_SALT_HEX)}`)
    }
    if (!/^[0-9a-f]{64}$/.test(auth.USERNAME_HASH_HEX)) {
      out.push(`USERNAME_HASH_HEX is not a 32-byte digest: ${String(auth.USERNAME_HASH_HEX)}`)
    }
    if (Buffer.from(auth.PASSWORD_SALT_B64, "base64").length !== 16) {
      out.push(`PASSWORD_SALT_B64 does not decode to 16 bytes: ${String(auth.PASSWORD_SALT_B64)}`)
    }
    if (Buffer.from(auth.PASSWORD_HASH_B64, "base64").length !== 32) {
      out.push(`PASSWORD_HASH_B64 does not decode to a 32-byte digest: ${String(auth.PASSWORD_HASH_B64)}`)
    }
    return out
  })

  check("auth.ts holds no literal that could be a plaintext credential", () => {
    // Every long literal in the file must be one of the four declared values, the
    // session key, or a word already accounted for above. A plaintext password
    // added as a constant would have to be at least this long to be worth having,
    // and lands here.
    const allowed = new Set([
      auth.USERNAME_SALT_HEX,
      auth.USERNAME_HASH_HEX,
      auth.PASSWORD_SALT_B64,
      auth.PASSWORD_HASH_B64,
      auth.SESSION_KEY,
      ...CODE_LITERALS,
    ])
    return longLiterals(read("src/admin/auth.ts"))
      .filter((s) => !allowed.has(s))
      .map((s) => `auth.ts carries a literal that is not a declared salt, digest, key or code word: "${s}"`)
  })

  check("the credential-literal scanner would catch a plaintext password", () => {
    // Positive control. Without it, a scanner that returned nothing for anything
    // would make the check above vacuous — which is the failure mode this whole
    // suite exists to avoid.
    const fixture = `
      const PASSWORD = "hunter2-and-then-some"
      const SALT = "RIj/teDxqvzo0hKcQ+5ldw=="
    `
    const allowed = new Set(["RIj/teDxqvzo0hKcQ+5ldw=="])
    const missed = longLiterals(fixture).filter((s) => !allowed.has(s))
    return missed.length
      ? []
      : ["the scanner accepts a plaintext password literal, so the check above proves nothing"]
  })

  check("the stored digest is not an obvious guess", () => {
    // Not a strength test — just a floor. It recomputes PBKDF2 with the stored
    // salt and iteration count, so a credential that happens to be a word anyone
    // would try first fails loudly instead of shipping.
    const salt = Buffer.from(auth.PASSWORD_SALT_B64, "base64")
    const stored = auth.PASSWORD_HASH_B64
    const guesses = ["", "password", "admin", "indigo", "callindigo", "123456", "letmein"]
    const hit = guesses.find(
      (g) => pbkdf2Sync(g, salt, auth.PBKDF2_ITERATIONS, 32, "sha256").toString("base64") === stored,
    )
    return hit === undefined ? [] : [`the password is one of the first guesses anyone would try: "${hit}"`]
  })

  /* ── the session ───────────────────────────────────────────────────────── */

  check("the session cannot be cleared by resetting the demo data", () => {
    // `api.resetDemoData()` wipes `call-indigo:v1:*`. If the session key lived in
    // that namespace, "Reset demo data" on /admin/security would silently sign
    // the operator out and read as a bug.
    return auth.SESSION_KEY.startsWith("call-indigo:v1:")
      ? [`SESSION_KEY (${auth.SESSION_KEY}) sits inside the namespace Reset demo data clears`]
      : []
  })

  check("the session is tab-scoped and expires", () => {
    // Comments are stripped first. The file's own doc block explains why it is
    // NOT `localStorage`, and scanning the raw text reported that sentence as a
    // use of `localStorage` — the same trap as matching a CSS rule inside a
    // comment, which this project has already been bitten by twice.
    const code = stripJsComments(read("src/admin/auth.ts"))
    const out = []
    if (!/sessionStorage/.test(code)) out.push("auth.ts never uses sessionStorage, so the session outlives the tab")
    if (/localStorage/.test(code)) out.push("auth.ts uses localStorage, which keeps the session past the tab")
    const ms = auth.SESSION_MAX_AGE_MS
    if (!Number.isFinite(ms) || ms <= 0) out.push(`SESSION_MAX_AGE_MS is ${String(ms)}`)
    else if (ms > 24 * 60 * 60 * 1000) out.push(`SESSION_MAX_AGE_MS is ${ms}ms — over a day, for a prototype gate`)
    return out
  })

  /* ── the wiring ────────────────────────────────────────────────────────── */

  check("the whole admin shell is behind the guard", () => {
    const src = read("src/App.tsx")
    // It must wrap the LAYOUT, not the individual pages: a guard on the children
    // would still render the sidebar, breadcrumb and navigation to a stranger.
    return /<RequireAuth>\s*<AdminLayout\s*\/>\s*<\/RequireAuth>/.test(src)
      ? []
      : ["App.tsx does not wrap AdminLayout in RequireAuth, so the dashboard chrome renders before sign-in"]
  })

  check("the guard renders the sign-in page in place of the dashboard", () => {
    const src = read("src/admin/RequireAuth.tsx")
    const out = []
    if (!/useAuth\(\)/.test(src)) out.push("RequireAuth does not read the auth store")
    if (!/signedIn/.test(src)) out.push("RequireAuth never looks at the signedIn flag")
    if (!/<LoginPage\s*\/>/.test(src)) out.push("RequireAuth never renders LoginPage")
    return out
  })

  check("the sidebar offers a way out of the session", () => {
    const src = read("src/components/app-sidebar.tsx")
    const out = []
    if (!/from "@\/admin\/auth"/.test(src)) out.push("app-sidebar does not import the auth module")
    if (!/\bsignOut\b/.test(src)) out.push("app-sidebar never calls signOut, so there is no way to end a session")
    return out
  })

  check("the inert NavUser menu is not rendered, so it cannot be mistaken for sign-out", () => {
    // `nav-user.tsx` is unreferenced registry code with a "Log out" item wired to
    // nothing. Rendering it would put a dead sign-out button next to the live one.
    const importers = sourceFiles()
      .filter((f) => !f.endsWith(path.join("components", "nav-user.tsx")))
      .filter((f) => /\bNavUser\b/.test(readFileSync(f, "utf8")))
      .map((f) => path.relative(ROOT, f).replace(/\\/g, "/"))
    return importers.map((f) => `${f} renders NavUser, whose "Log out" item does nothing`)
  })

  /* ── the sign-in page ──────────────────────────────────────────────────── */

  check("the sign-in page renders a masked password field", () => {
    const out = []
    if (!/type="password"/.test(loginHtml)) out.push("no input[type=password] in the rendered page")
    if (!/<input[^>]*type="password"[^>]*/.test(loginHtml)) out.push("the password field is not an input")
    // Case-insensitive on purpose: React 19 emits `autoComplete="…"` in
    // camelCase, while the HTML attribute is lowercase. Matching either keeps
    // this check about the page rather than about the renderer's version.
    const autocomplete = [...loginHtml.matchAll(/autocomplete\s*=\s*"([^"]*)"/gi)].map((m) => m[1])
    if (!autocomplete.includes("username")) out.push("no field is marked autocomplete=username")
    if (!autocomplete.includes("current-password")) out.push("no field is marked autocomplete=current-password")
    if (!/<button[^>]*type="submit"/.test(loginHtml)) out.push("the form has no submit button")
    return out
  })

  check("the sign-in page leaks neither digest into the DOM", () => {
    return [auth.USERNAME_HASH_HEX, auth.PASSWORD_HASH_B64]
      .filter((secret) => loginHtml.includes(secret))
      .map((secret) => `the rendered sign-in page contains ${secret}`)
  })

  check("a failed sign-in blames neither field", () => {
    // The message must name both halves, so it cannot be read as saying which one
    // was wrong. "No such user" is the classic leak this avoids.
    const m = /const WRONG = "([^"]+)"/.exec(read("src/admin/LoginPage.tsx"))
    if (!m) return ["LoginPage has no single WRONG message constant to inspect"]
    const message = m[1].toLowerCase()
    const out = []
    if (!message.includes("username")) out.push(`the failure copy does not mention the username: "${m[1]}"`)
    if (!message.includes("password")) out.push(`the failure copy does not mention the password: "${m[1]}"`)
    return out
  })

  /* ── the copy that the gate invalidates ─────────────────────────────────
   *
   * Four files said, in as many words, that `/admin` had no authentication. All
   * four became false the moment this gate landed, and a stale claim here is
   * worse than a missing one: it tells a reader the dashboard is wide open when
   * it is not, and it is exactly the two-layers-disagree failure this project
   * keeps hitting.
   */
  const NO_AUTH_CLAIM = /\bno authentication\b|\bhas no auth\b|\bno auth\b|has full access/i

  check("no page still claims the dashboard has no sign-in", () =>
    sourceFiles()
      .filter((f) => NO_AUTH_CLAIM.test(readFileSync(f, "utf8")))
      .map((f) => `${path.relative(ROOT, f).replace(/\\/g, "/")} still says there is no authentication`),
  )

  check("the stale-copy scanner would catch the sentences it was written for", () => {
    const fixtures = [
      "This dashboard has no authentication — PRD §9.1 scopes it out.",
      "Anyone who reaches /admin has full access.",
      "`/admin` has no auth and this build has no backend.",
    ]
    const missed = fixtures.filter((f) => !NO_AUTH_CLAIM.test(f))
    return missed.length
      ? [`the scanner misses the copy it replaced: ${missed.join(" | ")}`]
      : []
  })
}
