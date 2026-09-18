/**
 * Security page — /admin/security.
 *
 * Honest about what it is: there is no authentication in this build (PRD §9.1
 * scopes it out), so nothing here protects anything. The controls are wired to
 * real state so the page behaves like the product it is standing in for, and
 * the password form validates and records a rotation — but it is storing a
 * timestamp, not a credential, and the page says so rather than implying
 * otherwise.
 */
import { useState, type FormEvent } from "react"
import { toast } from "sonner"
import { AlertTriangle, KeyRound, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
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
import type { SecurityState } from "@/lib/data/types"
import { formatDateTime } from "@/lib/format"

const TIMEOUTS = [
  { value: 15, label: "15 minutes" },
  { value: 30, label: "30 minutes" },
  { value: 60, label: "1 hour" },
  { value: 240, label: "4 hours" },
  { value: 0, label: "Never sign out" },
]

export default function SecurityPage() {
  const { data, loading } = useApiData("admin-security", () => api.getSecurity())
  const { draft, setDraft, dirty, reset } = useDraft<SecurityState>(data)

  const [current, setCurrent] = useState("")
  const [next, setNext] = useState("")
  const [confirm, setConfirm] = useState("")
  const [pwError, setPwError] = useState<string | null>(null)
  const [resetting, setResetting] = useState(false)

  async function onSave() {
    if (!draft) return
    await api.saveSecurity(draft)
    toast.success("Security settings saved")
  }

  async function onChangePassword(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setPwError(null)

    if (current.trim() === "") return setPwError("Enter your current password.")
    if (next.length < 10) return setPwError("Use at least 10 characters.")
    if (next !== confirm) return setPwError("The two new passwords do not match.")

    await api.saveSecurity({
      ...(draft ?? {
        twoFactorEnabled: false,
        passwordChangedAt: null,
        sessionTimeoutMinutes: 60,
      }),
      passwordChangedAt: new Date().toISOString(),
    })
    setCurrent("")
    setNext("")
    setConfirm("")
    toast.success("Password updated (demo — nothing is stored)")
  }

  async function onResetDemo() {
    setResetting(true)
    try {
      await api.resetDemoData()
      toast.success("Demo data reset to the seed fixtures")
    } finally {
      setResetting(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Security" description="Sign-in protections and session behaviour.">
        <Button variant="outline" onClick={reset} disabled={!dirty}>
          Discard
        </Button>
        <Button onClick={onSave} disabled={!dirty}>
          Save changes
        </Button>
      </PageHeader>

      <Card className="border-amber-300/60 bg-amber-50/50">
        <CardHeader className="flex-row items-start gap-3 space-y-0">
          <AlertTriangle className="mt-0.5 size-5 shrink-0 text-amber-600" />
          <div>
            <CardTitle className="text-base">There is no authentication yet</CardTitle>
            <CardDescription>
              Anyone who reaches <code className="text-xs">/admin</code> has full access. PRD
              §16.2 F1 schedules auth, and it should land before this dashboard is pointed
              at anything real.
            </CardDescription>
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="size-4" />
            Access
          </CardTitle>
          <CardDescription>
            {dirty ? "You have unsaved changes." : "Saved to this browser's local store."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {loading && !draft ? (
            <Skeleton className="h-10 w-full" />
          ) : (
            <>
              <div className="flex items-center justify-between gap-6">
                <div className="space-y-0.5">
                  <Label htmlFor="twoFactorEnabled">Two-factor authentication</Label>
                  <p className="text-sm text-muted-foreground">
                    Require a second factor when signing in.
                  </p>
                </div>
                <Switch
                  id="twoFactorEnabled"
                  checked={draft?.twoFactorEnabled ?? false}
                  onCheckedChange={(v) => setDraft((p) => ({ ...p, twoFactorEnabled: v }))}
                />
              </div>

              <Separator />

              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <Label htmlFor="sessionTimeout">Sign out after inactivity</Label>
                  <p className="text-sm text-muted-foreground">
                    Applies to an idle dashboard session.
                  </p>
                </div>
                <Select
                  value={String(draft?.sessionTimeoutMinutes ?? 60)}
                  onValueChange={(v) => setDraft((p) => ({ ...p, sessionTimeoutMinutes: Number(v) }))}
                >
                  <SelectTrigger id="sessionTimeout" className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIMEOUTS.map((t) => (
                      <SelectItem key={t.value} value={String(t.value)}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <p className="text-sm text-muted-foreground">
                Last password change:{" "}
                <span className="font-medium text-foreground">
                  {draft?.passwordChangedAt ? formatDateTime(draft.passwordChangedAt) : "never"}
                </span>
              </p>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KeyRound className="size-4" />
            Change password
          </CardTitle>
          <CardDescription>
            Demo only — the form validates and records the date, but no password is stored
            and none is checked.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onChangePassword} className="grid gap-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="current-password">Current</Label>
                <Input
                  id="current-password"
                  type="password"
                  autoComplete="current-password"
                  value={current}
                  onChange={(e) => setCurrent(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-password">New</Label>
                <Input
                  id="new-password"
                  type="password"
                  autoComplete="new-password"
                  value={next}
                  onChange={(e) => setNext(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm new</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  autoComplete="new-password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                />
              </div>
            </div>
            {pwError ? (
              <p role="alert" className="text-sm font-medium text-destructive">
                {pwError}
              </p>
            ) : null}
            <div>
              <Button type="submit" variant="outline">
                Update password
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="border-destructive/40">
        <CardHeader>
          <CardTitle>Danger zone</CardTitle>
          <CardDescription>
            Clears every key this dashboard has written and restores the seed fixtures.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="destructive" onClick={onResetDemo} disabled={resetting}>
            {resetting ? "Resetting…" : "Reset demo data"}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
