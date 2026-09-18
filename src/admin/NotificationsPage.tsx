/**
 * Notifications page — /admin/notifications.
 *
 * The preferences are stored; the feed below them is *derived*, not stored. It
 * replays the current inquiry list against whatever is switched on, so the
 * settings preview what they would actually do rather than being three switches
 * attached to nothing.
 */
import { toast } from "sonner"
import { Bell, Mail, Siren, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import { PageHeader } from "@/admin/PageHeader"
import { api } from "@/lib/data/api"
import { useApiData } from "@/lib/data/hooks"
import { useDraft } from "@/lib/data/use-draft"
import type { NotificationPrefs } from "@/lib/data/types"
import { formatRelative } from "@/lib/format"

const HOURS = Array.from({ length: 24 }, (_, h) => h)

function hourLabel(h: number): string {
  const suffix = h < 12 ? "am" : "pm"
  const display = h % 12 === 0 ? 12 : h % 12
  return `${display}:00 ${suffix}`
}

export default function NotificationsPage() {
  const { data, loading } = useApiData("admin-notifications", () => api.getNotifications())
  const { draft, setDraft, dirty, reset } = useDraft<NotificationPrefs>(data)
  const inquiries = useApiData("notifications-inquiries", () => api.listInquiries())

  const rows = inquiries.data ?? []

  /** What the current switches would have produced, against the live data. */
  const feed = [
    draft?.emailOnLead
      ? {
          key: "lead",
          icon: Mail,
          title: "Email on new lead",
          items: rows.filter((i) => i.status === "new").slice(0, 3),
          blurb: "You would have been emailed about each of these the moment it arrived.",
        }
      : null,
    draft?.emergencyAlerts
      ? {
          key: "emergency",
          icon: Siren,
          title: "Emergency alerts",
          items: rows.filter((i) => i.urgency === "emergency").slice(0, 3),
          blurb: "Urgent requests are pushed regardless of the digest hour.",
        }
      : null,
    draft?.weeklySummary
      ? {
          key: "summary",
          icon: TrendingUp,
          title: "Weekly summary",
          items: rows.slice(0, 3),
          blurb: "A digest of everything handled in the last seven days.",
        }
      : null,
  ].filter((r) => r !== null)

  async function onSave() {
    if (!draft) return
    await api.saveNotifications(draft)
    toast.success("Notification preferences saved")
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Notifications" description="What the team gets told about, and when.">
        <Button variant="outline" onClick={reset} disabled={!dirty}>
          Discard
        </Button>
        <Button onClick={onSave} disabled={!dirty}>
          Save changes
        </Button>
      </PageHeader>

      <Card>
        <CardHeader>
          <CardTitle>Preferences</CardTitle>
          <CardDescription>
            {dirty ? "You have unsaved changes." : "Saved to this browser's local store."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {loading && !draft ? (
            <div className="space-y-4">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between gap-6">
                <div className="space-y-0.5">
                  <Label htmlFor="emailOnLead">Email on new lead</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive an email the moment an inquiry is submitted.
                  </p>
                </div>
                <Switch
                  id="emailOnLead"
                  checked={draft?.emailOnLead ?? false}
                  onCheckedChange={(v) => setDraft((p) => ({ ...p, emailOnLead: v }))}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between gap-6">
                <div className="space-y-0.5">
                  <Label htmlFor="weeklySummary">Weekly summary</Label>
                  <p className="text-sm text-muted-foreground">
                    A digest of inquiries, quotes and booked work.
                  </p>
                </div>
                <Switch
                  id="weeklySummary"
                  checked={draft?.weeklySummary ?? false}
                  onCheckedChange={(v) => setDraft((p) => ({ ...p, weeklySummary: v }))}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between gap-6">
                <div className="space-y-0.5">
                  <Label htmlFor="emergencyAlerts">Emergency alerts</Label>
                  <p className="text-sm text-muted-foreground">
                    Interrupt for any request marked as an emergency.
                  </p>
                </div>
                <Switch
                  id="emergencyAlerts"
                  checked={draft?.emergencyAlerts ?? false}
                  onCheckedChange={(v) => setDraft((p) => ({ ...p, emergencyAlerts: v }))}
                />
              </div>

              <Separator />

              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <Label htmlFor="digestHour">Digest hour</Label>
                  <p className="text-sm text-muted-foreground">
                    When the summary lands, in your profile's time zone.
                  </p>
                </div>
                <Select
                  value={String(draft?.digestHour ?? 8)}
                  onValueChange={(v) => setDraft((p) => ({ ...p, digestHour: Number(v) }))}
                >
                  <SelectTrigger id="digestHour" className="w-[160px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {HOURS.map((h) => (
                      <SelectItem key={h} value={String(h)}>
                        {hourLabel(h)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="size-4" />
            What you would have been told
          </CardTitle>
          <CardDescription>
            Replayed against the {rows.length} inquiries currently in the store.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {feed.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Everything is switched off, so nothing would be sent.
            </p>
          ) : (
            feed.map((section) => (
              <div key={section.key} className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <section.icon className="size-4 text-muted-foreground" />
                  {section.title}
                </div>
                <p className="text-xs text-muted-foreground">{section.blurb}</p>
                {section.items.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nothing matches right now.</p>
                ) : (
                  <ul className="space-y-1">
                    {section.items.map((i) => (
                      <li
                        key={i.id}
                        className="flex flex-wrap items-baseline justify-between gap-2 rounded-md border border-border px-3 py-2 text-sm"
                      >
                        <span className="font-medium">{i.name}</span>
                        <span className="text-muted-foreground">
                          {i.service} · {formatRelative(i.createdAt)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}
