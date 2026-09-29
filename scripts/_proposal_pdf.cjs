/**
 * Render the client proposal to a print-ready PDF.
 *
 *   node scripts/_proposal_pdf.cjs
 *
 * WHY A SCRIPT AND NOT A HAND-BUILT PDF. The markdown in docs/ is the source of
 * record; the PDF is a rendering of it, exactly as docs/README.md is rendered to
 * the GitHub wiki. If the two ever disagree, the markdown wins. So this script
 * READS the markdown rather than restating it — a copy of the pricing table
 * living here would be the second copy that always rots
 * (docs/00-meta/conventions.md §4).
 *
 * Pipeline: markdown → marked → a print stylesheet → chromium --headless
 * --print-to-pdf. No new dependency: `marked` is already in the tree, and
 * chromium is the one the repo's browser probes already use.
 *
 * Output goes to .preview/ (gitignored). docs/ holds documents; .preview/ holds
 * generated sheets — the same split the repo already uses for probe output.
 */
const { execFileSync } = require("child_process")
const fs = require("fs")
const path = require("path")

const ROOT = path.join(__dirname, "..")
const SRC = path.join(ROOT, "docs/40-project/proposal-backend-and-lead-handling-2026-09-29.md")
const OUT_DIR = path.join(ROOT, ".preview")
const HTML = path.join(OUT_DIR, "proposal.html")
const PDF = path.join(OUT_DIR, "Call-Indigo-Proposal-Backend-and-Lead-Handling.pdf")

const CHROME =
  process.env.WORKBUDDY_CHROMIUM ||
  "C:/Users/jaden.black/AppData/Local/ms-playwright/chromium-1243/chrome-win64/chrome.exe"

/* ── the document, and the evidence it is the one we think it is ─────────── */

const md = fs.readFileSync(SRC, "utf8")

// The proposal's own front-matter line, so a stale PDF is detectable.
const title = /^# (.+)$/m.exec(md)?.[1] ?? "Proposal"
const verified = /^\*\*Last verified:\*\* (.+)$/m.exec(md)?.[1] ?? "unknown"

// Every relative link in the markdown points at a file inside the repo. In a PDF
// handed to a client those links are unclickable and meaningless, so each is
// rendered as its text plus the path it names, in a small monospace face.
function unlinkForPrint(html) {
  return html.replace(/<a href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/g, (_, href, text) => {
    const external = /^https?:/i.test(href)
    return external
      ? `<span class="ref">${text} (${href})</span>`
      : `<span class="ref">${text} <code>${href}</code></span>`
  })
}

const { marked } = require("marked")
const body = unlinkForPrint(
  marked.parse(md, { gfm: true, breaks: false }),
)

/* ── the print stylesheet ────────────────────────────────────────────────── */

