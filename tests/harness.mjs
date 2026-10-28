/**
 * Test harness — assertions, a report, and a TypeScript loader.
 *
 * The loader uses `esbuild` to bundle the real page modules, so a suite can
 * import them and render with `react-dom/server` instead of re-parsing the
 * source with regexes. That is the difference between "the string contains an
 * anchor" and "the component renders an anchor".
 *
 * ⚠️ `esbuild` is a DECLARED devDependency, and it has to stay one. It used to
 * be imported on the assumption that it "ships inside vite", and that assumption
 * was wrong twice over. First it was only present transitively, so it survived
 * on a developer machine and vanished under CI's `npm ci` — the comment here
 * claimed a guarantee npm never made. Then vite 8 demoted `esbuild` to an
 * OPTIONAL peer dependency (`peerDependenciesMeta.esbuild.optional`), so it is
 * no longer vendored at all: the suite cannot run anywhere without this
 * declaration. G4 failed on every push to `main` with
 * `ERR_MODULE_NOT_FOUND: Cannot find package 'esbuild'`.
 *
 * Do not remove the declaration on the grounds that vite also uses esbuild.
 * Vite lists it as optional precisely so it can be absent.
 *
 * `react` / `react-dom` are left external to the bundle so the rendered tree and
 * the renderer share one React instance — bundling a second copy produces
 * "Invalid hook call", not a test failure.
 */
import { build } from "esbuild"
import { mkdirSync } from "node:fs"
import path from "node:path"
import { pathToFileURL } from "node:url"

export const ROOT = path.resolve(import.meta.dirname, "..")
const TMP = path.join(ROOT, "tests", ".tmp")

/* ── Assertions ──────────────────────────────────────────────────────────── */

const state = { checks: 0, failures: [], suite: "", file: "" }

export function suite(name, file) {
  state.suite = name
  state.file = file
  process.stdout.write(`\n  ${name}\n`)
}

function label(text) {
  return `${state.suite} › ${text}`
}

export function check(text, fn) {
  state.checks += 1
  let problems = []
  try {
    const result = fn()
    if (Array.isArray(result)) problems = result.filter(Boolean)
    else if (result === false) problems = ["assertion returned false"]
    // ⚠️ A check that returns a Promise is not awaited, so its problems never
    // reach the tally — it prints ✓ and asserts nothing. That is this repository's
    // recurring defect wearing a new hat, so it fails loudly instead: await the
    // work before calling check(), then assert on the result synchronously.
    else if (result && typeof result.then === "function") {
      problems = ["check() is synchronous but the callback returned a Promise — await the work first"]
    }
  } catch (err) {
    problems = [`threw: ${err && err.message ? err.message : String(err)}`]
  }
  if (problems.length === 0) {
    process.stdout.write(`    \u2713 ${text}\n`)
  } else {
    process.stdout.write(`    \u2717 ${text}\n`)
    for (const p of problems.slice(0, 12)) process.stdout.write(`        ${p}\n`)
    if (problems.length > 12) process.stdout.write(`        … and ${problems.length - 12} more\n`)
    state.failures.push(`${label(text)} — ${problems.length} problem(s)`)
  }
}

/**
 * The number of checks registered so far, including the one calling this.
 *
 * Exported for `tests/run.mjs` alone, which asserts a document's stated count
 * against the run that just happened. No suite can make that comparison from the
 * inside: a suite cannot see the checks that have not run yet.
 */
export function tally() {
  return state.checks
}

/* ── Module loading ──────────────────────────────────────────────────────── */

const loaded = new Map()

/**
 * A signed-out Clerk session, as source, for `stubClerk`.
 *
 * Kept as a string rather than a file so it cannot drift into being imported by
 * the app: it is a virtual module that exists only inside an esbuild bundle.
 */
const CLERK_STUB = `
const session = {
  isLoaded: true,
  isSignedIn: false,
  userId: null,
  sessionId: null,
  orgId: null,
  orgRole: null,
  orgSlug: null,
  getToken: async () => null,
  signOut: async () => {},
  openSignIn: () => {},
  openSignUp: () => {},
}
export const useAuth = () => session
export const useClerk = () => session
export const useUser = () => ({ isLoaded: true, isSignedIn: false, user: null })
export const useOrganization = () => ({ isLoaded: true, organization: null, membership: null })
export const ClerkProvider = ({ children }) => children
export const UserButton = () => null
export const SignIn = () => null
export const SignUp = () => null
export const SignInButton = ({ children }) => children ?? null
export const SignUpButton = ({ children }) => children ?? null
export const SignedIn = ({ children }) => children ?? null
export const SignedOut = ({ children }) => children ?? null
`

