/** Security page — account authentication is managed by Clerk. */
import { useState } from "react"
import { useClerk } from "@clerk/react"
import { ShieldCheck } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PageHeader } from "@/admin/PageHeader"
import { api } from "@/lib/data/api"

export default function SecurityPage() {
  const clerk = useClerk()
  const [resetting, setResetting] = useState(false)

  async function onResetDemo() {
    setResetting(true)
    try {
      await api.resetDemoData()
      toast.success("This browser's data cleared")
    } finally {
      setResetting(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Security" description="Manage sign-in and account security through Clerk." />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="size-4" />
            Clerk account security
          </CardTitle>
          <CardDescription>
            Clerk manages your password, multi-factor authentication, and active sessions. Admin
            dashboard access also requires the admin role in your Clerk public metadata.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" onClick={() => clerk.openUserProfile()}>
            Manage Clerk account
          </Button>
        </CardContent>
      </Card>

      <Card className="border-destructive/40">
        <CardHeader>
          <CardTitle>Reset demo data</CardTitle>
          <CardDescription>
            Clears the preference records this browser still holds. Leads, settings and
            notification delivery live on the server, so they are not affected — this does not
            delete a real inquiry, and it does not change your Clerk account or sign-in session.
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