const css = `
  @page { size: A4; margin: 18mm 16mm 20mm; }
  @page :first { margin-top: 16mm; }

  :root {
    --ink: #0f172a;
    --body: #334155;
    --muted: #64748b;
    --line: #e2e8f0;
    --brand: #1e1b4b;
    --accent: #2a5aa2;
    --sky: #0e7490;
    --warn: #b45309;
  }

  * { box-sizing: border-box; }

  html { font-size: 10.5pt; }

  body {
    font-family: "Segoe UI", "Helvetica Neue", Arial, sans-serif;
    color: var(--body);
    line-height: 1.55;
    margin: 0;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  /* ── headings ── */

  h1 {
    font-size: 22pt;
    line-height: 1.15;
    color: var(--brand);
    letter-spacing: -0.02em;
    margin: 0 0 6pt;
    font-weight: 700;
  }

  h1 + p { font-size: 11pt; color: var(--muted); margin-bottom: 14pt; }

  /* The line after the h1 is the front-matter block; let it read as one. */
  h1 + p .ref code { background: #eef2f7; }

  h2 {
    font-size: 13.5pt;
    color: var(--brand);
    margin: 20pt 0 8pt;
    padding-bottom: 4pt;
    border-bottom: 2px solid var(--line);
    letter-spacing: -0.01em;
    break-after: avoid;
    font-weight: 700;
  }

  h3 {
    font-size: 11pt;
    color: var(--ink);
    margin: 14pt 0 5pt;
    break-after: avoid;
    font-weight: 700;
  }

  h2 + p, h3 + p { margin-top: 0; }

  p { margin: 0 0 8pt; }

  strong { color: var(--ink); font-weight: 650; }

  /* ── tables ── */

  table {
    width: 100%;
    border-collapse: collapse;
    margin: 8pt 0 12pt;
    font-size: 9pt;
    break-inside: avoid;
  }

  thead th {
    background: var(--brand);
    color: #fff;
    text-align: left;
    padding: 6pt 8pt;
    font-weight: 600;
    font-size: 8.5pt;
    letter-spacing: 0.02em;
    text-transform: uppercase;
  }

  tbody td {
    padding: 6pt 8pt;
    border-bottom: 1px solid var(--line);
    vertical-align: top;
  }

  tbody tr:nth-child(even) { background: #f8fafc; }

  /* ── blockquotes: this doc's load-bearing warnings live here ── */

  blockquote {
    margin: 10pt 0;
    padding: 8pt 12pt;
    background: #fef6e7;
    border-left: 3pt solid var(--warn);
    break-inside: avoid;
  }

  blockquote p { margin: 0 0 5pt; }
  blockquote p:last-child { margin-bottom: 0; }
  blockquote strong { color: #78350f; }
  blockquote code { background: #fde9c8; }

  /* ── code ── */

  code {
    font-family: "Cascadia Mono", Consolas, monospace;
    font-size: 0.86em;
    background: #f1f5f9;
    padding: 1pt 3pt;
    border-radius: 2pt;
    color: var(--sky);
  }

  pre {
    background: #0f172a;
    color: #e2e8f0;
    padding: 9pt 11pt;
    border-radius: 4pt;
    font-size: 8.2pt;
    line-height: 1.4;
    overflow: hidden;
    break-inside: avoid;
    margin: 8pt 0 12pt;
  }

  pre code {
    background: none;
    color: inherit;
    padding: 0;
    font-size: 1em;
  }

  /* ── lists ── */

  ul, ol { margin: 0 0 8pt; padding-left: 16pt; }
  li { margin-bottom: 3pt; }
  li > p { margin-bottom: 3pt; }

  /* ── the inline reference spans that replace links ── */

  .ref { color: var(--ink); white-space: nowrap; }
  .ref code {
    background: #eef2f7;
    color: #475569;
    font-size: 0.88em;
    border-radius: 2pt;
    padding: 0 2pt;
  }

  /* ── rules ── */

  hr {
    border: none;
    border-top: 1px solid var(--line);
    margin: 16pt 0;
  }

  /* A heading at the top of a fresh column/page must not be orphaned. */
  h2, h3 { break-inside: avoid; }
`

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${title}</title>
<style>${css}</style>
</head>
<body>
<main>${body}</main>
</body>
</html>
`

fs.mkdirSync(OUT_DIR, { recursive: true })
fs.writeFileSync(HTML, html, "utf8")

// Write with LF, not the platform default — this repo counts bytes, and a CRLF
// surprise is a real defect it has been bitten by before.
fs.writeFileSync(HTML, html.replace(/\r\n/g, "\n"), { encoding: "utf8" })

if (!fs.existsSync(CHROME)) {
  console.error(`chromium not found at:\n  ${CHROME}\nset WORKBUDDY_CHROMIUM to override`)
  process.exit(2)
}

execFileSync(CHROME, [
  "--headless",
  "--disable-gpu",
  "--no-sandbox",
  "--no-pdf-header-footer",
  `--print-to-pdf=${PDF}`,
  `file:///${HTML.replace(/\\/g, "/")}`,
], { stdio: ["ignore", "ignore", "pipe"], timeout: 120000 })

if (!fs.existsSync(PDF)) {
  console.error("chromium exited without writing the PDF")
  process.exit(3)
}

const kb = (fs.statSync(PDF).size / 1024).toFixed(1)
console.log(`source   ${path.relative(ROOT, SRC).replace(/\\/g, "/")}`)
console.log(`html     ${path.relative(ROOT, HTML).replace(/\\/g, "/")}`)
console.log(`pdf      ${path.relative(ROOT, PDF).replace(/\\/g, "/")}  (${kb} kB)`)
console.log(`verified ${verified}`)
