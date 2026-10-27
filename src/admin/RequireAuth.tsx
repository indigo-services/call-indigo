/**
 * RequireAuth — the identity and organization gate around the `/admin` shell.
 *
 * This is a client-rendered Vite app. The guard controls which UI is shown; it
 * is not server authorization. Every admin read and write is authorized again by
 * the function that serves it — `api/inquiries.ts`, `api/settings.ts` and
 * `api/notification-settings.ts` each call `requireCapability()` before they
 * touch the database — so hiding this UI is a courtesy, not the boundary.
 *
 * Two steps, in this order:
 *
 *   1. **Which organization?** `resolveOrgAccess()` reads Clerk and answers with
 *      one of the two roles this plan can issue. Nothing else can answer this.
 *   2. **What may they do?** `useCapabilities()` asks `GET /api/me`, which is the
 *      same list the endpoints check against.
 *
 * Between the two, the shell renders from the *floor* in `clerkAuth.ts` — the
 * narrowest reading of the Clerk role. That ordering is what makes the guard safe
 * to render before step 2 answers: it can show an operator less than they are
 * entitled to for a moment, and can never show them more.
 */
import type { ReactNode } from "react"
import { useAuth, useClerk, useUser } from "@clerk/react"
import { Button } from "@/components/ui/button"
import {
  ADMIN_ORG_NAME,
  accessFrom,
  resolveOrgAccess,
  type AdminDenialReason,
} from "@/admin/clerkAuth"
import { AdminAccessContext } from "@/admin/access-context"
import { useCapabilities } from "@/admin/use-capabilities"
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

  const org = resolveOrgAccess({
    memberships: user?.organizationMemberships,
    activeOrgId: orgId,
    activeOrgRole: orgRole,
  })

  // Both hooks are called before any branch below, so the hook order is stable
  // across the loading → signed-in transition.
  const granted = useCapabilities(isLoaded && isSignedIn && org.allowed)

  if (!isLoaded || (isSignedIn && !isUserLoaded)) {
    return <AuthMessage title="Loading your account">Checking your Clerk session…</AuthMessage>
  }

  if (!isSignedIn) return <LoginPage />

  if (!org.allowed) return <AccessDenied reason={org.reason} />

  // The server's answer when it has arrived, the Clerk floor until then.
  const access = granted
    ? accessFrom(granted.role, granted.capabilities)
    : accessFrom(org.orgRole, org.capabilities)

  if (access.features.size === 0) {
    // Reachable if the server grants a level with no areas, or if this bundle is
    // older than the capabilities it was handed. An empty sidebar would read as a
    // broken page; this reads as a boundary.
    return (
      <AuthMessage title="No dashboard areas yet">
        <p>
          Your account is a member of {ADMIN_ORG_NAME}, but it has not been given access to any
          part of the dashboard.
        </p>
        <p className="mt-2">Ask an administrator to set your level.</p>
      </AuthMessage>
    )
  }

  return <AdminAccessContext.Provider value={access}>{children}</AdminAccessContext.Provider>
}

function AccessDenied({ reason }: { reason: AdminDenialReason }) {
  const { signOut } = useClerk()

  // Two different problems, two different instructions. "Not a member" and
  // "a member with a role this build does not recognise" both end in the same
  // screen, and telling someone to request the wrong thing is how a support
  // round-trip starts.
  return (
    <AuthMessage title="Admin access required">
      {reason === "insufficient-role" ? (
        <>
          <p>You are a member of {ADMIN_ORG_NAME}, but your Clerk role is not one this dashboard recognises.</p>
          <p className="mt-2">
            Ask an administrator to set your role to <strong>Admin</strong> or{" "}
            <strong>Member</strong> in Clerk.
          </p>
        </>
      ) : (
        <>
          <p>Your account is signed in but is not a member of {ADMIN_ORG_NAME}.</p>
          <p className="mt-2">
            Ask an administrator to add you to that organization in Clerk.
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
