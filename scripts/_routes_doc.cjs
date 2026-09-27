#!/usr/bin/env node
/**
 * Generate `docs/60-reference/routes.md` from the tree.
 *
 * WHY THIS EXISTS. `routes.md` is declared DERIVED in its own front matter, and the
 * documentation conventions say a derived document is generated — never hand-edited.
 * A hand-written file wearing a `derived` label is the worst of both: it goes stale
 * exactly like a dated document, while claiming it cannot.
 *
 * SOURCES, and why there are two:
 *   src/App.tsx          the router — what actually renders
 *   src/admin/routes.ts  the nav model — the sidebar, the breadcrumb, the titles
 *
 * `tests/policy.mjs` already asserts the two agree on every /admin page. This script
 * prints that agreement rather than re-deciding it.
 *
 * Usage:
 *   node scripts/_routes_doc.cjs            # write the file
 *   node scripts/_routes_doc.cjs --check    # exit 1 if the file is stale (for CI)
 */
const fs = require("fs")
const path = require("path")

const ROOT = path.resolve(__dirname, "..")
const OUT = path.join(ROOT, "docs", "60-reference", "routes.md")

const appSrc = fs.readFileSync(path.join(ROOT, "src", "App.tsx"), "utf8")
const navSrc = fs.readFileSync(path.join(ROOT, "src", "admin", "routes.ts"), "utf8")

/* ── comments are not code ──────────────────────────────────────────────────── */

/**
 * Blank out comments before parsing anything.
 *
 * WHY THIS EXISTS. This script reads the router with regexes, and a regex cannot
 * tell code from a comment. `src/App.tsx` documents its own routing rules, and
 * one of those comments quotes a route tag verbatim — so the search for the
 * `/admin` block matched the PROSE, which sits ABOVE the public routes. The
 * public table came out empty and its four rows were absorbed into the admin
 * block, next to a phantom row for the comment itself.
 *
 * Blanked rather than deleted: every character becomes a space and newlines are
 * kept, so a line number still points at the line a human would open.
 *
 * Order matters. Block comments go first: blanking line comments first would
 * swallow the terminator that closes a block comment, leaving it unterminated.
 */