/**
 * Bundle a project module to ESM in `tests/.tmp` and import it.
 *
 * `packages: "external"` is NOT used: it would also externalise the `@/…`
 * alias. Instead React is named explicitly, which is all that needs to be a
 * single shared instance.
 *
 * `lucide-react` is external for a different reason: it ships CJS, and esbuild
 * cannot convert its `require("react")` into ESM — bundling it fails at import
 * time with `Dynamic require of "react" is not supported`. Leaving it external
 * lets node resolve it from node_modules instead. Only admin modules pull it in;
 * the marketing pages are raw HTML strings and import nothing.
 *
 * `stubClerk` swaps `@clerk/react` for the signed-out stub above. The admin
 * pages read the session through `useAuth()`, and Clerk's hooks throw when no
 * `<ClerkProvider>` is above them — which the static-markup gate cannot supply,
 * because it renders one component in isolation. Without the stub the only pages
 * this gate could reach would be the ones that need no session. It is not a
 * substitute for authorization testing: a stubbed session proves the page
 * renders, and nothing about who is allowed to see it.
 */
export async function load(relativePath, name, options = {}) {
  if (loaded.has(name)) return loaded.get(name)

  mkdirSync(TMP, { recursive: true })
  const outfile = path.join(TMP, `${name}.mjs`)

  await build({
    entryPoints: [path.join(ROOT, relativePath)],
    outfile,
    bundle: true,
    format: "esm",
    platform: "node",
    target: "node22",
    jsx: "automatic",
    tsconfig: path.join(ROOT, "tsconfig.app.json"),
    external: ["react", "react-dom", "react-dom/server", "react/jsx-runtime", "lucide-react"],
    define: { "process.env.NODE_ENV": '"test"' },
    logLevel: "silent",
    plugins: options.stubClerk
      ? [
          {
            name: "clerk-stub",
            setup(b) {
              b.onResolve({ filter: /^@clerk\/react$/ }, () => ({
                path: "@clerk/react",
                namespace: "clerk-stub",
              }))
              b.onLoad({ filter: /.*/, namespace: "clerk-stub" }, () => ({
                contents: CLERK_STUB,
                loader: "js",
              }))
            },
          },
        ]
      : [],
  })

  const mod = await import(pathToFileURL(outfile).href)
  loaded.set(name, mod)
  return mod
}

/** Bundle a module and render its default export to static HTML. */
export async function render(relativePath, name, options) {
  const mod = await load(relativePath, name, options)
  const { renderToStaticMarkup } = await import("react-dom/server")
  const { createElement } = await import("react")
  return renderToStaticMarkup(createElement(mod.default))
}

/* ── HTML helpers ────────────────────────────────────────────────────────── */

/**
 * Comments are stripped before any structural scan.
 *
 * The pages carry long explanatory HTML comments inside their markup strings —
 * including example markup like `<a href="#terms">`. Scanning the raw string
 * finds those and reports links that no visitor can reach. Measured: 3 phantom
 * dead anchors before this existed.
 */
export function stripComments(html) {
  return html.replace(/<!--[\s\S]*?-->/g, " ")
}

/**
 * The same idea for TypeScript: source with its comments removed, before any
 * identifier scan. The docblocks in this repo are long and explain what the code
 * *used to* do, so they name the very identifiers a scan looks for — measured
 * 2026-10-28, a check for `notificationEmail` matched only the comment explaining
 * its removal. A grep cannot tell a comment from code.
 *
 * Lives here rather than in one suite because two suites now scan JSX text, and
 * two copies of a stripper drift in the direction of whichever is stricter.
 */
export function stripJsComments(src) {
  return src.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/^[ \t]*\/\/.*$/gm, " ")
}

/**
 * Attribute values, anchored so `aria-invalid="false"` is not read as `id`.
 * Without the lookbehind this returns 6 phantom `id="false"` values on /contact.
 */
export function attr(html, name) {
  const re = new RegExp(`(?<![\\w-])${name}\\s*=\\s*"([^"]*)"`, "g")
  const out = []
  let m
  while ((m = re.exec(html)) !== null) out.push(m[1])
  return out
}

export function tags(html, tag) {
  const re = new RegExp(`<${tag}\\b[^>]*>`, "gi")
  return html.match(re) ?? []
}

/**
 * The full element for the first opening tag matching `openPattern`.
 *
 * Depth-aware: a lazy match to the first `</div>` truncates at the first nested
 * child, which silently hides everything inside the legal dialogs.
 */
export function element(html, openPattern) {
  const m = new RegExp(`<([a-z]+)\\b[^>]*${openPattern}[^>]*>`, "i").exec(html)
  if (!m) return null
  const tag = m[1]
  const scan = new RegExp(`<${tag}\\b|</${tag}>`, "gi")
  scan.lastIndex = m.index + m[0].length
  let depth = 1
  let step
  while ((step = scan.exec(html)) !== null) {
    if (step[0][1] === "/") {
      depth -= 1
      if (depth === 0) return html.slice(m.index, step.index + step[0].length)
    } else {
      depth += 1
    }
  }
  return html.slice(m.index)
}

/** Visible text with tags and entities flattened. */
export function textOf(html) {
  return stripComments(html)
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/&mdash;/g, "—")
    .replace(/&rarr;/g, "→")
    .replace(/\s+/g, " ")
    .trim()
}

