/**
 * Design System page — /admin/design (PRD §11).
 *
 * Mockup. Display-only. This page shows the brand; it does not author it.
 */
import { useState } from "react"
import { Copy, Check } from "lucide-react"
import { designTokens, accentTokens, segmentAccents } from "@/admin/mock/tokens"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

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

export default function DesignSystemPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Design System</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Mockup — read-only. This page displays tokens; it does not author them.
        </p>
      </div>

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
