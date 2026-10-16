/** Mount Clerk only for /admin so public marketing visitors do not download it. */
import { ClerkProvider } from "@clerk/react"
import { shadcn } from "@clerk/themes"
import { useNavigate } from "react-router-dom"
import AdminLayout from "@/admin/AdminLayout"
import RequireAuth from "@/admin/RequireAuth"

const clerkPublishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

function AdminShell() {
  return (
    <RequireAuth clerkConfigured>
      <AdminLayout />
    </RequireAuth>
  )
}

export default function AdminArea() {
  const navigate = useNavigate()

  if (!clerkPublishableKey) {
    return (
      <RequireAuth clerkConfigured={false}>
        <AdminLayout />
      </RequireAuth>
    )
  }

  return (
    <ClerkProvider
      publishableKey={clerkPublishableKey}
      routerPush={(to) => navigate(to)}
      routerReplace={(to) => navigate(to, { replace: true })}
      appearance={{
        theme: shadcn,
        options: {
          logoImageUrl: "/assets/images/call-indigo-logo.svg",
          logoLinkUrl: "/",
        },
      }}
    >
      <AdminShell />
    </ClerkProvider>
  )
}
