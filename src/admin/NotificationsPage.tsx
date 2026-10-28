/**
 * Notifications page — /admin/notifications.
 *
 * Two records live here, and the distinction is the whole point of #93:
 *
 *   · **Delivery** (`NotificationSettings`) — *where* a lead is announced. One row
 *     in `notification_settings`, read by `api/_lib/notifications.ts` on every send.
 *   · **Preferences** (`NotificationPrefs`) — *whether* it is announced at all.
 *
 * Before this page existed, the only field with a screen was a "Notification email"
 * on `/admin/settings` that saved to a row no sender read, while the address that
 * actually decided delivery was settable only by `curl`. An operator changed the
 * address, was told it saved, and every lead kept going to the old inbox.
 *
 * The feed below the form is **derived**, not stored: it replays the current inquiry
 * list through `willNotify()`, the client copy of the sender's own rule, so the
 * switches preview what they would actually do rather than being switches attached
 * to nothing. `tests/backend.mjs` asserts that copy and the server's agree on every
 * input, because a preview that describes a different rule is the same lie again.
 */
import { useState } from "react"
import { toast } from "sonner"
import { Bell, Mail, Siren } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import { PageHeader } from "@/admin/PageHeader"
import { api } from "@/lib/data/api"
import { useAuth } from "@clerk/react"
import { useApiData } from "@/lib/data/hooks"
import { useDraft } from "@/lib/data/use-draft"
import type { NotificationPrefs, NotificationSettings } from "@/lib/data/types"
import { willNotify } from "@/lib/notifications"
import { formatRelative } from "@/lib/format"

/**
 * The four delivery fields, in render order, mirroring `NotificationSettings`.
 *
 * This array is the page's contract with `api/notification-settings.ts`: the keys
 * here must be exactly the keys that endpoint validates and that
 * `api/_lib/notifications.ts` selects. `tests/backend.mjs` parses this array and
 * compares all three, so adding a field to the form without teaching the sender
 * about it fails the suite instead of quietly doing nothing.
 */
const DELIVERY_FIELDS: ReadonlyArray<{
  key: keyof NotificationSettings
  label: string
  hint: string
  type?: string
  placeholder?: string
}> = [
  {
    key: "to",
    label: "Send leads to",
    hint: "The inbox that receives every new inquiry. Exactly one address.",
    type: "email",
    placeholder: "inbox@example.com",
  },
  {
    key: "replyTo",
    label: "Reply-To",
    hint: "Leave this empty and replying to the alert reaches the customer directly.",
    type: "email",
    placeholder: "Replying to the lead",
  },
  {
    key: "bcc",
    label: "Bcc",
    hint: "Optional. Up to five addresses, separated by commas.",
    placeholder: "owner@example.com, office@example.com",
  },
  {
    key: "subjectTemplate",
    label: "Subject line",
    hint: "{{name}}, {{service}}, {{urgency}} and {{propertyType}} are filled in per lead.",
    placeholder: "New inquiry — {{name}} ({{service}})",
  },
]

/** Shown when the table has no row yet — empty, not a fabricated address. */
const BLANK_DELIVERY: NotificationSettings = { to: "", replyTo: "", bcc: "", subjectTemplate: "" }

