#!/usr/bin/env node
/**
 * _wiki_sync.cjs — generate the GitHub wiki from docs/ and push it.
 *
 * The wiki is a MIRROR, never a source. Every page it writes carries the source
 * path, the source commit and a do-not-edit-here banner, and an edit made in the
 * wiki UI is overwritten at the next sync. That is the whole design: a hand-kept
 * wiki would be a second copy of the documentation, outside the repo, where no
 * test can reach it — and this repo's founding rule is "where the repo and a
 * document disagree, the repo wins and the document is the bug".
 * See docs/plan-docs-refactor-2026-09-27.md §4 P4 and
 * docs/prd/phase-4-wiki-publication.md.
 *
 * ── STATUS: NOT YET RUN END-TO-END ────────────────────────────────────────────
 * GitHub does not create the `<repo>.wiki.git` repository until a first page
 * exists, and there is no API to create one. Until that page is created in the
 * web UI this script exits 1 at the preflight below, by design. It has therefore
 * NOT been executed against a live wiki. Do not treat a green run as verified
 * until it has been (docs/development/standards.md §1).
 *
 * Usage:
 *   node scripts/_wiki_sync.cjs            # generate, commit and push
 *   node scripts/_wiki_sync.cjs --dry-run  # generate into .preview/wiki-clone, no push
 */

const { execFileSync } = require("child_process")
const fs = require("fs")
const path = require("path")

const ROOT = path.resolve(__dirname, "..")
const DOCS = path.join(ROOT, "docs")
const CLONE = path.join(ROOT, ".preview", "wiki-clone")
const REPO = "indigo-services/call-indigo"
const WIKI_URL = `https://github.com/${REPO}.wiki.git`
const DRY = process.argv.includes("--dry-run")

const git = (args, cwd = ROOT) =>
  execFileSync("git", args, { cwd, encoding: "utf8" }).trim()

// HEAD without spawning git. Some sandboxes refuse process creation outright
// [measured: execFileSync('git', ['--version']) -> EBUSY], and a generator that
// cannot read the SHA cannot stamp a page. Falls back to reading the .git
// directory, which is a plain file read and needs no child process.
function headSha() {
  try {
    return git(["rev-parse", "--short", "HEAD"])
  } catch {
    /* fall through to the .git read */
  }
  const head = fs.readFileSync(path.join(ROOT, ".git", "HEAD"), "utf8").trim()
  const ref = head.match(/^ref:\s*(.+)$/)
  if (!ref) return head.slice(0, 7)
  const loose = path.join(ROOT, ".git", ref[1])
  if (fs.existsSync(loose)) return fs.readFileSync(loose, "utf8").trim().slice(0, 7)
  const packed = path.join(ROOT, ".git", "packed-refs")
  if (fs.existsSync(packed)) {
    for (const line of fs.readFileSync(packed, "utf8").split("\n")) {
      const [sha, name] = line.split(" ")
      if (name && name.trim() === ref[1]) return sha.slice(0, 7)
    }
  }
  throw new Error("cannot resolve HEAD without git")
}

// ── The page set ─────────────────────────────────────────────────────────────
// Every .md under docs/, except the index (which becomes Home).
function collect() {
  const out = []
  ;(function walk(dir) {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name)
      if (e.isDirectory()) walk(p)
      else if (e.name.endsWith(".md")) out.push(p)
    }
  })(DOCS)
  return out.sort()
}

