/**
 * The resolved admin access, carried from the gate to the surfaces that need it.
 *
 * `RequireAuth` resolves access once, and the sidebar filters its nav by it. A
 * context rather than a second `resolveOrgAccess()` call in the sidebar: two
 * calls would be two reads of Clerk state that could disagree mid-render, and
 * the sidebar is the one place where a disagreement is visible as a nav item that
 * flickers in and out. It carries the capability list too, so the nav is built
 * from the server's answer rather than a second table of its own.
 *
 * The context is non-null inside the admin shell because `RequireAuth` renders
 * nothing else — but `useAdminAccess` still throws rather than returning a
 * permissive default. A default of "allowed" is how a gate quietly stops gating;
 * a default of "denied" would render an empty sidebar and look like a bug.
 */
import { createContext, useContext } from "react"
import type { AdminAccess } from "@/admin/clerkAuth"

export const AdminAccessContext = createContext<AdminAccess | null>(null)

export function useAdminAccess(): AdminAccess {
  const access = useContext(AdminAccessContext)
  if (!access) {
    throw new Error("useAdminAccess() was called outside the admin shell — wrap the tree in <RequireAuth>")
  }
  return access
}
