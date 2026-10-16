/**
 * The admin role marker is written through Clerk's trusted dashboard/backend.
 * This helper fails closed when the signed-in user has no public metadata role.
 * In this SPA it protects the dashboard UI only; it is not server authorization.
 */
export type ClerkRoleUser =
  | {
      publicMetadata?: Record<string, unknown> | null
    }
  | null
  | undefined

export function hasAdminRole(user: ClerkRoleUser): boolean {
  return user?.publicMetadata?.role === "admin"
}
