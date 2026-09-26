/**
 * Design System page — /admin/design (PRD §11).
 *
 * The token tables below are display-only, as they always were. The **page
 * primaries** card is the exception: it authors the three marketing colours.
 *
 * HOW IT WORKS, AND WHAT IT CANNOT DO
 * Tailwind v4 compiles `bg-residential` to
 * `background-color: var(--color-residential)`, so writing that custom property
 * onto `:root` re-colours every surface that reads it — including the three
 * marketing pages, which are raw HTML strings rather than React components. The
 * preview is therefore real, and it is instant.
 *
 * What is *not* real is the reach. The `/admin` gate is client-side and this
 * build has no backend, so a saved value goes to `localStorage` and applies to
 * **this browser only**. Visitors keep seeing the shipped defaults until the
 * copied token block is committed to `src/index.css` and deployed. The card says
 * so in as many words, because a colour picker that looks like it published a
 * change to the live site — and did not — is worse than no picker.
 *
 * That last step is deliberately a copy-paste rather than a button: publishing
 * means writing to the deployed stylesheet, which needs a real backend — a
 * signed-in operator is not enough, and the gate in `src/admin/auth.ts` cannot
 * publish anything. See `src/lib/theme.ts` and PRD §16.2 F2/F4.
 */
import { useEffect, useState } from "react"
import { Copy, Check, RotateCcw } from "lucide-react"
import { toast } from "sonner"
import { api } from "@/lib/data/api"
import { useApiData } from "@/lib/data/hooks"
import { useDraft } from "@/lib/data/use-draft"
import type { SiteSettings } from "@/lib/data/types"
import {
  CONTRAST_BARS,
  EYEBROW_ACCENT,
  THEME_TOKENS,
  applyTheme,
  contrastRatio,
  cssTokenBlock,
  normaliseHex,
} from "@/lib/theme"
import { designTokens, accentTokens, segmentAccents } from "@/admin/mock/tokens"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"

function Swatch({ hex, label, sublabel }: { hex: string; label: string; sublabel?: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(hex)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="flex items-center gap-3 rounded-md border border-border p-3">
      <button
        onClick={handleCopy}
        className="group relative h-10 w-10 shrink-0 rounded border border-border focus:outline-none focus:ring-2 focus:ring-ring"
        style={{ backgroundColor: hex }}
        title={`Copy ${hex}`}
        aria-label={`Copy colour ${hex}`}
      >
        <span className="absolute inset-0 flex items-center justify-center rounded bg-black/40 opacity-0 transition-opacity group-hover:opacity-100 group-focus:opacity-100">
          {copied ? <Check className="size-4 text-white" /> : <Copy className="size-4 text-white" />}
        </span>
      </button>
      <div className="min-w-0">
        <p className="text-sm font-mono font-medium text-foreground truncate">{label}</p>
        {sublabel && <p className="text-xs text-muted-foreground truncate">{sublabel}</p>}
      </div>
    </div>
  )
}

/** A contrast figure, flagged when it falls under its WCAG bar. */
function Ratio({ label, value, bar }: { label: string; value: number | null; bar: number }) {
  const ok = value !== null && value >= bar
  return (
    <div className="flex items-baseline justify-between gap-3 text-xs">
      <span className="text-muted-foreground">{label}</span>
      <span className={ok ? "font-mono text-foreground" : "font-mono font-semibold text-destructive"}>
        {value === null ? "—" : `${value.toFixed(2)}:1`}
        <span className="ml-1 text-muted-foreground">
          {ok ? `≥ ${bar}` : `< ${bar}`}
        </span>
      </span>
    </div>
  )
}

