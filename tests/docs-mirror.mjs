/**
 * docs-mirror — the read-only documentation library inside `/admin/docs`.
 *
 * WHY THIS SUITE EXISTS. The mirror reads all of `docs/` into the browser bundle, and
 * every way it can go wrong is INVISIBLE to the other suites:
 *
 *   1. Switching the glob from lazy to eager would move ~440 KB of markdown into the
 *      entry chunk — a regression on the PUBLIC marketing site, caused by a dashboard
 *      page no visitor opens. Nothing else in the tree can see the bundle.
 *   2. A glob pattern that misses a file silently omits that document from the mirror.
 *      The sidebar still renders; one entry just never opens.
 *   3. The rendered HTML goes through `dangerouslySetInnerHTML`. A document containing
 *      raw HTML would execute in a signed-in operator's session.
 *   4. `renderToStaticMarkup` cannot see this page at all: every `useApiData` page
 *      renders as a skeleton, and this one loads its document asynchronously, so the
 *      component suite sees an empty shell. The rendering logic has to be exercised
 *      directly, which is why `markdown.ts` is pure and takes its source as an argument.
 *
 * TWO KINDS OF ASSERTION, DELIBERATELY.
 *
 * `src/admin/docs/markdown.ts` has no Vite API and no I/O, so it is BUNDLED AND RUN —
 * `slugify`, `addHeadingIds`, `resolveHref` and `renderMarkdown` are called for real, over
 * the real documents. `src/admin/docs/content.ts` calls `import.meta.glob`, which only
 * exists under Vite's transform, so it cannot be imported here at all; it is read as TEXT
 * and asserted at the source level. The split is stated so that nobody later mistakes the
 * text assertions for behaviour.
 *
 * ⚠️ Every render is awaited OUTSIDE a `check` callback. `check` is synchronous, so an
 * `async` callback returns a Promise that is neither an array nor `false` — the harness
 * sees no problems and reports green while asserting nothing.
 */
import { readFileSync, readdirSync, statSync } from "node:fs"
import path from "node:path"
import { ROOT, check, load, suite } from "./harness.mjs"

const DOCS = path.join(ROOT, "docs")
const CONTENT_TS = "src/admin/docs/content.ts"

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry)
    if (statSync(full).isDirectory()) walk(full, out)
    else out.push(full)
  }
  return out
}

const read = (p) => readFileSync(p, "utf8")
const rel = (p) => path.relative(ROOT, p).replace(/\\/g, "/")

/**
 * Match the ONE glob pattern the mirror uses.
 *
 * Written out rather than pulled in, because the whole point of check 2 is to test the
 * pattern against the tree WITHOUT Vite — a glob library would be a third implementation
 * of the same thing. `**` followed by `/` matches zero or more whole segments, which is
 * the detail that decides whether `docs/README.md` is mirrored at all: with `.*\/` it
 * would be, and with `[^/]*\/` it would NOT. Check 2's negative control pins that.
 */
function globToRegExp(pattern) {
  let out = ""
  for (let i = 0; i < pattern.length; i += 1) {
    const c = pattern[i]
    if (c === "*" && pattern[i + 1] === "*") {
      if (pattern[i + 2] === "/") {
        out += "(?:.*/)?"
        i += 2
      } else {
        out += ".*"
        i += 1
      }
    } else if (c === "*") {
      out += "[^/]*"
    } else {
      out += /[\\^$.|?+()[\]{}]/.test(c) ? `\\${c}` : c
    }
  }
  return new RegExp(`^${out}$`)
}

/** Fenced code is rendered as markup, so it must not be scanned as prose. */
const stripCodeBlocks = (html) =>
  html.replace(/<pre>[\s\S]*?<\/pre>/g, " ").replace(/<code>[\s\S]*?<\/code>/g, " ")

