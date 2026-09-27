/**
 * docs — the documentation library, asserted rather than reviewed.
 *
 * WHY THIS SUITE EXISTS. Four documents in this repository asserted things the tree
 * contradicted, and every one of them survived because **nothing could see it**:
 *
 *   1. README.md said /admin had no authentication. The guard scanned `src/` only.
 *   2. Two documents said "67 checks" for 60 checks' worth of releases. No producer.
 *   3. docs/README.md said there was no automated suite, 50 lines above describing it.
 *   4. src/admin/routes.ts described a redirect the router does not have.
 *
 * The shape is the same every time: *an assertion that cannot see the thing it claims
 * to check passes forever.* This suite is the thing that can see them.
 *
 * NEGATIVE CONTROLS. Every check here has been run against a fixture containing the
 * defect and confirmed to fail. A check that has only ever seen the correct input is a
 * claim, not a guard. See docs/20-development/patterns.md P1.
 *
 * WHAT THIS SUITE FOUND WHILE BEING WRITTEN — kept as evidence that it is not vacuous:
 *   • tests/policy.mjs read a hard-coded `docs/component-exceptions.md`, which the
 *     restructure moved. The move was safe *because* that check failed loudly.
 *   • Four links in the devlog resolved two directories too shallow. Three were dead;
 *     one (`../README.md`) resolved to the WRONG BUT EXISTING file, which no link
 *     checker can catch — only reading the target can. See the note in check 4.
 */
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs"
import path from "node:path"
import { ROOT, check, suite } from "./harness.mjs"

const DOCS = path.join(ROOT, "docs")

/* ── helpers ─────────────────────────────────────────────────────────────── */

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
 * Blank out fenced code blocks and inline code spans before scanning prose.
 *
 * This is the trap that has produced six false results in this project already: a
 * string inside a comment or a code sample matches a scan meant to find an assertion.
 * `tests/harness.mjs` strips comments for the same reason.
 *
 * ⚠️ IT PRESERVES LINE STRUCTURE — every blanked character becomes a space, and
 * newlines are kept. A version that collapsed a fenced block to a single space shifted
 * every subsequent line index, which silently mis-attributed a producer on line N to a
 * claim on line N+40. That produced 13 false positives on the first run.
 */
