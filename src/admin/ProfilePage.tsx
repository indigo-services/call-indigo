/**
 * Profile page — /admin/profile.
 *
 * The operator's own details. Editing here updates the sidebar footer live,
 * because both read the same record through the API and the API notifies
 * subscribers on write.
 */
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import { PageHeader } from "@/admin/PageHeader"
import { api } from "@/lib/data/api"
import { useApiData } from "@/lib/data/hooks"
import { useDraft } from "@/lib/data/use-draft"
import type { AdminProfile } from "@/lib/data/types"
import { initials } from "@/lib/format"

export default function ProfilePage() {
  const { data, loading } = useApiData("admin-profile", () => api.getProfile())
  const { draft, setDraft, dirty, reset } = useDraft<AdminProfile>(data)

  async function onSave() {
    if (!draft) return
    await api.saveProfile(draft)
    toast.success("Profile saved")
  }

  function set<K extends keyof AdminProfile>(key: K, value: AdminProfile[K]) {
    setDraft((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Profile" description="The signed-in operator's own details.">
        <Button variant="outline" onClick={reset} disabled={!dirty}>
          Discard
        </Button>
        <Button onClick={onSave} disabled={!dirty}>
          Save changes
        </Button>
      </PageHeader>

      <Card>
        <CardHeader className="flex-row items-center gap-4 space-y-0">
          <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground">
            {draft ? initials(draft.fullName) : "…"}
          </div>
          <div>
            <CardTitle>{draft?.fullName ?? "Loading…"}</CardTitle>
            <CardDescription>{draft?.role ?? ""}</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {loading && !draft ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-9 w-full" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full name</Label>
                  <Input
                    id="fullName"
                    value={draft?.fullName ?? ""}
                    onChange={(e) => set("fullName", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="profile-role">Role</Label>
                  <Input
                    id="profile-role"
                    value={draft?.role ?? ""}
                    onChange={(e) => set("role", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="profile-email">Email</Label>
                  <Input
                    id="profile-email"
                    type="email"
                    value={draft?.email ?? ""}
                    onChange={(e) => set("email", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="profile-phone">Phone</Label>
                  <Input
                    id="profile-phone"
                    value={draft?.phone ?? ""}
                    onChange={(e) => set("phone", e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="profile-timezone">Time zone</Label>
                <Input
                  id="profile-timezone"
                  value={draft?.timezone ?? ""}
                  onChange={(e) => set("timezone", e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Used to label timestamps on the inquiries inbox.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="profile-bio">Notes</Label>
                <Textarea
                  id="profile-bio"
                  rows={3}
                  value={draft?.bio ?? ""}
                  onChange={(e) => set("bio", e.target.value)}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
          <CardDescription>
            This dashboard has no authentication — PRD §9.1 scopes it out, and §16.2 F1
            schedules it before any real data exists. Nothing here is a credential.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  )
}
