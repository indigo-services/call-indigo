/**
 * Docs page — /admin/docs. A read-only mirror of `docs/**`.
 *
 * WHAT THIS IS FOR, AND WHAT IT IS NOT.
 *
 * It is the documentation library, rendered in the dashboard, so an operator can read the
 * project's own record without leaving the app or cloning the repository. It is **not** an
 * editor, and there is nothing to save: the only source of truth is `docs/` in the
 * repository, and this page is a rendering of it. That is the same relationship the wiki
 * has to `docs/`, and the same warning applies — `docs/00-meta/conventions.md` §6: *"a link
 * into the wiki is not a link into the repo… link to it only to offer the rendered form,
 * never as the only path to a fact."* Same here.
 *
 * WHY THIS MIRRORS `docs/` AND NOT THE WIKI.
 *
 * The wiki is generated **from** `docs/`, so mirroring the wiki would be mirroring a mirror
 * — and a stale one, since the sync is manual (`docs/40-project/tasks.md` **E12**). An
 * iframe of it is not an option either: github.com returns `X-Frame-Options: deny` and
 * `Content-Security-Policy: … frame-ancestors 'none'`, so the browser refuses to render it.
 * A runtime fetch from `api.github.com` is not an option for the same class of reason — the
 * unauthenticated limit is 60 requests/hour per IP, and reading this library costs 56.
 *
 * THE DOCUMENT IS SELECTED BY QUERY PARAMETER, NOT BY A SPLAT ROUTE.
 *
 * `tests/policy.mjs` asserts two-way parity between the `/admin/…` paths in `routes.ts` and
 * the relative `<Route path>` values in `App.tsx`. A splat (`docs/*`) would enter that set
 * as `/admin/docs/*` and fail both directions. A query parameter keeps the route a single
 * clean path and leaves the `/admin` catch-all redirect untouched — the property PRD §5.2
 * was protecting.
 *
 * THE ONE PLACE THIS USES `dangerouslySetInnerHTML`.
 *
 * `security.md` §3 recorded the marketing chrome as the only place raw HTML enters the DOM.
 * This is the second, and the document now says so. The content is first-party markdown from
 * this repository, which is already public. `tests/docs-mirror.mjs` renders the whole library
 * and asserts the output contains no `<script`, no `on…=` handler, no `javascript:` URL and
 * no `<iframe>`.
 *
 * ⚠️ The precise claim about the query parameter, because the loose version is false. `?doc=`
 * IS read from the URL and IS rendered in the not-found branch below — as an **escaped React
 * text child**, not as HTML. Everywhere else it is only a lookup key into `DOC_ENTRIES`. It
 * never reaches `dangerouslySetInnerHTML`, which receives `marked`'s output for a first-party
 * file and nothing else. Saying "no URL reaches the DOM" would be wrong and would hide the
 * one place a future change could turn into a real one.
 */
import { useEffect, useMemo, useState } from "react"
import { Link, useSearchParams } from "react-router-dom"
import { ArrowLeft, Search } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { PageHeader } from "@/admin/PageHeader"
import {
  DOC_DOMAINS,
  DOC_ENTRIES,
  docHref,
  findDoc,
  loadDoc,
  type DocEntry,
  type LoadedDoc,
} from "@/admin/docs/content"

/**
 * Prose styling for the rendered markdown.
 *
 * Tailwind arbitrary variants rather than a `.doc-prose` block in `src/index.css`: the
 * stylesheet is the single design-token source (`standards.md` §7), and a rendering concern
 * that belongs to exactly one page should not enlarge it.
 */
const PROSE = [
  "text-sm leading-relaxed text-foreground",
  "[&_h1]:mt-0 [&_h1]:mb-3 [&_h1]:text-2xl [&_h1]:font-bold",
  "[&_h2]:mt-8 [&_h2]:mb-3 [&_h2]:border-b [&_h2]:border-border [&_h2]:pb-1 [&_h2]:text-lg [&_h2]:font-semibold",
  "[&_h3]:mt-6 [&_h3]:mb-2 [&_h3]:text-base [&_h3]:font-semibold",
  "[&_p]:my-3",
  "[&_ul]:my-3 [&_ul]:list-disc [&_ul]:pl-6",
  "[&_ol]:my-3 [&_ol]:list-decimal [&_ol]:pl-6",
  "[&_li]:my-1",
  "[&_blockquote]:my-4 [&_blockquote]:border-l-2 [&_blockquote]:border-border [&_blockquote]:pl-4 [&_blockquote]:text-muted-foreground",
  "[&_hr]:my-8 [&_hr]:border-border",
  "[&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-[0.85em]",
  "[&_pre]:my-4 [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-muted [&_pre]:p-3",
  "[&_pre_code]:bg-transparent [&_pre_code]:p-0",
  "[&_table]:my-4 [&_table]:w-full [&_table]:border-collapse [&_table]:text-xs",
  "[&_th]:border [&_th]:border-border [&_th]:bg-muted [&_th]:px-2 [&_th]:py-1 [&_th]:text-left [&_th]:font-semibold",
  "[&_td]:border [&_td]:border-border [&_td]:px-2 [&_td]:py-1 [&_td]:align-top",
  "[&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2",
].join(" ")

