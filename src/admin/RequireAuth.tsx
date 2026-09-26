/**
 * RequireAuth — the guard around the whole `/admin` shell.
 *
 * It wraps `AdminLayout` rather than sitting inside it. That placement is the
 * point: the layout renders the sidebar, breadcrumb and navigation, and an
 * unauthenticated visitor should see none of the dashboard's chrome. Wrapping
 * the layout makes the sign-in card the only thing on screen.
 *
 * It renders `LoginPage` **in place of** its children instead of navigating to a
 * separate route, so the URL a visitor asked for is the URL they land on once
 * they are through — no `?next=` round trip, and no redirect loop to get wrong.
 */
import type { ReactNode } from "react"
import LoginPage from "@/admin/LoginPage"
import { useAuth } from "@/admin/auth"

export default function RequireAuth({ children }: { children: ReactNode }) {
  const { signedIn } = useAuth()
  if (!signedIn) return <LoginPage />
  return <>{children}</>
}