function stripComments(src) {
  const blank = (m) => m.replace(/[^\n]/g, " ")
  return (
    src
      .replace(/\/\*[\s\S]*?\*\//g, blank)
      // A line comment, but not the `//` in a URL or in an alias path.
      .replace(/(^|[^:"'`\\])\/\/[^\n]*/g, (m, pre) => pre + " ".repeat(m.length - pre.length))
  )
}

const appCode = stripComments(appSrc)
const navCode = stripComments(navSrc)

/* ── the router ─────────────────────────────────────────────────────────────── */

/** The `/admin` route block, so nested routes are not confused with public ones. */
const adminBlock = /<Route\s+path="\/admin"[\s\S]*?<\/Route>/.exec(appCode)
if (!adminBlock) throw new Error("no /admin route block in src/App.tsx")

/** Every `<Route path="…" element={…} />` in a block. */
function routesIn(src) {
  const out = []
  const re = /<Route\s+([^>]*?)\/?>/g
  let m
  while ((m = re.exec(src))) {
    const attrs = m[1]
    const p = /path="([^"]*)"/.exec(attrs)
    // `element={` may be followed by a newline and indentation before the component
    // (the `/admin` parent route is written that way), so allow whitespace.
    const el = /element=\{\s*<([A-Za-z0-9_.]+)/.exec(attrs)
    const nav = /element=\{<Navigate\s+to="([^"]+)"/.exec(attrs)
    if (!p) {
      if (/\bindex\b/.test(attrs)) {
        out.push({ path: "(index)", target: nav ? `redirect → ${nav[1]}` : el ? el[1] : "?" })
      }
      continue
    }
    out.push({ path: p[1], target: nav ? `redirect → ${nav[1]}` : el ? el[1] : "?" })
  }
  return out
}

// The `/admin` parent route is a non-self-closing tag whose element is the guard.
// Name both, because the guard's *placement* is the load-bearing part (ADR 0002).
function describeAdminParent(routes) {
  return routes.map((r) =>
    r.target === "RequireAuth" ? { ...r, target: "`RequireAuth` → `AdminLayout`" } : r,
  )
}

const adminStart = appCode.search(/<Route\s+path="\/admin"/)
if (adminStart === -1) throw new Error('no /admin route in src/App.tsx')
const publicRoutes = routesIn(appCode.slice(0, adminStart))
const adminRoutes = describeAdminParent(routesIn(adminBlock[0]))

/* ── guards: refuse to print a document we cannot vouch for ─────────────────── */

/**
 * This script's job is to print the tree. When it cannot READ the tree it must
 * fail loudly rather than print a plausible-looking table.
 *
 * WHY THIS IS NOT PARANOIA. This script already shipped a routes.md whose public
 * table was empty, and `--check` reported "up to date" the whole time — because
 * `--check` compares the file against this script's OWN output, so a script that
 * misreads the tree agrees with itself perfectly. `--check` can catch drift; it
 * can never catch a parser bug. The only guard that can is one that looks at the
 * SHAPE of what was parsed, which is what these three do.
 *
 * Each was negative-controlled, but NOT by the same fixture — the first one
 * throws before the others are reached, so claiming "all three fail on the
 * original defect" would be a claim nothing here can check:
 *   · empty public table      → reinstating the offending comment (throws #1)
 *   · marketing route in /admin → disabling #1, then the same comment
 *   · an unresolvable element  → `element={pickPage()}` on a real route
 *
 * A FOURTH guard was written and then deleted: "the /admin block must contain
 * its own parent route". It cannot fail. `adminBlock` is found by matching the
 * literal text `<Route\s+path="\/admin"`, so `path="/admin"` is always the first
 * attribute, and `routesIn` always yields that route. The guard could never see
 * the thing it claimed to check, which is the exact defect this file is about.
 */
if (!publicRoutes.length) {
  throw new Error(
    "parsed 0 public routes from src/App.tsx — the parser is reading a comment, or the " +
      "router moved behind a wrapper this script does not understand",
  )
}
// A marketing page inside the /admin block is the signature of a wrong block
// boundary: that is exactly what the comment-matching bug produced, when the
// four public routes were absorbed into the admin table.
const leaked = adminRoutes.filter(
  (r) =>
    !r.target.includes("`") &&
    !r.target.startsWith("redirect") &&
    fs.existsSync(path.join(ROOT, "src", "marketing", "pages", `${r.target}.tsx`)),
)
if (leaked.length) {
  throw new Error(
    `the /admin block contains marketing routes: ${leaked.map((r) => r.path).join(", ")} — ` +
      "the block boundary is wrong, so public and nested routes are being mixed",
  )
}
const unresolved = [...publicRoutes, ...adminRoutes].filter((r) => r.target === "?")
if (unresolved.length) {
  throw new Error(
    `could not resolve a component for: ${unresolved.map((r) => r.path).join(", ")} — ` +
      "a `?` row means the parser gave up, and that must never reach the document",
  )
}

/* ── the nav model ──────────────────────────────────────────────────────────── */

const navGroups = []
{
  const groupRe = /label:\s*"([^"]+)",\s*items:\s*\[([\s\S]*?)\],\s*\}/g
  let g
  while ((g = groupRe.exec(navCode))) {
    const items = []
    const itemRe = /title:\s*"([^"]+)",\s*path:\s*"([^"]+)",[\s\S]*?description:\s*"([^"]+)"/g
    let i
    while ((i = itemRe.exec(g[2]))) items.push({ title: i[1], path: i[2], description: i[3] })
    navGroups.push({ label: g[1], items })
  }
}
if (!navGroups.length) throw new Error("no nav groups parsed from src/admin/routes.ts")

/* ── the page files, and their real size ────────────────────────────────────── */

function pageLineCount(component) {
  const candidates = [
    `src/marketing/pages/${component}.tsx`,
    `src/admin/${component}.tsx`,
  ]
  for (const rel of candidates) {
    const abs = path.join(ROOT, rel)
    if (fs.existsSync(abs)) {
      return { rel, lines: fs.readFileSync(abs, "utf8").split("\n").length }
    }
  }
  return null
}

const headSha = (() => {
  // `.git/HEAD` is either a raw SHA (detached) or `ref: refs/heads/<branch>`.
  // Resolving the ref matters: the literal string `ref: refs/heads/main` is not a SHA
  // and would be stamped into the document as one.
  try {
    const head = fs.readFileSync(path.join(ROOT, ".git", "HEAD"), "utf8").trim()
    const m = /^ref:\s*(.+)$/.exec(head)
    if (!m) return head.slice(0, 7)
    const refPath = path.join(ROOT, ".git", m[1])
    if (fs.existsSync(refPath)) return fs.readFileSync(refPath, "utf8").trim().slice(0, 7)
    // Packed refs, when the branch ref has been packed away.
    const packed = path.join(ROOT, ".git", "packed-refs")
    if (fs.existsSync(packed)) {
      const line = fs
        .readFileSync(packed, "utf8")
        .split("\n")
        .find((l) => l.endsWith(" " + m[1]))
      if (line) return line.split(" ")[0].slice(0, 7)
    }
    return "unknown"
  } catch {
    return "unknown"
  }
})()