/** One document's kind, as a badge. The kind is the document's own declaration. */
function KindBadge({ kind }: { kind: string }) {
  return (
    <Badge
      variant={kind === "living" ? "default" : "secondary"}
      className="shrink-0 font-mono text-[10px]"
    >
      {kind}
    </Badge>
  )
}

function DocRow({ entry }: { entry: DocEntry }) {
  return (
    <li className="flex items-baseline gap-2 py-1">
      <KindBadge kind={entry.kind} />
      <Link
        to={docHref(entry.path)}
        className="text-sm text-foreground hover:text-primary hover:underline"
      >
        {entry.title}
      </Link>
      <span className="ml-auto shrink-0 font-mono text-[11px] text-muted-foreground">
        {entry.path.replace(/^docs\//, "")}
      </span>
    </li>
  )
}

function DocView({ path }: { path: string }) {
  const entry = findDoc(path)
  const [loaded, setLoaded] = useState<LoadedDoc | null>(null)
  const [state, setState] = useState<"loading" | "ready" | "missing">("loading")

  useEffect(() => {
    let live = true
    setState("loading")
    setLoaded(null)
    loadDoc(path).then(
      (result) => {
        if (!live) return
        if (result === null) setState("missing")
        else {
          setLoaded(result)
          setState("ready")
        }
      },
      () => {
        if (live) setState("missing")
      },
    )
    return () => {
      live = false
    }
  }, [path])

  if (!entry) {
    return (
      <p className="text-sm text-muted-foreground">
        No document at <code className="font-mono">{path}</code>. It may have been renamed or
        moved — the index lists everything the mirror holds.
      </p>
    )
  }

  // Read from the same text the renderer used, so the badge above the body cannot disagree
  // with the body about the document's kind or its `Last verified` date.
  const lastVerified = loaded?.frontMatter.lastVerified ?? null

  return (
    <div>
      <Link
        to="/admin/docs"
        className="mb-4 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary"
      >
        <ArrowLeft className="h-3 w-3" aria-hidden />
        All documents
      </Link>

      <div className="mb-4 flex flex-wrap items-center gap-2 border-b border-border pb-3">
        <KindBadge kind={entry.kind} />
        <span className="font-mono text-xs text-muted-foreground">{entry.path}</span>
        {lastVerified ? (
          <span className="text-xs text-muted-foreground">Last verified {lastVerified}</span>
        ) : null}
      </div>

      {state === "loading" ? (
        <div className="space-y-2" aria-busy="true">
          <div className="h-6 w-1/3 animate-pulse rounded bg-muted" />
          <div className="h-4 w-full animate-pulse rounded bg-muted" />
          <div className="h-4 w-5/6 animate-pulse rounded bg-muted" />
          <p className="pt-2 text-xs text-muted-foreground">Loading {entry.title}…</p>
        </div>
      ) : state === "missing" ? (
        <p className="text-sm text-muted-foreground">
          This document could not be loaded. It is listed in the index, so the mirror and the
          file tree disagree — that is a defect, and{" "}
          <code className="font-mono">tests/docs-mirror.mjs</code> asserts it cannot happen.
        </p>
      ) : (
        <article className={PROSE} dangerouslySetInnerHTML={{ __html: loaded?.html ?? "" }} />
      )}
    </div>
  )
}

function DocIndex() {
  const [query, setQuery] = useState("")
  const needle = query.trim().toLowerCase()

  const matches = useMemo(() => {
    if (!needle) return DOC_ENTRIES
    return DOC_ENTRIES.filter(
      (e) =>
        e.title.toLowerCase().includes(needle) ||
        e.path.toLowerCase().includes(needle) ||
        e.kind.includes(needle),
    )
  }, [needle])

  return (
    <div>
      <div className="relative mb-4 max-w-sm">
        <Search
          className="absolute top-1/2 left-2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Filter by title, path or kind"
          className="pl-8"
          aria-label="Filter documents"
        />
      </div>

      {matches.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nothing matches “{query}”.</p>
      ) : (
        DOC_DOMAINS.filter((d) => matches.some((m) => m.domain === d)).map((domain) => {
          const inDomain = matches.filter((m) => m.domain === domain)
          return (
            <section key={domain} className="mb-6">
              <h2 className="mb-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                {domain === "—" ? "The front door" : domain}
                <span className="ml-2 font-normal normal-case">{inDomain.length}</span>
              </h2>
              <ul className="divide-y divide-border">
                {inDomain.map((entry) => (
                  <DocRow key={entry.path} entry={entry} />
                ))}
              </ul>
            </section>
          )
        })
      )}
    </div>
  )
}

export default function DocsPage() {
  const [params] = useSearchParams()
  const selected = params.get("doc")

  return (
    <div className="space-y-6">
      <PageHeader
        title="Documentation"
        description="The project's documentation library, read-only. The source of truth is docs/ in the repository."
      />
      {selected ? <DocView path={selected} /> : <DocIndex />}
    </div>
  )
}