function PrimaryRow({
  label,
  page,
  token,
  value,
  onCommit,
}: {
  label: string
  page: string
  token: string
  value: string
  onCommit: (hex: string) => void
}) {
  // The text field keeps its own state so a half-typed value ("#0c6" or "") does
  // not have to be a valid colour on every keystroke. Only a complete hex is
  // pushed up, which is what stops the site flickering through invalid values.
  const [text, setText] = useState(value)
  useEffect(() => setText(value), [value])

  const onText = (next: string) => {
    setText(next)
    const hex = normaliseHex(next)
    if (hex) onCommit(hex)
  }

  return (
    <div className="rounded-md border border-border p-4">
      <div className="flex items-start gap-4">
        <input
          type="color"
          value={value}
          onChange={(e) => onCommit(e.target.value)}
          aria-label={`${label} primary colour`}
          className="h-14 w-14 shrink-0 cursor-pointer rounded border border-border bg-transparent p-1"
        />
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-baseline gap-x-2">
            <Label htmlFor={`primary-${token}`} className="text-sm font-semibold">
              {label}
            </Label>
            <span className="font-mono text-xs text-muted-foreground">{token}</span>
          </div>
          <p className="text-xs text-muted-foreground">Paints {page}</p>
          <Input
            id={`primary-${token}`}
            value={text}
            spellCheck={false}
            autoComplete="off"
            onChange={(e) => onText(e.target.value)}
            className="max-w-40 font-mono text-sm"
            aria-describedby={`ratio-${token}`}
          />
        </div>
        <div id={`ratio-${token}`} className="w-40 shrink-0 space-y-1">
          <Ratio label="White body copy" value={contrastRatio("#ffffff", value)} bar={CONTRAST_BARS.body} />
          <Ratio
            label="Cyan eyebrow"
            value={contrastRatio(EYEBROW_ACCENT, value)}
            bar={CONTRAST_BARS.eyebrow}
          />
        </div>
      </div>
    </div>
  )
}

