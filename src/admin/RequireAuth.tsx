/**
 * RequireAuth — the identity and admin-role gate around the `/admin` shell.
 *
 * This is a client-rendered Vite app. The guard controls which UI is shown; it
 * is not server authorization. Admin data remains in this browser's
 * localStorage until the app has an authenticated backend.
 */
import type { ReactNode } from "react"
import { useAuth, useClerk, useUser } from "@clerk/react"
import { Button } from "@/components/ui/button"
import { hasAdminRole } from "@/admin/clerkAuth"
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
  const { isLoaded, isSignedIn } = useAuth()
  const { isLoaded: isUserLoaded, user } = useUser()

  if (!isLoaded || (isSignedIn && !isUserLoaded)) {
    return <AuthMessage title="Loading your account">Checking your Clerk session…</AuthMessage>
  }

  if (!isSignedIn) return <LoginPage />

  if (!hasAdminRole(user)) {
    return <AccessDenied />
  }

  return <>{children}</>
}

function AccessDenied() {
  const { signOut } = useClerk()

  return (
    <AuthMessage title="Admin access required">
      <p>Your account is signed in but is not assigned the admin role.</p>
      <p className="mt-2">
        Ask an administrator to assign <code>publicMetadata.role = "admin"</code> in Clerk.
      </p>
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
