/**
 * RequireAuth — the identity and role gate around the `/admin` shell.
 *
 * This is a client-rendered Vite app. The guard controls which UI is shown; it
 * is not server authorization. Every admin read and write is authorized again by
 * the function that serves it — `api/inquiries.ts` and `api/settings.ts` both call
 * `requireAdmin` before they touch the database — so hiding this UI is a courtesy,
 * not the boundary. What is left in this browser is the `security` record, which
 * has no server-side meaning yet.
 *
 * Access is decided by `resolveAdminAccess()` and nowhere else — this component
 * only supplies it with the two things Clerk knows: the user's organization
 * memberships, and the organization selected in this session.
 */
import type { ReactNode } from "react"
import { useAuth, useClerk, useUser } from "@clerk/react"
import { Button } from "@/components/ui/button"
import { ADMIN_ORG_NAME, resolveAdminAccess, type AdminAccess } from "@/admin/clerkAuth"
import { AdminAccessContext } from "@/admin/access-context"
import LoginPage from "@/admin/LoginPage"

function AuthMessage({ title, children }: { title: string; children: ReactNode }) {
  return (
    <main className="grid min-h-screen place-items-center bg-muted/40 p-6">
      <section className="w-full max-w-lg space-y-3 rounded-xl border bg-card p-6 text-center shadow-sm">
        <h1 className="text-xl font-semibold">{title}</h1>
        <div className="text-sm text-muted-foreground">{children}</div>
      </section>
    </main>
  )
}

function ClerkAuthBoundary({ children }: { children: ReactNode }) {
  const { isLoaded, isSignedIn, orgId, orgRole } = useAuth()
  const { isLoaded: isUserLoaded, user } = useUser()

  if (!isLoaded || (isSignedIn && !isUserLoaded)) {
    return <AuthMessage title="Loading your account">Checking your Clerk session…</AuthMessage>
  }

  if (!isSignedIn) return <LoginPage />

  const access = resolveAdminAccess({
    memberships: user?.organizationMemberships,
    activeOrgId: orgId,
    activeOrgRole: orgRole,
  })

  if (!access.allowed) return <AccessDenied access={access} />

  return <AdminAccessContext.Provider value={access}>{children}</AdminAccessContext.Provider>
}

function AccessDenied({ access }: { access: AdminAccess }) {
  const { signOut } = useClerk()

  // Two different problems, two different instructions. "Not a member" and
  // "a member without the right role" both end in the same screen, and telling
  // someone to request the wrong thing is how a support round-trip starts.
  return (
    <AuthMessage title="Admin access required">
      {access.reason === "insufficient-role" ? (
        <>
          <p>You are a member of {ADMIN_ORG_NAME}, but your role does not include the dashboard.</p>
          <p className="mt-2">
            Ask an administrator to change your role to <strong>Admin</strong> in Clerk.
          </p>
        </>
      ) : (
        <>
          <p>Your account is signed in but is not a member of {ADMIN_ORG_NAME}.</p>
          <p className="mt-2">
            Ask an administrator to add you to that organization in Clerk with the{" "}
            <strong>Admin</strong> role.
          </p>
        </>
      )}
      <Button className="mt-5" variant="outline" onClick={() => void signOut({ redirectUrl: "/" })}>
        Sign out
      </Button>
    </AuthMessage>
  )
}

export default function RequireAuth({
  children,
  clerkConfigured,
}: {
  children: ReactNode
  clerkConfigured: boolean
}) {
  if (!clerkConfigured) {
    return (
      <AuthMessage title="Admin sign-in is not configured">
        Add the Clerk publishable key to this Vercel environment to enable dashboard sign-in.
      </AuthMessage>
    )
  }

  return <ClerkAuthBoundary>{children}</ClerkAuthBoundary>
}
