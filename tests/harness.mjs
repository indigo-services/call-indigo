/**
 * Test harness — assertions, a report, and a TypeScript loader.
 *
 * Zero new dependencies on purpose. The loader uses the `esbuild` that already
 * ships inside `vite`, so a suite can import the real page modules and render
 * them with `react-dom/server` instead of re-parsing the source with regexes.
 * That is the difference between "the string contains an anchor" and "the
 * component renders an anchor".
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

/* ── Module loading ──────────────────────────────────────────────────────── */

const loaded = new Map()

/**
 * Bundle a project module to ESM in `tests/.tmp` and import it.
 *
 * `packages: "external"` is NOT used: it would also externalise the `@/…`
 * alias. Instead React is named explicitly, which is all that needs to be a
 * single shared instance.
 */
export async function load(relativePath, name) {
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
    external: ["react", "react-dom", "react-dom/server", "react/jsx-runtime"],
    define: { "process.env.NODE_ENV": '"test"' },
    logLevel: "silent",
  })

  const mod = await import(pathToFileURL(outfile).href)
  loaded.set(name, mod)
  return mod
}

/** Bundle a module and render its default export to static HTML. */
export async function render(relativePath, name) {
  const mod = await load(relativePath, name)
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
 *     `.\32xl\:gap`, because a CSS identifier cannot start with a digit;
 *   · only ASCII needs escaping — `before:content-['✓']` keeps its ✓ raw.
 */
export function cssSelector(token) {
  const esc = (s) =>
    s.replace(/[\x00-\x7F]/g, (c) => (/[A-Za-z0-9_-]/.test(c) ? c : `\\${c}`))
  if (/^\d/.test(token)) return `.\\3${token[0]}${esc(token.slice(1))}`
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