export async function run() {
  /* ── the material, read once, before any check runs ────────────────────────── */

  const docFiles = walk(DOCS).filter((f) => f.endsWith(".md"))
  const docRels = docFiles.map(rel).sort()
  const sources = new Map(docFiles.map((f) => [rel(f), read(f)]))
  const isKnown = (p) => sources.has(p)

  // The renderer, exercised for real. Bundled, not read.
  const md = await load("src/admin/docs/markdown.ts", "docs-markdown")

  const rendered = []
  for (const p of docRels) {
    rendered.push({ path: p, html: await md.renderMarkdown(sources.get(p), p, isKnown) })
  }

  suite("Documentation mirror (/admin/docs)", "src/admin/docs/**")

  /* 1 ── lazy glob, eager manifest ------------------------------------------ */

  /**
   * The lazy/eager split is the single most expensive property here: `eager` on the RAW
   * glob moves every document into the entry chunk, which every marketing visitor
   * downloads. It is a one-word change with no visible effect on the dashboard.
   *
   * Asserted per-declaration, not by grepping the file for `eager`: the manifest glob is
   * SUPPOSED to be eager, so a file-wide search would fail on correct code.
   */
  check("the document glob is lazy and the manifest glob is eager", () => {
    const problems = []
    const src = read(path.join(ROOT, CONTENT_TS))

    /**
     * One top-level declaration, by lines: from `const NAME = ` until a line that starts
     * at column 0 again.
     *
     * ⚠️ The first version searched for the next `\n)`, which does not occur — the RAW
     * declaration ends `,\n}) as …`, so `\n)` is absent, the search returned -1, and the
     * fallback slice ran on into `MANIFEST_SOURCE`, whose `eager: true` then made the RAW
     * check fail on correct code. A boundary that silently falls back to "the rest of the
     * file" is not a boundary.
     */
    const decl = (name) => {
      const lines = src.split("\n")
      const start = lines.findIndex((l) => l.startsWith(`const ${name} = `))
      if (start === -1) return null
      const out = [lines[start]]
      for (let i = start + 1; i < lines.length; i += 1) {
        if (lines[i] !== "" && !/^\s/.test(lines[i])) break
        out.push(lines[i])
      }
      return out.join("\n")
    }

    const raw = decl("RAW")
    const manifest = decl("MANIFEST_SOURCE")
    if (!raw) return ["RAW is no longer declared in content.ts — this check cannot see the glob"]
    if (!manifest) return ["MANIFEST_SOURCE is no longer declared in content.ts"]

    if (/\beager\b/.test(raw)) {
      problems.push("RAW carries `eager` — all of docs/ moves into the entry chunk")
    }
    if (!/\beager:\s*true/.test(manifest)) {
      problems.push("MANIFEST_SOURCE is not eager — the index would need a network round trip")
    }
    if (!/query:\s*"?\?raw"?/.test(raw)) problems.push("RAW no longer requests ?raw")
    if (!/import:\s*"default"/.test(raw)) problems.push('RAW no longer uses import: "default"')

    const rawPattern = /import\.meta\.glob\(\s*"([^"]+)"/.exec(raw)
    if (!rawPattern) problems.push("RAW's glob pattern could not be read")
    else if (rawPattern[1] !== "/docs/**/*.md") {
      problems.push(`RAW globs ${rawPattern[1]}, expected /docs/**/*.md`)
    }
    return problems
  })

  /* 2 ── the glob reaches every document ----------------------------------- */

  check("the mirror's glob pattern reaches every document on disk", () => {
    const problems = []
    const re = globToRegExp("/docs/**/*.md")

    // POSITIVE CONTROL: a matcher that returned true for everything would pass the loop
    // below vacuously. These four must be REJECTED.
    const mustNotMatch = [
      "docs/README.md", // no leading slash — the glob keys are absolute
      "/docs/notes.txt", // not markdown
      "/other/README.md", // wrong root
      "/docs/00-meta", // a directory, not a file
    ]
    for (const p of mustNotMatch) {
      if (re.test(p)) problems.push(`the matcher accepts ${p}, which the glob does not`)
    }
    // …and these two MUST be accepted, including the zero-segment case.
    for (const p of ["/docs/README.md", "/docs/60-reference/routes.md"]) {
      if (!re.test(p)) problems.push(`the matcher rejects ${p}, which the glob does match`)
    }

    for (const p of docRels) {
      if (!re.test(`/${p}`)) problems.push(`${p} is not reachable by the mirror's glob`)
    }
    // POSITIVE CONTROL: an empty docs/ would pass the loop above.
    if (docRels.length < 40) {
      problems.push(`only ${docRels.length} documents walked — expected at least 40`)
    }
    return problems
  })

  /* 3 ── the mirror agrees with the doc-map --------------------------------- */

  /**
   * The sidebar is built from `doc-map.md`, the body from the glob. Those are two
   * different sources, so they can disagree — and a disagreement shows up as an entry
   * that renders nothing, which no other check would notice.
   */
  check("the mirrored set agrees with doc-map.md, and is not empty", () => {
    const problems = []
    const map = sources.get("docs/00-meta/doc-map.md")
    if (!map) return ["docs/00-meta/doc-map.md is missing"]

    const listed = []
    for (const line of map.split("\n")) {
      const m = /^\|\s*\[`([^`]+)`\]\(\.\.\/([^)]+)\)\s*\|/.exec(line)
      if (m) listed.push(`docs/${m[2]}`)
    }
    if (listed.length === 0) return ["no rows parsed from doc-map.md — the manifest would be empty"]

    const onDisk = new Set(docRels)
    for (const p of listed) {
      if (!onDisk.has(p)) problems.push(`doc-map.md lists ${p}, which is not on disk`)
    }
    for (const p of docRels) {
      if (!listed.includes(p)) problems.push(`${p} is on disk but absent from doc-map.md`)
    }
    if (listed.length !== docRels.length) {
      problems.push(`doc-map.md has ${listed.length} rows; the tree has ${docRels.length} documents`)
    }
    return problems
  })

  /* 4 ── slugify ------------------------------------------------------------ */

  check("slugify produces GitHub-style heading anchors", () => {
    const problems = []
    const cases = [
      ["Routes", "routes"],
      ["Hello, World!", "hello-world"],
      ["The `/admin` catch-all is a redirect", "the-admin-catch-all-is-a-redirect"],
      // Whitespace runs are NOT collapsed: GitHub maps each whitespace character to one
      // hyphen, so removing an em dash from "… — …" leaves TWO. Collapsing them would
      // break every wiki anchor that points at a heading containing a dash.
      ["§5.2 — deviations", "52--deviations"],
      ["Documentation — the index", "documentation--the-index"],
      // GitHub removes punctuation but keeps underscores.
      ["a_b c", "a_b-c"],
    ]
    for (const [input, expected] of cases) {
      const got = md.slugify(input)
      if (got !== expected) problems.push(`slugify(${JSON.stringify(input)}) = ${JSON.stringify(got)}, expected ${JSON.stringify(expected)}`)
    }
    // PROPERTY: an anchor never contains whitespace or capitals, whatever goes in.
    for (const input of ["A B  C", "MiXeD CaSe", "trailing   ", "  leading"]) {
      const got = md.slugify(input)
      if (/\s/.test(got)) problems.push(`slugify(${JSON.stringify(input)}) kept whitespace: ${JSON.stringify(got)}`)
      if (got !== got.toLowerCase()) problems.push(`slugify(${JSON.stringify(input)}) kept case: ${JSON.stringify(got)}`)
    }
    return problems
  })

  /* 5 ── heading ids -------------------------------------------------------- */

  check("addHeadingIds annotates plain headings and leaves existing ids alone", () => {
    const problems = []
    const got = md.addHeadingIds("<h1>Routes</h1>\n<h2>Public routes (PRD §5.1)</h2>")
    if (!/<h1 id="routes">/.test(got)) problems.push(`h1 was not given an id: ${got}`)
    if (!/<h2 id="public-routes-prd-51">/.test(got)) problems.push(`h2 was not given an id: ${got}`)

    // A heading that already carries an id must be untouched, not given a second one.
    const already = md.addHeadingIds('<h2 id="mine">Keep</h2>')
    if (already !== '<h2 id="mine">Keep</h2>') problems.push(`an existing id was rewritten: ${already}`)

    // Inline markup must not leak into the anchor.
    const inline = md.addHeadingIds("<h3>The <code>docs</code> mirror</h3>")
    if (!/id="the-docs-mirror"/.test(inline)) problems.push(`inline markup leaked into the id: ${inline}`)

    // A heading of pure punctuation slugs to nothing; it must be left alone rather than
    // given id="" , which would be a dead anchor and invalid HTML.
    const empty = md.addHeadingIds("<h2>—</h2>")
    if (/id=""/.test(empty)) problems.push(`a punctuation-only heading produced id="": ${empty}`)
    return problems
  })

  /* 6 ── link resolution ---------------------------------------------------- */

  check("resolveHref rewrites in-library links and leaves everything else alone", () => {
    const problems = []
    const from = "docs/60-reference/routes.md"
    const known = (p) => p === "docs/README.md" || p === "docs/00-meta/claims.json" || p === "docs/60-reference/parity.md"

    const eq = (href, expected, label) => {
      const got = md.resolveHref(from, href, known)
      if (got !== expected) problems.push(`${label}: ${href} → ${got}, expected ${expected}`)
    }

    eq("https://example.com/x", "https://example.com/x", "absolute http is untouched")
    eq("mailto:a@b.com", "mailto:a@b.com", "mailto is untouched")
    eq("#anchor", "#anchor", "a bare anchor is untouched")
    eq("../README.md", "/admin/docs?doc=docs%2FREADME.md", "a parent-relative document link")
    eq("./parity.md", "/admin/docs?doc=docs%2F60-reference%2Fparity.md", "a sibling document link")
    eq(
      "../README.md#the-index",
      "/admin/docs?doc=docs%2FREADME.md#the-index",
      "a document link keeps its anchor",
    )

    // THE IMPORTANT ONE. A target the mirror does not hold must come back UNCHANGED, so
    // the link still renders and `tests/docs.mjs`'s own link check keeps its meaning.
    // Swallowing it here would hide a real broken link behind a working-looking page.
    eq("../nope/missing.md", "../nope/missing.md", "an unknown target is returned unchanged")
    eq("/outside.md", "/outside.md", "an unknown absolute target is returned unchanged")

    // Escaping past the repository root must not resolve to something real.
    const escaped = md.resolveHref(from, "../../../etc/passwd", known)
    if (escaped.startsWith("/admin/docs?doc=")) {
      problems.push(`a path escaping the root resolved into the mirror: ${escaped}`)
    }
    return problems
  })

  /* 7 ── every document renders safely -------------------------------------- */

  /**
   * The renderer output goes through `dangerouslySetInnerHTML` in a signed-in session, so
   * this is the one check with a security consequence. It also proves the whole library
   * converts — a document that rendered to raw markdown would look like a wall of `**`.
   */
  check("every document renders, with no executable markup and no unconverted markdown", () => {
    const problems = []
    // POSITIVE CONTROL: renders happen before this check; an empty list would pass.
    if (rendered.length !== docRels.length) {
      return [`rendered ${rendered.length} documents but the tree has ${docRels.length}`]
    }

    let headings = 0
    for (const { path: p, html } of rendered) {
      if (!html.trim()) {
        problems.push(`${p}: rendered to nothing`)
        continue
      }
      headings += (html.match(/<h[1-6][ >]/g) ?? []).length

      // 1. Nothing executable may reach the DOM.
      //
      // ⚠️ URLs are scanned in ATTRIBUTE POSITION, not across the whole text. A document
      // that MENTIONS `javascript:` inside a code span is describing the threat, not
      // committing it, and a prose-wide scan cannot tell the two apart — the same trap
      // `stripCode()` exists for in tests/docs.mjs. It fired here first, on security.md,
      // which is the one document that names the scheme: the code span renders as
      // `<code>javascript:</code>`, and `javascript:` is NOT HTML-escaped inside it, so
      // the whole-text form of this check flagged the document for warning about it.
      if (/<script[\s>/]/i.test(html)) problems.push(`${p}: rendered a <script> tag`)
      if (/<iframe[\s>/]/i.test(html)) problems.push(`${p}: rendered an <iframe>`)
      const dangerous = [...html.matchAll(/\b(?:href|src)\s*=\s*"([^"]*)"/gi)].filter((m) =>
        /^\s*(?:javascript|vbscript):/i.test(m[1]),
      )
      if (dangerous.length) {
        problems.push(`${p}: rendered a dangerous URL — ${dangerous[0][1].slice(0, 40)}`)
      }
      // A handler must sit inside a TAG. `onclick="…"` written in a code span renders as
      // `<code>onclick=&quot;…&quot;</code>`, and `[^>]*` cannot cross the `>` that closes
      // `<code>`, so a prose mention does not match.
      if (/<[^>]*\son[a-z]+\s*=/i.test(html)) {
        problems.push(`${p}: rendered an inline event handler`)
      }

      // 2. No unconverted markdown left over, once code is excluded (fenced blocks are
      //    SUPPOSED to show markdown verbatim).
      const prose = stripCodeBlocks(html)
      if (prose.includes("](")) problems.push(`${p}: an unconverted markdown link survived`)
      if (/^\s*\|.*\|/m.test(prose)) problems.push(`${p}: an unconverted markdown table survived`)
      if (/^\s*\*\*[^*]+\*\*\s*$/m.test(prose)) problems.push(`${p}: an unconverted bold line survived`)
    }

    // POSITIVE CONTROL: a renderer returning "" for every document would pass the loop.
    if (headings < 100) problems.push(`only ${headings} headings across the library — the renderer is not converting`)
    return problems
  })

  /* 8 ── a known document renders its known content ------------------------- */

  /**
   * Checks 7 is a set of absence assertions, and absence assertions pass when nothing
   * renders at all. This one names a document and a heading and requires them.
   */
  check("a named document renders its heading, its tables and its links", () => {
    const problems = []
    const byPath = (p) => rendered.find((r) => r.path === p)

    const index = byPath("docs/README.md")
    if (!index) return ["docs/README.md was not among the rendered documents"]

    // The index's own H1. The doubled hyphen is the point: "Documentation — the index"
    // loses the em dash and keeps BOTH surrounding spaces, which is what GitHub does.
    if (!/<h1 id="documentation--the-index">/.test(index.html)) {
      problems.push("docs/README.md did not render its H1 with the GitHub anchor")
    }
    if (!/<table>/.test(index.html)) {
      problems.push("docs/README.md's index tables did not render as tables")
    }

    // Which links OUGHT to have been rewritten — computed here, from the source and the
    // filesystem, so this does not just re-run resolveHref and agree with itself.
    const dir = path.posix.dirname("docs/README.md")
    const targets = [...sources.get("docs/README.md").matchAll(/\]\(([^)\s]+)\)/g)].map((m) => m[1])
    const resolvable = []
    for (const t of targets) {
      if (/^(https?:|mailto:|#)/.test(t)) continue
      const [p] = t.split("#")
      if (!p || !p.endsWith(".md")) continue
      const resolved = p.startsWith("/") ? p.slice(1) : path.posix.normalize(path.posix.join(dir, p))
      if (sources.has(resolved)) resolvable.push(resolved)
    }
    // POSITIVE CONTROL: if the source shape changed, this loop could find nothing and the
    // assertion below would pass vacuously.
    if (resolvable.length < 20) {
      problems.push(`only ${resolvable.length} resolvable document links found — expected at least 20`)
    }
    const notRewritten = resolvable.filter(
      (r) => !index.html.includes(`doc=${encodeURIComponent(r)}`),
    )
    if (notRewritten.length) {
      problems.push(
        `${notRewritten.length} resolvable link(s) were not rewritten, e.g. ${notRewritten[0]}`,
      )
    }

    // routes.md is the document whose table rendered as literal pipes until a blank line
    // was added above it — assert the table really is a table now.
    const routes = byPath("docs/60-reference/routes.md")
    if (!routes) problems.push("docs/60-reference/routes.md was not among the rendered documents")
    else if (!/<table>/.test(routes.html)) {
      problems.push("routes.md's route tables did not render as tables")
    }
    return problems
  })
}