/* ── render ─────────────────────────────────────────────────────────────────── */

const now = new Date().toISOString().slice(0, 10)

const lines = []
const P = (s = "") => lines.push(s)

P("# Routes")
P()
P("**Kind:** derived · **Generated by:** `node scripts/_routes_doc.cjs` · **Never hand-edit.**")
P()
P("Every route the build serves, read out of `src/App.tsx` and `src/admin/routes.ts`.")
P("Regenerating is the only way to change this file.")
P()
P(`Generated ${now}. \`tests/policy.mjs\` asserts that the router and the sidebar model`)
P("agree on every `/admin` page; this table is that agreement, printed.")
P()
P("---")
P()
P("## 1. Public routes (PRD §5.1)")
P()
P("| Path | Renders | Source | Lines |")
P("|---|---|---|---:|")
for (const r of publicRoutes) {
  const src = r.target === "?" ? null : pageLineCount(r.target)
  P(
    `| \`${r.path}\` | \`${r.target}\` | ${src ? `\`${src.rel}\`` : "—"} | ${src ? src.lines : "—"} |`,
  )
}
P()
P("The first three are the marketing pages ported from `valvoro-prototype/`.")
P("`/contact` is a real page added on top — it is **not** a prototype mirror.")
P()
P("## 2. Admin routes — all behind the sign-in gate")
P()
P("`RequireAuth` wraps `AdminLayout`, so an unauthenticated visitor never sees the")
P("sidebar, and no `/admin/login` route exists to loop through.")
P()
/** Render a target cell: already-marked-up targets print as-is. */
const cell = (t) => (t.startsWith("redirect") || t.includes("`") ? t : `\`${t}\``)

P("| Path | Renders | Source | Lines |")
P("|---|---|---|---:|")
for (const r of adminRoutes) {
  const src = r.target.startsWith("redirect") || r.target.includes("`") ? null : pageLineCount(r.target)
  P(`| \`${r.path}\` | ${cell(r.target)} | ${src ? `\`${src.rel}\`` : "—"} | ${src ? src.lines : "—"} |`)
}
P()
P("> ⚠️ **The `/admin` catch-all is a redirect, not a page.** PRD §5.2 forbids a")
P("> fourth page appearing by accident; a redirect preserves that rule as a routing")
P("> property. `tests/policy.mjs` asserts it is a `<Navigate>` and not a component.")
P()
P("## 3. The sidebar model")
P()
P("`src/admin/routes.ts` is the single source of truth for the sidebar, the breadcrumb")
P("and each page's title. It is the file to edit when adding a page.")
P()
for (const g of navGroups) {
  P(`### ${g.label}`)
  P()
  P("| Title | Path | Description |")
  P("|---|---|---|")
  for (const it of g.items) P(`| ${it.title} | \`${it.path}\` | ${it.description} |`)
  P()
}
P("## 4. Adding a route")
P()
P("1. **Add the page component.**")
P("2. **Add it to `ADMIN_NAV`** in `src/admin/routes.ts` — the sidebar, the breadcrumb")
P("   and the title all read from there.")
P("3. **Add the `<Route>`** inside the `/admin` block in `src/App.tsx`.")
P("4. **Regenerate this file**: `node scripts/_routes_doc.cjs`.")
P("5. **Run the gates.** `tests/policy.mjs` fails if the router and the nav model")
P("   disagree — which is the check that makes step 4 safe to forget locally and")
P("   impossible to forget in CI.")
P()
P("---")
P()
P(`*Source of truth: \`src/App.tsx\` and \`src/admin/routes.ts\`. HEAD: \`${headSha}\`.*`)
P()

const out = lines.join("\n")

if (process.argv.includes("--check")) {
  const existing = fs.existsSync(OUT) ? fs.readFileSync(OUT, "utf8") : ""
  // Exclude the two lines that legitimately change without the tree changing: the
  // generation date, and the HEAD stamp (which moves on every commit, so including it
  // would make this check fail on every push — a check that always fails is a check
  // nobody reads).
  const strip = (s) =>
    s
      .replace(/^Generated \d{4}-\d{2}-\d{2}\..*$/m, "")
      .replace(/^\*Source of truth: .*\*$/m, "")
  if (strip(existing) !== strip(out)) {
    console.error("docs/60-reference/routes.md is STALE — run: node scripts/_routes_doc.cjs")
    process.exit(1)
  }
  console.log("docs/60-reference/routes.md is up to date")
} else {
  fs.mkdirSync(path.dirname(OUT), { recursive: true })
  fs.writeFileSync(OUT, out, { encoding: "utf8", newline: "\n" })
  console.log(`wrote ${path.relative(ROOT, OUT)} (${out.split("\n").length} lines)`)
}
