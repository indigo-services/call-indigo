/**
 * Security page — account authentication is managed by Clerk.
 *
 * This page holds one card on purpose. It used to hold a second, "Reset demo
 * data", which cleared a `localStorage` record no screen read; the app stores
 * nothing in the browser now, so the control cleared nothing and its button was
 * the only way to find that out. Removed with the record in #95.
 *
 * There is deliberately no password, 2FA or session control here: Clerk owns
 * all three, and a switch on this page would have to be wired to Clerk's API to
 * mean anything. The button below opens Clerk's own profile panel, which is the
 * real control surface.
 */
import { useClerk } from "@clerk/react"
import { ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PageHeader } from "@/admin/PageHeader"

export default function SecurityPage() {
  const clerk = useClerk()

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
            Clerk manages your password, multi-factor authentication, and active sessions.
            Dashboard access requires a membership in the Indigo Services organization in Clerk —
            not a flag on your profile — and what you can do inside it is set on{" "}
            <span className="font-medium text-foreground">Team</span>. Every request is checked
            again on the server, so this page describes the account; it does not grant anything.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" onClick={() => clerk.openUserProfile()}>
            Manage Clerk account
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
