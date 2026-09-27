/**
 * Markdown → HTML for the docs mirror.
 *
 * WHY THIS MODULE IS SEPARATE FROM `content.ts`, AND PURE.
 *
 * `content.ts` calls `import.meta.glob`, which only exists under Vite. The verification
 * suite bundles modules with the `esbuild` inside `vite` (`tests/harness.mjs`) and never
 * runs Vite's transform, so anything importing `content.ts` cannot be loaded by a test —
 * `import.meta.glob` would be `undefined` at module load.
 *
 * So the parts worth asserting live here, with **no Vite-specific API and no I/O**: the
 * slugger, the link resolver, and the renderer, which takes its source as an argument
 * instead of fetching it. `tests/docs-mirror.mjs` exercises all three directly.
 *
 * WHY A PACKAGE AND NOT A PARSER.
 *
 * The first draft of this mirror hand-rolled a markdown subset — headings, tables, code,
 * lists, inline spans. That was the weakest part of the design: markdown is deceptively
 * hard (escaped pipes inside table cells, links containing parentheses, `_underscore_`
 * runs that are not emphasis), and this repository has already paid twice for a
 * hand-rolled scanner being subtly wrong. `marked` is MIT, ~12 kB gzipped, and is
 * **imported dynamically**, so it lands in its own chunk and is fetched only when an
 * operator actually opens the docs page. It is registered in `THIRD-PARTY-NOTICES.md`.
 *
 * WHAT THIS DELIBERATELY DOES NOT DO.
 *
 * - **No sanitising.** The input is first-party markdown from this repository, which is
 *   already public, and `marked` does not sanitise by default. The output goes through
 *   `dangerouslySetInnerHTML`, which is the second such seam in the tree — `security.md`
 *   §3 named it as the only one, and now names both. `tests/docs-mirror.mjs` asserts the
 *   rendered library contains no `<script` and no `on…=` attribute, so a document cannot
 *   introduce one by being pasted in.
 * - **No GitHub-exact heading slugs.** The slugger below matches GitHub for words,
 *   numbers, punctuation and underscores, but not for emoji and not for duplicate headings.
 *   The two details that DO matter — and were wrong until the suite pinned them — are
 *   documented on `slugify` itself. A mismatch costs a failed scroll, never a wrong page.
 */

/**
 * GitHub-style heading slug.
 *
 * ⚠️ TWO DETAILS THAT ARE NOT COSMETIC, because the same markdown is published to the
 * GitHub wiki: an anchor written for the wiki has to work in the mirror too.
 *
 *   · **Each whitespace character becomes a hyphen — runs are NOT collapsed.** GitHub
 *     maps `\s` one-for-one, so a heading like `§5.2 — deviations` slugs to
 *     `52--deviations`, not `52-deviations`: removing the em dash leaves two spaces, and
 *     both survive as hyphens. Collapsing them would break every wiki anchor pointing at
 *     a heading that contains a dash.
 *   · **`_` is kept.** GitHub removes punctuation but keeps underscores.
 *
 * Both were wrong until `tests/docs-mirror.mjs` pinned them, and the docstring claimed the
 * function matched GitHub. It did not.
 *
 * KNOWN REMAINING DIFFERENCES, deliberately not chased: emoji lose their variation
 * selector, and duplicate headings are not disambiguated with `-1`. Both cost a failed
 * scroll rather than a wrong page — and note that **`tests/docs.mjs` never verified an
 * anchor in the first place**, so this is no worse than the tree already is.
 */
export function slugify(text: string): string {
  return text
    .replace(/<[^>]*>/g, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s_-]/gu, "")
    .trim()
    .replace(/\s/g, "-")
}

/**
 * Add `id` to every heading, so in-document `#anchor` links resolve.
 *
 * Matching `<h1>` with no attributes is deliberate: it means a heading that already
 * carries an id is left alone rather than given a second one. Headings inside fenced code
 * blocks are HTML-escaped by the renderer (`<h1>` becomes `&lt;h1&gt;`), so they cannot
 * match here — which is why this is safe as a post-pass over the output.
 */
export function addHeadingIds(html: string): string {
  return html.replace(/<h([1-6])>([\s\S]*?)<\/h\1>/g, (whole, level: string, inner: string) => {
    const id = slugify(inner)
    return id ? `<h${level} id="${id}">${inner}</h${level}>` : whole
  })
}

/**
 * Resolve a relative markdown href, as written inside a document, to a dashboard URL.
 *
 * A link to another document becomes an in-app link to that document's view; an anchor
 * stays an anchor; anything absolute is left alone. A link to a file the mirror does not
 * hold is returned **unchanged**, so a broken link renders as a link rather than silently
 * vanishing — `tests/docs.mjs` already asserts every link in the library resolves, and
 * this function must not hide it if that stops being true.
 *
 * `isKnown` is injected rather than imported so this stays pure and testable.
 */
export function resolveHref(
  fromPath: string,
  href: string,
  isKnown: (path: string) => boolean,
): string {
  if (/^(https?:|mailto:)/.test(href)) return href
  if (href.startsWith("#")) return href

  const [target, anchor] = href.split("#")
  if (!target) return href

  const parts = target.startsWith("/")
    ? target.slice(1).split("/")
    : [...fromPath.split("/").slice(0, -1), ...target.split("/")]

  const stack: string[] = []
  for (const part of parts) {
    if (part === "." || part === "") continue
    if (part === "..") stack.pop()
    else stack.push(part)
  }
  const resolved = stack.join("/")
  if (!isKnown(resolved)) return href
  return `/admin/docs?doc=${encodeURIComponent(resolved)}${anchor ? `#${anchor}` : ""}`
}

/**
 * Render a document to HTML, rewriting its internal links.
 *
 * `marked` is imported dynamically so it is code-split away from the entry chunk.
 */
export async function renderMarkdown(
  source: string,
  fromPath: string,
  isKnown: (path: string) => boolean,
): Promise<string> {
  const { Marked } = await import("marked")
  const engine = new Marked({ gfm: true })
  engine.use({
    walkTokens(token) {
      if (token.type !== "link") return
      const link = token as { href?: string }
      if (typeof link.href === "string") link.href = resolveHref(fromPath, link.href, isKnown)
    },
  })
  return addHeadingIds(await engine.parse(source))
}
