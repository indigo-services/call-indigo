/**
 * Design System page — /admin/design (PRD §11).
 *
 * Mockup. Display-only. This page shows the brand; it does not author it.
 *
 * Required content: logo, icon, colours, standard accents, plus one accent
 * shade for Residential and one for Commercial.
 *
 * The page carries a visible "mockup — read-only" note (PRD §15, R5).
 *
 * STUB — flesh out after running the shadcn CLI. The colour swatch grid is
 * a custom component — see docs/component-exceptions.md for the exception
 * record (PRD §7.5 worked example).
 */
import { designTokens, accentTokens, segmentAccents } from "@/admin/mock/tokens"

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
      <section className="rounded-lg border border-border bg-card p-6">
        <h2 className="text-lg font-semibold text-card-foreground mb-4">Logo</h2>
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-lg bg-ink-2 flex items-center justify-center">
            <span className="text-white font-bold text-lg">CI</span>
          </div>
          <div>
            <p className="font-bold text-foreground">Call Indigo</p>
            <p className="text-xs text-muted-foreground">font-sans, tracking-[-.02em], weight 700, 23px</p>
          </div>
        </div>
      </section>

      {/* Icon (PRD §11.2) */}
      <section className="rounded-lg border border-border bg-card p-6">
        <h2 className="text-lg font-semibold text-card-foreground mb-2">Icon</h2>
        <p className="text-sm text-muted-foreground">
          The brand icon is the mark itself. UI icons are lucide-react, matching
          the <code className="text-xs">iconLibrary</code> in components.json.
        </p>
      </section>

      {/* Colours (PRD §11.3) */}
      <section className="rounded-lg border border-border bg-card p-6">
        <h2 className="text-lg font-semibold text-card-foreground mb-4">Colours</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {designTokens.map((t) => (
            <div key={t.token} className="flex items-center gap-3 rounded-md border border-border p-3">
              <div
                className="h-10 w-10 rounded border border-border"
                style={{ backgroundColor: t.hex }}
              />
              <div>
                <p className="text-sm font-mono font-medium text-foreground">{t.token}</p>
                <p className="text-xs text-muted-foreground">{t.hex} — {t.role}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Standard accents (PRD §11.4) */}
      <section className="rounded-lg border border-border bg-card p-6">
        <h2 className="text-lg font-semibold text-card-foreground mb-4">Standard Accents</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {accentTokens.map((t) => (
            <div key={t.token} className="flex items-center gap-3 rounded-md border border-border p-3">
              <div
                className="h-10 w-10 rounded border border-border"
                style={{ backgroundColor: t.hex }}
              />
              <div>
                <p className="text-sm font-mono font-medium text-foreground">{t.token}</p>
                <p className="text-xs text-muted-foreground">{t.hex} — {t.role}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Segment accents (PRD §11.5) */}
      <section className="rounded-lg border border-border bg-card p-6">
        <h2 className="text-lg font-semibold text-card-foreground mb-4">Segment Accents</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Assigned from the existing palette — no new hues invented (PRD §11.5).
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {segmentAccents.map((t) => (
            <div key={t.segment} className="flex items-center gap-3 rounded-md border border-border p-3">
              <div
                className="h-10 w-10 rounded border border-border"
                style={{ backgroundColor: t.hex }}
              />
              <div>
                <p className="text-sm font-semibold text-foreground">{t.segment}</p>
                <p className="text-xs font-mono text-muted-foreground">{t.token}</p>
                <p className="text-xs text-muted-foreground">{t.hex}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