// docs/development/standards.md -> "development-standards"
// docs/README.md               -> "Home"
function pageName(abs) {
  const rel = path.relative(DOCS, abs).split(path.sep).join("/")
  if (rel === "README.md") return "Home"
  return rel.replace(/\.md$/, "").replace(/\//g, "-")
}

// ── Link rewriting ───────────────────────────────────────────────────────────
// Relative .md links become wiki page names. Links to files outside docs/ (the
// root README, PRD.md, CHANGELOG.md, tests/, archive/) become GitHub URLs, because
// Phase 4 §7 Q4 decided not to mirror a 900-line document into a wiki page.
function rewriteLinks(src, fromAbs, pageOf, sha) {
  const dir = path.dirname(fromAbs)
  const ghBase = `https://github.com/${REPO}/blob/${sha}`

  const fix = (target) => {
    if (/^(https?:|mailto:|#)/.test(target)) return target
    const hash = target.indexOf("#")
    const anchor = hash === -1 ? "" : target.slice(hash)
    const bare = hash === -1 ? target : target.slice(0, hash)
    if (!bare) return target

    const abs = path.resolve(dir, decodeURIComponent(bare))
    if (pageOf.has(abs)) return `${pageOf.get(abs)}${anchor}`
    if (fs.existsSync(abs) && abs.startsWith(ROOT)) {
      const rel = path.relative(ROOT, abs).split(path.sep).join("/")
      return `${ghBase}/${rel}${anchor}`
    }
    return target // leave it; the caller reports it
  }

  // Do not rewrite inside fenced code blocks — a regex over the whole file would.
  const lines = src.split("\n")
  let fenced = false
  return lines
    .map((line) => {
      if (/^\s*(```|~~~)/.test(line)) {
        fenced = !fenced
        return line
      }
      if (fenced) return line
      return line.replace(/(\[[^\]]*\]\()([^)\s]+)(\))/g, (_, a, t, c) => a + fix(t) + c)
    })
    .join("\n")
}

// ── Preflight ────────────────────────────────────────────────────────────────
function preflight() {
  try {
    git(["ls-remote", WIKI_URL, "HEAD"])
    return true
  } catch {
    console.error(
      [
        "",
        "  ✖ The wiki repository does not exist yet.",
        "",
        "    GitHub does not create <repo>.wiki.git until a first page exists, and",
        "    there is no API to create one. This is a one-time manual step.",
        "",
        "    1. Open  https://github.com/" + REPO + "/wiki",
        "    2. Click \"Create the first page\" and save it with any content.",
        "    3. Re-run this script — it will replace that page.",
        "",
      ].join("\n"),
    )
    return false
  }
}

// ── Main ─────────────────────────────────────────────────────────────────────
function main() {
  if (!DRY && !preflight()) process.exit(1)

  const sha = headSha()
  const today = new Date().toISOString().slice(0, 10)

  const files = collect()
  const pageOf = new Map(files.map((f) => [f, pageName(f)]))

  // A collision would silently overwrite one document with another.
  const seen = new Map()
  for (const [, name] of pageOf) {
    if (seen.has(name)) {
      console.error(`  ✖ page-name collision: "${name}"`)
      process.exit(1)
    }
    seen.set(name, true)
  }

  // The loop below clears everything except .git, so a --dry-run leaves the
  // clone's repository intact — which is what lets a generate-only pass be
  // followed by a manual commit and push.
  fs.mkdirSync(path.dirname(CLONE), { recursive: true })
  if (!fs.existsSync(CLONE)) {
    try {
      git(["clone", WIKI_URL, CLONE])
    } catch (e) {
      // A dry-run must work before the wiki exists — that is its whole point.
      if (!DRY) throw e
      fs.mkdirSync(CLONE, { recursive: true })
    }
  }

  // Replace the wiki's contents wholesale — the wiki is derived, not merged.
  for (const e of fs.readdirSync(CLONE)) {
    if (e === ".git") continue
    fs.rmSync(path.join(CLONE, e), { recursive: true, force: true })
  }

  let written = 0
  const titles = new Map()
  for (const f of files) {
    const name = pageOf.get(f)
    const rel = path.relative(ROOT, f).split(path.sep).join("/")
    const banner =
      `<!-- GENERATED by scripts/_wiki_sync.cjs — do not edit this page. -->\n` +
      `> **Generated from [\`${rel}\`](${`https://github.com/${REPO}/blob/${sha}/${rel}`}) ` +
      `at \`${sha}\` on ${today}.** Edit the source file in the repository — this page ` +
      `is overwritten at the next sync.\n\n---\n\n`

    const raw = fs.readFileSync(f, "utf8")
    const body = rewriteLinks(raw, f, pageOf, sha)
    // The document's own H1 is a better sidebar label than the slug.
    titles.set(name, (raw.match(/^#\s+(.+)$/m) || [, name])[1].trim())
    fs.writeFileSync(path.join(CLONE, `${name}.md`), banner + body, "utf8")
    written++
  }

  // Sidebar, in the order the index presents the domains.
  const order = ["development", "prd", "plan-", ""]
  const rank = (n) => {
    if (n === "Home") return -1
    const i = order.findIndex((p) => n.startsWith(p))
    return i === -1 ? order.length : i
  }
  fs.writeFileSync(
    path.join(CLONE, "_Sidebar.md"),
    "**Call Indigo — documentation**\n\n" +
      [...pageOf.values()]
        .sort((a, b) => rank(a) - rank(b) || a.localeCompare(b))
        .map((n) => `- [${titles.get(n) ?? n}](${n})`)
        .join("\n") +
      "\n\n---\n\n[Repository](https://github.com/" +
      REPO +
      ")\n",
    "utf8",
  )

  console.log(`  ✓ ${written} pages + _Sidebar written to ${path.relative(ROOT, CLONE)}`)

  if (DRY) {
    console.log("  --dry-run: not committing, not pushing")
    return
  }

  git(["add", "-A"], CLONE)
  try {
    git(["diff", "--cached", "--quiet"], CLONE)
    console.log("  = wiki already up to date; nothing to push")
    return
  } catch {
    /* changes staged — fall through */
  }
  git(["-c", "user.name=Indigo Services", "-c", "user.email=indigobuildops@gmail.com",
       "commit", "-q", "-m", `docs(wiki): sync from ${sha}`], CLONE)
  git(["push", "origin", "HEAD"], CLONE)
  console.log(`  ✓ pushed — synced from ${sha}`)
}

main()