export default function NotificationsPage() {
  const { getToken } = useAuth()
  const [saving, setSaving] = useState(false)

  const prefsData = useApiData("admin-notifications", () => api.getNotifications(getToken))
  const deliveryData = useApiData("admin-notification-delivery", () =>
    api.getNotificationSettings(getToken),
  )
  const inquiries = useApiData("notifications-inquiries", () => api.listInquiries(getToken))

  const prefs = useDraft<NotificationPrefs>(prefsData.data)
  // While the read is in flight the draft is `null`, so the form cannot be typed into
  // and then yanked away when the real values land. Once settled, a missing row
  // becomes an empty form rather than nothing at all — the operator has to be able to
  // set the address that does not exist yet.
  const delivery = useDraft<NotificationSettings>(
    deliveryData.loading ? null : (deliveryData.data ?? BLANK_DELIVERY),
  )

  const rows = inquiries.data ?? []
  const dirty = prefs.dirty || delivery.dirty

  /** The inquiries this configuration would have emailed. */
  const wouldEmail = prefs.draft
    ? rows.filter((i) => willNotify(prefs.draft as NotificationPrefs, i.urgency))
    : []

  function discard() {
    prefs.reset()
    delivery.reset()
  }

  async function onSave() {
    setSaving(true)
    try {
      // Delivery first: it is the record with a validator that can reject an address,
      // so a typo is reported before the preferences are written and the page is left
      // half-saved in the more visible direction.
      if (delivery.dirty && delivery.draft) {
        await api.saveNotificationSettings(delivery.draft, getToken)
      }
      if (prefs.dirty && prefs.draft) await api.saveNotifications(prefs.draft, getToken)
      toast.success("Notification settings saved")
    } catch {
      toast.error("That did not save. Check the addresses and try again.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications"
        description="Where a lead is announced, and what the team is told about."
      >
        <Button variant="outline" onClick={discard} disabled={!dirty || saving}>
          Discard
        </Button>
        <Button onClick={onSave} disabled={!dirty || saving}>
          {saving ? "Saving…" : "Save changes"}
        </Button>
      </PageHeader>

      {/* ── Delivery: the row the sender actually reads ─────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="size-4" />
            Delivery
          </CardTitle>
          <CardDescription>
            Every new inquiry is emailed to this address the moment it is stored. This is the
            same row the server reads — not a copy of it.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {deliveryData.loading && !delivery.draft ? (
            <div className="space-y-4">
              {[0, 1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : (
            DELIVERY_FIELDS.map((field) => (
              <div key={field.key} className="grid gap-2">
                <Label htmlFor={`delivery-${field.key}`}>{field.label}</Label>
                <Input
                  id={`delivery-${field.key}`}
                  type={field.type ?? "text"}
                  placeholder={field.placeholder}
                  value={delivery.draft?.[field.key] ?? ""}
                  onChange={(e) => delivery.setDraft((p) => ({ ...p, [field.key]: e.target.value }))}
                />
                <p className="text-sm text-muted-foreground">{field.hint}</p>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* ── Preferences: the two switches something acts on ─────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle>When to send</CardTitle>
          <CardDescription>
            {dirty ? "You have unsaved changes." : "Saved to the server, not to this browser."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {prefsData.loading && !prefs.draft ? (
            <div className="space-y-4">
              {[0, 1].map((i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between gap-6">
                <div className="space-y-0.5">
                  <Label htmlFor="emailOnLead">Email on new lead</Label>
                  <p className="text-sm text-muted-foreground">
                    Send an email the moment any inquiry is submitted.
                  </p>
                </div>
                <Switch
                  id="emailOnLead"
                  checked={prefs.draft?.emailOnLead ?? false}
                  onCheckedChange={(v) => prefs.setDraft((p) => ({ ...p, emailOnLead: v }))}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between gap-6">
                <div className="space-y-0.5">
                  <Label htmlFor="emergencyAlerts">Emergency alerts</Label>
                  <p className="text-sm text-muted-foreground">
                    Always email requests marked as an emergency, even when routine alerts are
                    off. This never narrows what is sent.
                  </p>
                </div>
                <Switch
                  id="emergencyAlerts"
                  checked={prefs.draft?.emergencyAlerts ?? false}
                  onCheckedChange={(v) => prefs.setDraft((p) => ({ ...p, emergencyAlerts: v }))}
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* ── The derived preview ─────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="size-4" />
            What you would have been told
          </CardTitle>
          <CardDescription>
            Replayed against the {rows.length} inquiries currently in the store, using the same
            rule the server applies.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {prefs.draft === null ? (
            <Skeleton className="h-16 w-full" />
          ) : (
            <>
              <p className="flex items-start gap-2 text-sm">
                {prefs.draft.emailOnLead ? (
                  <>
                    <Mail className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                    <span>
                      Every new lead is emailed to{" "}
                      <strong>{delivery.draft?.to || "no address yet"}</strong>.
                    </span>
                  </>
                ) : prefs.draft.emergencyAlerts ? (
                  <>
                    <Siren className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                    <span>
                      Routine mail is off. Emergency requests are still emailed to{" "}
                      <strong>{delivery.draft?.to || "no address yet"}</strong>.
                    </span>
                  </>
                ) : (
                  <span>
                    Nothing is emailed. Every lead is still stored and appears in the inbox.
                  </span>
                )}
              </p>

              {wouldEmail.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nothing matches right now.</p>
              ) : (
                <ul className="space-y-1">
                  {wouldEmail.slice(0, 5).map((i) => (
                    <li
                      key={i.id}
                      className="flex flex-wrap items-baseline justify-between gap-2 rounded-md border border-border px-3 py-2 text-sm"
                    >
                      <span className="font-medium">{i.name}</span>
                      <span className="text-muted-foreground">
                        {i.urgency === "emergency" ? "Emergency · " : ""}
                        {i.service} · {formatRelative(i.createdAt)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
              {wouldEmail.length > 5 ? (
                <p className="text-xs text-muted-foreground">…and {wouldEmail.length - 5} more.</p>
              ) : null}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