/**
 * The page body with the two legal dialogs removed.
 *
 * Terms and Privacy are separate documents that legitimately share boilerplate
 * ("Contact Us", the retention clause) — and each carries a deliberate "Sample
 * language" warning. Judging them by the page's copy rules produces noise, so
 * copy checks run on what is left.
 */
export function bodyOf(html) {
  return stripComments(html).replace(
    /<div id="legal-(?:terms|privacy)"[\s\S]*?(?=<div id="legal-(?:terms|privacy)"|$)/g,
    " ",
  )
}

/**
 * The site footer — the **last** `<footer>` in the document.
 *
 * `<footer>` is legal inside `<blockquote>`, and the home page uses it for the
 * attribution line under each testimonial. So neither of the obvious regexes
 * works: greedy `/<footer[\s\S]*<\/footer>/` runs from the first testimonial's
 * footer to the end of the document, and lazy stops at that same testimonial —
 * both read as "the footers differ between pages" when they are identical.
 * Take the last opening tag instead.
 */
export function siteFooter(html) {
  const clean = stripComments(html)
  const start = clean.lastIndexOf("<footer")
  if (start === -1) return null
  const end = clean.indexOf("</footer>", start)
  return end === -1 ? clean.slice(start) : clean.slice(start, end + "</footer>".length)
}

/** Every class token that appears in a `class="…"` attribute. */
export function classTokens(html) {
  const set = new Set()
  for (const value of attr(stripComments(html), "class")) {
    for (const token of value.split(/\s+/)) if (token) set.add(token)
  }
  return set
}

/**
 * The selector Tailwind emits for a class name.
 *
 * Two details that are easy to get wrong and silently lose classes:
 *   · a leading digit is emitted as a hex escape — `.2xl\:gap` is written
 *     `.\32 xl\:gap`, because a CSS identifier cannot start with a digit;
 *   · only ASCII needs escaping — `before:content-['✓']` keeps its ✓ raw.
 *
 * ⚠️ THE SPACE AFTER `\32` IS LOAD-BEARING, and leaving it out made this
 * helper unable to see the very class it was asked about. A CSS hex escape is
 * terminated either by whitespace or by exceeding the 6-digit maximum. `\32x`
 * is therefore read as *one* escape (`0x32x`, an invalid code point), not as
 * `2` followed by `x` — so Tailwind writes `\32` + a single space + `xl`.
 *
 * Measured [M: 2026-09-29, tailwindcss 4.3.3] with a bare `compile()`:
 *   candidate `2xl:gap-[52px]` → `.\32 xl\:gap-\[52px\]{gap:52px}`   (space)
 *   this helper used to emit     `.\32xl\:gap-\[52px\]`               (no space)
 * The two never match, so `2xl:` classes were reported missing on EVERY run —
 * and `verify.mjs` gated the build on that report.
 *
 * The rule is: after `\3` + the first digit, Tailwind ALWAYS writes a single
 * space, then the rest of the class name. Measured [M: 2026-09-29, tailwindcss
 * 4.3.3] — `2xl:gap-[52px]` compiles to `.\32 xl\:gap-\[52px\]{gap:52px}`.
 * The space is not conditional on the next character being a hex digit; it is
 * present for `2xl`, for `4xl` and for a bare `2xl` alike.
 */
export function cssSelector(token) {
  const esc = (s) =>
    s.replace(/[\x00-\x7F]/g, (c) => (/[A-Za-z0-9_-]/.test(c) ? c : `\\${c}`))
  if (/^\d/.test(token)) return `.\\3${token[0]} ${esc(token.slice(1))}`
  return `.${esc(token)}`
}

/**
 * Is this class emitted by the compiled stylesheet?
 *
 * A substring search rather than a selector parse: a decimal point followed by
 * a breakpoint (`.3` then `2xl\:gap-[52px]`) parses as the single token
 * `32xl:gap-[52px]`, which silently loses real classes. The boundary check
 * stops `gap-2` from matching inside `gap-20`.
 */
export function hasClass(css, token) {
  const needle = cssSelector(token)
  let from = 0
  for (;;) {
    const at = css.indexOf(needle, from)
    if (at === -1) return false
    const next = css[at + needle.length]
    if (next === undefined || !/[A-Za-z0-9_\\-]/.test(next)) return true
    from = at + 1
  }
}

/* ── Report ──────────────────────────────────────────────────────────────── */

export function finish() {
  const { checks, failures } = state
  process.stdout.write("\n" + "─".repeat(64) + "\n")
  if (failures.length === 0) {
    process.stdout.write(`  ${checks} checks passed\n\n`)
    return 0
  }
  process.stdout.write(`  ${checks - failures.length}/${checks} checks passed, ${failures.length} failed:\n`)
  for (const f of failures) process.stdout.write(`    • ${f}\n`)
  process.stdout.write("\n")
  return 1
}