function stripCode(src) {
  const blank = (m) => m.replace(/[^\n]/g, " ")
  return src
    .replace(/```[\s\S]*?```/g, blank)
    .replace(/~~~[\s\S]*?~~~/g, blank)
    .replace(/`[^`\n]*`/g, blank)
}

const KIND_INLINE = /^\*\*Kind:\*\* *([A-Za-z]+)/
const KIND_TABLE = /^\|\s*\*\*Kind\*\*\s*\|\s*\*\*([A-Za-z]+)\*\*/

/** The kind a document declares for itself, or null. */
function declaredKind(src) {
  for (const line of src.split("\n").slice(0, 14)) {
    const m = KIND_INLINE.exec(line) || KIND_TABLE.exec(line)
    if (m) return m[1].toLowerCase()
  }
  return null
}

const isTemplate = (r) => r.includes("/templates/")
const isIndex = (r) => path.basename(r) === "README.md"

/** Every relative markdown link target in a document, outside code. */
function linksIn(src) {
  const out = []
  for (const m of stripCode(src).matchAll(/\]\(([^)\s]+)\)/g)) out.push(m[1])
  return out
}

/* ── the suite ───────────────────────────────────────────────────────────── */

export function run() {
  const all = walk(DOCS).filter((f) => f.endsWith(".md"))
  const rels = all.map(rel).sort()
  const sources = new Map(all.map((f) => [rel(f), read(f)]))
  const indexPath = "docs/README.md"
  const index = sources.get(indexPath)

  suite("Documentation — the library (docs/00-meta/conventions.md)", "docs/**/*.md")

  /* 1 ── every document declares its kind ---------------------------------- */

  check("every document declares its kind, and the kind is one of the four", () => {
    const problems = []
    const VALID = new Set(["derived", "dated", "living"])
    for (const r of rels) {
      const src = sources.get(r)
      const kind = declaredKind(src)
      if (isTemplate(r)) {
        // A template shows an EXAMPLE front matter; `**Kind:** dated` inside it is part
        // of the sample, not a declaration. Exempt — but the positive control below
        // stops this exemption from silently swallowing the whole tree.
        if (kind !== "dated") {
          problems.push(`${r}: expected the template sample to show 'dated', found ${kind}`)
        }
        continue
      }
      if (isIndex(r)) continue // an index declares itself in the index table
      if (!kind) {
        problems.push(`${r}: no '**Kind:**' line in the first 14 lines`)
      } else if (!VALID.has(kind)) {
        problems.push(`${r}: kind '${kind}' is not one of derived | dated | living`)
      }
    }
    // POSITIVE CONTROL — a check that returns [] for everything "passes". Assert the
    // denominator rather than hard-coding it, so adding a document cannot silently
    // exempt it: an earlier draft hard-coded `rels.length - 8`, which was wrong the
    // moment a ninth README was added.
    const indexCount = rels.filter(isIndex).length
    const checked = rels.length - indexCount
    if (indexCount === 0 || checked < 20) {
      problems.push(
        `${rels.length} documents, ${indexCount} indexes, ${checked} checked — the walk or the isIndex test has drifted`,
      )
    }
    return problems
  })

  /* 2 ── a dated document carries its date -------------------------------- */

  check("every dated document carries a 'Last verified:' line", () => {
    const problems = []
    // Two accepted shapes: an inline `**Last verified:** 2026-09-27 at <sha>`, and the
    // table row third-party-assets.md uses (`| **Last verified** | … |`). Accepting only
    // the colon form flagged that document as a defect when it was correct.
    const HAS_DATE = /Last verified:|\*\*Last verified\*\*/
    let dated = 0
    for (const r of rels) {
      if (isTemplate(r) || isIndex(r)) continue
      const src = sources.get(r)
      if (declaredKind(src) !== "dated") continue
      dated += 1
      if (!HAS_DATE.test(src)) {
        problems.push(`${r}: dated, but no 'Last verified:' line`)
      }
    }
    // POSITIVE CONTROL: a suite that found no dated documents would pass vacuously.
    if (dated < 10) problems.push(`only ${dated} dated documents found — expected at least 10`)
    return problems
  })

  /* 3 ── the index lists every document exactly once ---------------------- */

  check("every document appears in docs/README.md exactly once", () => {
    const problems = []
    const hrefs = linksIn(index)
      .filter((h) => h.startsWith("./"))
      .map((h) => "docs/" + h.slice(2).split("#")[0])

    const counts = new Map()
    for (const h of hrefs) counts.set(h, (counts.get(h) ?? 0) + 1)

    for (const r of rels) {
      if (r === indexPath) continue // the front door does not link to itself
      const n = counts.get(r) ?? 0
      if (n === 0) problems.push(`${r}: not listed in the index`)
      else if (n > 1) problems.push(`${r}: listed ${n} times in the index (expected once)`)
    }

    // POSITIVE CONTROL: assert the denominator, so a broken link regex cannot pass.
    // Count only keys that are documents — the index also links `claims.json`, which is
    // a file in the library but not a markdown document, so a naive count reads 54 vs 53.
    const linkedDocs = [...counts.keys()].filter((k) => rels.includes(k) && k !== indexPath)
    if (linkedDocs.length !== rels.length - 1) {
      problems.push(
        `the index links ${linkedDocs.length} distinct documents; the tree has ${rels.length - 1} (excluding the index)`,
      )
    }
    return problems
  })

  /* 4 ── every relative link resolves ------------------------------------- */

  check("every relative link in every document resolves to a real file", () => {
    const problems = []
    let scanned = 0
    for (const r of rels) {
      const abs = path.join(ROOT, r)
      for (const href of linksIn(sources.get(r))) {
        if (/^(https?:|mailto:|#)/.test(href)) continue
        if (!href.startsWith("./") && !href.startsWith("../")) continue
        const target = path.resolve(path.dirname(abs), href.split("#")[0])
        scanned += 1
        if (!existsSync(target)) problems.push(`${r} → ${href} (does not exist)`)
      }
    }
    // POSITIVE CONTROL: a link regex that matched nothing would otherwise pass.
    if (scanned < 150) {
      problems.push(`only ${scanned} relative links scanned — expected at least 150`)
    }
    // ⚠️ LIMIT, stated so it is not mistaken for coverage: this check proves a target
    // EXISTS, not that it is the RIGHT file. A link written two directories too shallow
    // resolves to a real sibling and passes. That happened four times in this refactor
    // and was caught by reading the file, not by this check. Tightening it would mean
    // asserting the link TEXT against the target's H1, which is worth doing and is
    // tracked in docs/40-project/tasks.md.
    return problems
  })

  /* 5 ── the generated map is current ------------------------------------ */

  check("doc-map.md is current and complete", () => {
    const problems = []
    const mapPath = "docs/00-meta/doc-map.md"
    if (!sources.has(mapPath)) return [`${mapPath} is missing`]
    const map = sources.get(mapPath)

    const rows = []
    for (const line of map.split("\n")) {
      const m = /^\| \[`([^`]+)`\]\(\.\.\/([^)]+)\) \| ([a-z]+) \| /.exec(line)
      if (m) rows.push({ label: m[1], href: m[2], kind: m[3] })
    }

    const listed = new Set(rows.map((r) => "docs/" + r.href))
    for (const r of rels) {
      if (!listed.has(r)) problems.push(`${r}: missing from doc-map.md`)
    }
    for (const row of rows) {
      const r = "docs/" + row.href
      if (!sources.has(r)) {
        problems.push(`doc-map.md lists ${row.href}, which does not exist`)
        continue
      }
      const declared = isTemplate(r) ? "template" : isIndex(r) ? "index" : declaredKind(sources.get(r))
      if (declared && row.kind !== declared) {
        problems.push(`doc-map.md says ${row.href} is '${row.kind}'; the document declares '${declared}'`)
      }
    }

    // POSITIVE CONTROL: the row count must equal the tree.
    if (rows.length !== rels.length) {
      problems.push(`doc-map.md has ${rows.length} rows; the tree has ${rels.length} documents`)
    }
    return problems
  })

  /* 6 ── the index's own count is living --------------------------------- */

  check("the document count in the index matches the tree", () => {
    const m = /\*\*(\d+)\s+documents\*\*/.exec(index)
    if (!m) return ["docs/README.md no longer states a document count — if that is deliberate, delete this check"]
    const claimed = Number(m[1])
    if (claimed !== rels.length) {
      return [
        `docs/README.md claims ${claimed} documents; the tree holds ${rels.length}`,
        `  producer: find docs -name '*.md' | wc -l`,
      ]
    }
    return []
  })

  /* 7 ── the claim registry ---------------------------------------------- */

  check("claims.json is valid, non-empty, and every entry names a producer", () => {
    const p = path.join(DOCS, "00-meta", "claims.json")
    if (!existsSync(p)) return ["docs/00-meta/claims.json is missing"]
    let reg
    try {
      reg = JSON.parse(read(p))
    } catch (e) {
      return [`claims.json does not parse: ${e.message}`]
    }
    const problems = []
    if (!Array.isArray(reg.claims) || reg.claims.length < 10) {
      return [`claims.json holds ${reg.claims?.length ?? 0} claims — expected at least 10`]
    }
    const ids = new Set()
    for (const c of reg.claims) {
      for (const field of ["id", "claim", "kind", "producer"]) {
        if (!c[field]) problems.push(`claims.json: entry '${c.id ?? "(no id)"}' is missing '${field}'`)
      }
      if (ids.has(c.id)) problems.push(`claims.json: duplicate id '${c.id}'`)
      ids.add(c.id)
      if (!["derived", "command", "policy"].includes(c.kind)) {
        problems.push(`claims.json: '${c.id}' has kind '${c.kind}'`)
      }
      // The whole point of the registry: a producer is a COMMAND, not a value.
      if (c.producer && /^\s*\d/.test(c.producer)) {
        problems.push(`claims.json: '${c.id}' names a value where a producer belongs`)
      }
    }
    return problems
  })

  /* 8 ── no LIVING document asserts a check count ------------------------ */

  check("no living document asserts a check count", () => {
    const problems = []
    // SCOPE, and why it changed on 2026-09-27.
    //
    // This check used to permit a count as long as it named a producer, and it scanned
    // the root README alongside the living documents. Both halves were wrong in the
    // same way. Measured: `docs/00-meta/conventions.md` and
    // `docs/20-development/patterns.md` — one of them the canonical EXAMPLE of this
    // very rule — both stated a count beside `npm run test:only` for a milestone after
    // the suite had moved on. They passed, because a producer beside a number is not
    // evidence; it is a promise that nothing re-derives. That is the same sub-shape as
    // the README's own count, which is why the README is now handled by
    // `tests/run.mjs` instead — it is the ONE document whose count is compared against
    // the run, so it is the one document allowed to state one.
    //
    // A LIVING document has no date, so a count in it is a claim about *now* that
    // nothing can expire. It must state no value at all: point at the command.
    //
    // A DATED document may state the count as of its date — that is what the date is
    // for, and the plan and PRD documents legitimately record "100 checks" and
    // "107 checks" as history.
    //
    // THE SIGNAL IS THE BOLD. `stripCode` blanks backticked spans, so the legitimate
    // historical quotations ("`67 checks` for 60 checks' worth of releases") are gone
    // before the scan, while an assertion is written bold.
    // ⚠️ LIMIT, stated so it is not mistaken for coverage: an UNBOLDED count in a
    // living document — a bare table cell, say — is not caught. Tightening it means
    // separating an assertion from narrative prose, and the narrative uses the same
    // words ("stayed wrong for 60 checks"). Two such cells were found by hand on
    // 2026-09-27 and fixed; the bold form is the one that recurs.
    // A COMPLETE bold span — BOTH delimiters required.
    //
    // The first draft matched a bare `**` followed by digits anywhere on the line, which
    // reads the CLOSING delimiter of a bold run as an opening one. It flagged
    // `**Paid for it:** two documents stated `67 checks` for 60 checks' worth …` — the
    // closing `**` after "it:" is indistinguishable from an opener, and "60 checks"
    // follows later on the same line. Measured on the first run of this check.
    const ASSERT = /\*\*[^*\n]*\d+\+?\s+checks[^*\n]*\*\*/i
    const targets = rels.filter(
      (r) => !isIndex(r) && !isTemplate(r) && declaredKind(sources.get(r)) === "living",
    )

    let lines = 0
    for (const r of targets) {
      const rawLines = sources.get(r).split("\n")
      const bareLines = stripCode(sources.get(r)).split("\n")
      for (let i = 0; i < bareLines.length; i += 1) {
        lines += 1
        if (!ASSERT.test(bareLines[i])) continue
        problems.push(
          `${r}: a living document asserts a check count — "${rawLines[i].trim().slice(0, 90)}" (point at \`npm run test:only\` instead)`,
        )
      }
    }
    // POSITIVE CONTROLS: prove the scan reached living documents, and enough of them.
    if (targets.length < 5) {
      problems.push(`only ${targets.length} living documents scanned — expected at least 5`)
    }
    if (lines < 400) problems.push(`only ${lines} lines scanned — expected at least 400`)
    return problems
  })

  /* 9 ── the stale claims cannot come back ------------------------------ */

  check("the root README does not re-assert the claims the tree contradicts", () => {
    const readme = read(path.join(ROOT, "README.md"))
    const problems = []
    // F1 — the README said there was no authentication, for a day after the gate shipped.
    // F3 — docs/README.md said there was no automated suite, above a description of it.
    // F2 — a bare current check count.
    // F8 — the README said LICENSE was missing, after it was added.
    const STALE = [
      { re: /\*\*No authentication\.\*\*/, what: "F1 — says /admin has no authentication" },
      { re: /There is no automated suite yet/, what: "F3 — says there is no automated suite" },
      { re: /\b67 checks\b/, what: "F2 — the 60-releases-stale check count" },
      { re: /no `LICENSE` file in this repository yet/, what: "F8 — says LICENSE is missing" },
    ]
    for (const { re, what } of STALE) {
      if (re.test(readme)) problems.push(`README.md: ${what}`)
    }
    // POSITIVE CONTROL: if the README shrank to nothing, every rule above would pass.
    if (readme.length < 3000) problems.push(`README.md is only ${readme.length} bytes — did it get truncated?`)
    return problems
  })

  /* 10 ── the toolchain pins agree --------------------------------------- */

  check("the pinned Node version agrees across .nvmrc, .node-version and package.json engines", () => {
    const nvmrc = path.join(ROOT, ".nvmrc")
    const nodeVersion = path.join(ROOT, ".node-version")
    const problems = []
    if (!existsSync(nvmrc)) problems.push(".nvmrc is missing")
    if (!existsSync(nodeVersion)) problems.push(".node-version is missing")
    if (problems.length) return problems

    const a = read(nvmrc).trim()
    const b = read(nodeVersion).trim()
    if (a !== b) problems.push(`.nvmrc says '${a}', .node-version says '${b}'`)

    const pkg = JSON.parse(read(path.join(ROOT, "package.json")))
    const engine = pkg.engines?.node
    if (!engine) {
      problems.push("package.json has no engines.node")
    } else if (!/\b22\b/.test(engine) && !/22\./.test(engine)) {
      // The pin must be inside the declared range. A cheap sanity check, not a semver solver.
      problems.push(`.nvmrc pins ${a}, which the engines range '${engine}' may not satisfy`)
    }
    return problems
  })

  /* 11 ── the hygiene set exists ----------------------------------------- */

  check("the production-hygiene files exist", () => {
    const REQUIRED = [
      "LICENSE",
      "CONTRIBUTING.md",
      "SECURITY.md",
      "CODE_OF_CONDUCT.md",
      "THIRD-PARTY-NOTICES.md",
      ".editorconfig",
      ".nvmrc",
      ".node-version",
      ".github/CODEOWNERS",
      ".github/PULL_REQUEST_TEMPLATE.md",
      ".github/dependabot.yml",
      ".github/workflows/ci.yml",
      ".github/ISSUE_TEMPLATE/bug_report.md",
      ".github/ISSUE_TEMPLATE/feature_request.md",
      ".github/ISSUE_TEMPLATE/config.yml",
    ]
    const problems = REQUIRED.filter((f) => !existsSync(path.join(ROOT, f))).map(
      (f) => `missing: ${f}`,
    )
    // POSITIVE CONTROL: assert the count, so a broken path base cannot pass.
    if (REQUIRED.length !== 15) problems.push(`expected 15 hygiene paths, listed ${REQUIRED.length}`)
    return problems
  })

  /* 12 ── the generators are present and can detect staleness ------------ */

  check("the documentation generators are present and can detect staleness", () => {
    const GENERATORS = ["scripts/_wiki_sync.cjs", "scripts/_routes_doc.cjs", "scripts/_doc_map.cjs"]
    const problems = []
    for (const g of GENERATORS) {
      const abs = path.join(ROOT, g)
      if (!existsSync(abs)) problems.push(`missing: ${g}`)
      else if (!/--check|--dry-run/.test(read(abs))) {
        problems.push(`${g}: no --check/--dry-run mode, so staleness cannot be detected`)
      }
    }
    return problems
  })

  /* 13 ── source references to documents resolve -------------------------- */

  check("every docs/ path referenced from src/ or scripts/ resolves", () => {
    const problems = []
    // SCOPE: `src/` and `scripts/` only.
    //
    // `tests/` is excluded deliberately. The header of this very file quotes the OLD
    // flat path when it explains why the restructure was safe, and that quotation is
    // history rather than a reference. A scan that cannot tell the two apart has to
    // be loosened until it sees nothing, which is how a guard stops being one.
    //
    // Why it exists: the restructure moved four documents into numbered domains and
    // left six references behind — `docs/component-exceptions.md` among them, which
    // `src/admin/ComponentsPage.tsx` renders to the operator in the dashboard UI. All
    // six were found by hand, and a hand is not a guard.
    const PATH_RE = /docs\/[A-Za-z0-9_./-]*\.(?:md|json)/g
    let scanned = 0
    for (const root of ["src", "scripts"]) {
      for (const f of walk(path.join(ROOT, root))) {
        if (!/\.(?:tsx?|jsx?|cjs|mjs|py|sh)$/.test(f)) continue
        for (const m of read(f).matchAll(PATH_RE)) {
          scanned += 1
          if (!existsSync(path.join(ROOT, m[0]))) {
            problems.push(`${rel(f)} → ${m[0]} (does not exist)`)
          }
        }
      }
    }
    // POSITIVE CONTROL: a regex that matched nothing would pass vacuously.
    if (scanned < 10) {
      problems.push(`only ${scanned} docs/ references scanned — expected at least 10`)
    }
    return problems
  })
}