export default function DesignSystemPage() {
  const { data, loading, error } = useApiData("admin-settings", () => api.getSettings())
  const { draft, setDraft, dirty } = useDraft<SiteSettings>(data)
  const [copiedBlock, setCopiedBlock] = useState(false)

  // Apply the draft live, and persist it shortly after the user stops moving.
  //
  // Persisting matters more than it looks. An in-memory-only preview is lost the
  // moment you leave this page by anything other than client-side routing — and
  // from /admin there is no in-app link to the marketing pages, so "go and look
  // at it" means a full page load. Measured in the browser probe: a previewed
  // colour was simply gone on /residential, which made the whole card useless.
  //
  // The debounce is what keeps a colour-input drag from writing on every frame;
  // `dirty` is what stops the mount from writing the values back over themselves.
  useEffect(() => {
    if (!draft || typeof document === "undefined") return
    applyTheme(document.documentElement, draft)
    if (!dirty) return
    const t = setTimeout(() => {
      void api.saveSettings(draft)
    }, 250)
    return () => clearTimeout(t)
  }, [draft, dirty])

  async function onResetToDefaults() {
    if (!draft) return
    const shipped = Object.fromEntries(THEME_TOKENS.map((t) => [t.key, t.default]))
    setDraft((prev) => ({ ...prev, ...shipped }))
    toast.success("Reset to the shipped colours")
  }

  async function onCopyBlock() {
    if (!draft) return
    await navigator.clipboard.writeText(cssTokenBlock(draft))
    setCopiedBlock(true)
    setTimeout(() => setCopiedBlock(false), 1500)
    toast.success("Token block copied — paste into src/index.css to publish")
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Design System</h1>
          <p className="text-sm text-muted-foreground mt-1">
            The token tables are reference. The page primaries below are live — they retheme
            the marketing pages as you pick.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={onResetToDefaults} disabled={!draft}>
            <RotateCcw className="size-4" />
            Reset to shipped
          </Button>
          <Button variant="outline" onClick={onCopyBlock} disabled={!draft}>
            {copiedBlock ? <Check className="size-4" /> : <Copy className="size-4" />}
            Copy token block
          </Button>
        </div>
      </div>

      {error ? (
        <Card>
          <CardContent className="pt-6 text-sm text-destructive">
            Could not load settings: {error.message}
          </CardContent>
        </Card>
      ) : null}

      {/* Page primaries — the one authoring surface on this page. */}
      <Card>
        <CardHeader>
          <CardTitle>Page primaries</CardTitle>
          <CardDescription>
            The three marketing colours. Picking one repaints the real pages immediately —
            the hero band, its photo tint, the buttons and the header&rsquo;s active pill all
            follow, because they read the same token.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading && !draft ? (
            <div className="space-y-4">
              {THEME_TOKENS.map((t) => (
                <Skeleton key={t.key} className="h-[104px] w-full" />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {THEME_TOKENS.map((t) => (
                <PrimaryRow
                  key={t.key}
                  label={t.label}
                  page={t.page}
                  token={t.token}
                  value={draft?.[t.key] ?? t.default}
                  onCommit={(hex) => setDraft((prev) => ({ ...prev, [t.key]: hex }))}
                />
              ))}
            </div>
          )}

          <div className="rounded-md border border-amber-500/40 bg-amber-500/10 p-4 text-sm">
            <p className="font-semibold text-foreground">
              Saving here changes this browser, not the live site.
            </p>
            <p className="mt-1 text-muted-foreground">
              There is no backend — the <span className="font-mono text-xs">/admin</span> gate
              is client-side — so a saved theme lives in this browser&rsquo;s local storage and
              visitors keep seeing the shipped colours. To publish, use{" "}
              <span className="font-semibold text-foreground">Copy token block</span> and paste
              the result into <span className="font-mono text-xs">src/index.css</span>, then
              commit. That is PRD §16.2 F2/F4: a real backend, and auth on this page, is what a
              publish button would need.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Logo (PRD §11.1) */}
      <Card>
        <CardHeader>
          <CardTitle>Logo</CardTitle>
          <CardDescription>Brand lockup: icon + wordmark.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-ink-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="size-6 text-white"
                aria-hidden="true"
              >
                <path d="M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384" />
              </svg>
            </div>
            <div>
              <p className="font-bold text-foreground text-[23px] tracking-[-0.06em]">Call Indigo</p>
              <p className="text-xs text-muted-foreground">
                font-sans, tracking-[-0.06em], weight 700, 23px
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Icon (PRD §11.2) */}
      <Card>
        <CardHeader>
          <CardTitle>Icon</CardTitle>
          <CardDescription>Brand and UI icon strategy.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            The brand icon is the mark itself. UI icons are <code className="text-xs bg-muted px-1 rounded">lucide-react</code>, matching
            the <code className="text-xs bg-muted px-1 rounded">iconLibrary</code> in components.json.
          </p>
        </CardContent>
      </Card>

      {/* Colours (PRD §11.3) */}
      <Card>
        <CardHeader>
          <CardTitle>Colours</CardTitle>
          <CardDescription>Full brand token palette. Click a swatch to copy the hex value.</CardDescription>
        </CardHeader>
        <CardContent>
          {["Brand", "Accents", "Neutrals", "Semantic", "Scrim"].map((group) => {
            const tokens = designTokens.filter((t) => t.group === group)
            if (tokens.length === 0) return null
            return (
              <div key={group} className="mb-4 last:mb-0">
                <h3 className="text-sm font-semibold text-foreground mb-2">{group}</h3>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {tokens.map((t) => (
                    <Swatch
                      key={t.token}
                      hex={t.hex}
                      label={t.token}
                      sublabel={`${t.hex} — ${t.role}`}
                    />
                  ))}
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>

      {/* Standard accents (PRD §11.4) */}
      <Card>
        <CardHeader>
          <CardTitle>Standard Accents</CardTitle>
          <CardDescription>The five primary accent colours used across the site.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {accentTokens.map((t) => (
              <Swatch
                key={t.token}
                hex={t.hex}
                label={t.token}
                sublabel={`${t.hex} — ${t.role}`}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Segment accents (PRD §11.5) */}
      <Card>
        <CardHeader>
          <CardTitle>Segment Accents</CardTitle>
          <CardDescription>Assigned from the existing palette — no new hues invented.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {segmentAccents.map((t) => (
              <div key={t.segment} className="flex items-center gap-3 rounded-md border border-border p-3">
                <div
                  className="h-10 w-10 shrink-0 rounded border border-border"
                  style={{ backgroundColor: t.hex }}
                />
                <div>
                  <p className="text-sm font-semibold text-foreground">{t.segment}</p>
                  <p className="text-xs font-mono text-muted-foreground">{t.token}</p>
                  <p className="text-xs text-muted-foreground">{t.hex}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{t.surface}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
