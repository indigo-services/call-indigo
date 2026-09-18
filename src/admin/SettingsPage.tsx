/**
 * Settings page — /admin/settings (PRD §10, now persistent).
 *
 * The PRD's rc1 version was a mockup whose save button apologised for not saving
 * ("Saved (mockup — nothing was persisted)"). This one actually writes, through
 * `api.saveSettings()`, and the toast says so. The distinction matters: a toast
 * that claims a save it did not make teaches everyone who reads the code that
 * the copy is decoration.
 *
 * Values are seeded from the site's published facts, so the form reads as the
 * real product rather than as placeholder text.
 */
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { PageHeader } from "@/admin/PageHeader"
import { api } from "@/lib/data/api"
import { useApiData } from "@/lib/data/hooks"
import { useDraft } from "@/lib/data/use-draft"
import type { SiteSettings } from "@/lib/data/types"

/** Fields that are editable, in render order. */
const FIELDS: ReadonlyArray<{
  key: keyof SiteSettings
  label: string
  hint?: string
  type?: string
}> = [
  { key: "brandName", label: "Business name", hint: "Appears in the header, footer and page titles." },
  { key: "legalName", label: "Legal name", hint: "Used on documents and the utility bar." },
  { key: "primaryPhone", label: "Primary phone", hint: "The number every call-to-action dials." },
  { key: "publicEmail", label: "Public email", type: "email" },
  { key: "notificationEmail", label: "Notification email", type: "email", hint: "Where new-inquiry alerts are sent." },
  { key: "address", label: "Address" },
  { key: "establishedYear", label: "Established year" },
  { key: "serviceArea", label: "Service area" },
  { key: "licenseNumber", label: "Licence number" },
]

export default function SettingsPage() {
  const { data, loading, error } = useApiData("admin-settings", () => api.getSettings())
  const { draft, setDraft, dirty, reset } = useDraft<SiteSettings>(data)

  async function onSave() {
    if (!draft) return
    await api.saveSettings(draft)
    toast.success("Settings saved")
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="General"
        description="Business details, used across the site and its documents."
      >
        <Button variant="outline" onClick={reset} disabled={!dirty}>
          Discard
        </Button>
        <Button onClick={onSave} disabled={!dirty}>
          Save changes
        </Button>
      </PageHeader>

      {error ? (
        <Card>
          <CardContent className="pt-6 text-sm text-destructive">
            Could not load settings: {error.message}
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Business information</CardTitle>
          <CardDescription>
            {dirty ? "You have unsaved changes." : "Saved to this browser's local store."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading && !draft ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {FIELDS.map((f) => (
                <div key={f.key} className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-9 w-full" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {FIELDS.map((f) => (
                <div key={f.key} className="space-y-2">
                  <Label htmlFor={`field-${f.key}`}>{f.label}</Label>
                  <Input
                    id={`field-${f.key}`}
                    type={f.type ?? "text"}
                    value={draft?.[f.key] ?? ""}
                    onChange={(e) =>
                      setDraft((prev) => ({ ...prev, [f.key]: e.target.value }))
                    }
                  />
                  {f.hint ? <p className="text-xs text-muted-foreground">{f.hint}</p> : null}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Where these values appear</CardTitle>
          <CardDescription>
            The marketing pages still carry these strings inline from the prototype, so
            editing here does not yet rewrite them. That is PRD §16.2 F4 (content
            management) and depends on a real backend.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  )
}
