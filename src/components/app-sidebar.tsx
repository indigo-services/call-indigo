/**
 * AppSidebar — the dashboard's single inset sidebar (registry block sidebar-08).
 *
 * Every item is now a real route driven by `src/admin/routes.ts`, so the sidebar
 * and the breadcrumb cannot disagree. Two things are live rather than static:
 *
 *   · the Inquiries item carries a badge with the number of unread leads
 *   · the footer shows the profile from the store, so editing Profile is
 *     reflected here without a reload
 *
 * Navigation uses react-router `Link` rather than `<a href>` so moving between
 * dashboard pages is client-side and keeps the loaded state warm instead of
 * re-fetching every page's data on each click.
 */
import { Link, useLocation } from "react-router-dom"
import { UserButton, useAuth, useClerk, useUser } from "@clerk/react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import { ADMIN_NAV } from "@/admin/routes"
import { ExternalNavLinks } from "@/admin/ExternalNav"
import { can } from "@/admin/clerkAuth"
import { useAdminAccess } from "@/admin/access-context"
import { api } from "@/lib/data/api"
import { useApiData } from "@/lib/data/hooks"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const location = useLocation()
  const { signOut } = useClerk()
  const { user } = useUser()
  const { getToken } = useAuth()
  // Resolved once by <RequireAuth>. Reading it here rather than calling
  // resolveOrgAccess() again keeps the nav and the gate on one answer.
  const access = useAdminAccess()
  const inquiries = useApiData("sidebar-inquiries", () => api.listInquiries(getToken))

  const unread = inquiries.data?.filter((i) => i.status === "new").length ?? 0
  const displayName = user?.fullName ?? user?.primaryEmailAddress?.emailAddress ?? "Admin account"
  const email = user?.primaryEmailAddress?.emailAddress ?? ""

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link to="/admin/inquiries">
                <div className="flex aspect-square size-8 shrink-0 items-center justify-center rounded-full bg-sidebar-accent text-sidebar-accent-foreground">
                  {/* Brand mark — the client's icon lockup (PRD §11.1). Inline
                      rather than a component: §7.1 requires anything rendered
                      under /admin to come from the registry. Colour comes from
                      `sidebar-accent-foreground`, so it follows the token in
                      both themes. */}
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="size-[18px]"
                    aria-hidden="true"
                  >
                    <path d="M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384" />
                  </svg>
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">Call Indigo</span>
                  <span className="truncate text-xs">Admin Dashboard</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {ADMIN_NAV.map((group) => {
          // Filtered per ITEM, not per group. Issue #73 moves Design and
          // Reference into Settings sub-panes, so a group-level check would
          // either hand a member the whole group or hide all of it.
          const items = group.items.filter((item) => can(access, item.feature))
          if (items.length === 0) return null

          return (
            <SidebarGroup key={group.label}>
              <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
              <SidebarMenu>
                {items.map((item) => {
                  const isActive = location.pathname === item.path
                  const showBadge = item.path === "/admin/inquiries" && unread > 0
                  return (
                    <SidebarMenuItem key={item.path}>
                      <SidebarMenuButton asChild isActive={isActive} tooltip={item.title}>
                        <Link to={item.path}>
                          <item.icon />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                      {showBadge ? (
                        <SidebarMenuBadge aria-label={`${unread} new inquiries`}>
                          {unread}
                        </SidebarMenuBadge>
                      ) : null}
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroup>
          )
        })}

        {/* Clerk, Vercel and GitHub — the three dashboards this app does not
            host. They are `<a target="_blank">`, not `Link`: see
            `src/admin/ExternalNav.tsx` for why, and for the `noopener` /
            `noreferrer` reasoning.

            ⚠️ This group is NOT role-gated, and that is deliberate rather than an
            oversight. `RequireAuth` already refuses to render `AdminLayout` — and
            therefore this sidebar — to anyone without the admin role, so a
            `visibleTo` predicate here would be tautologically true for every
            render that can reach it. Issue #70 asks for the group to be
            admin-only; it already is, by the shell, and adding a second check
            that can never fail would read as a gate that does something. When
            #74 splits the admin role into per-feature permissions, THIS is the
            place to put the predicate — not before. */}
        <ExternalNavLinks />
      </SidebarContent>

      <SidebarFooter>
        <div className="px-3 py-2 text-xs text-sidebar-foreground/60">
          <p className="font-medium text-sidebar-foreground">
            {displayName}
          </p>
          <p className="truncate">{email}</p>
        </div>
        <div className="flex items-center justify-between gap-2 px-3 pb-2">
          <Link
            to="/"
            className="text-xs text-sidebar-foreground/60 underline-offset-2 hover:text-sidebar-foreground hover:underline"
          >
            ← Back to the site
          </Link>
          <UserButton />
          <button
            type="button"
            onClick={() => void signOut({ redirectUrl: "/" })}
            className="text-xs text-sidebar-foreground/60 underline-offset-2 hover:text-sidebar-foreground hover:underline"
          >
            Sign out
          </button>
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
