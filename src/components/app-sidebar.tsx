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
 * dashboard pages is client-side and keeps the localStorage-backed state warm.
 */
import { Link, useLocation } from "react-router-dom"

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
import { api } from "@/lib/data/api"
import { useApiData } from "@/lib/data/hooks"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const location = useLocation()
  const inquiries = useApiData("sidebar-inquiries", () => api.listInquiries())
  const profile = useApiData("sidebar-profile", () => api.getProfile())

  const unread = inquiries.data?.filter((i) => i.status === "new").length ?? 0

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link to="/admin/inquiries">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-accent text-sidebar-accent-foreground">
                  <span className="text-sm font-bold">CI</span>
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
        {ADMIN_NAV.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarMenu>
              {group.items.map((item) => {
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
        ))}
      </SidebarContent>

      <SidebarFooter>
        <div className="px-3 py-2 text-xs text-sidebar-foreground/60">
          <p className="font-medium text-sidebar-foreground">
            {profile.data?.fullName ?? "…"}
          </p>
          <p className="truncate">{profile.data?.email ?? "…"}</p>
        </div>
        <div className="px-3 pb-2">
          <Link
            to="/"
            className="text-xs text-sidebar-foreground/60 underline-offset-2 hover:text-sidebar-foreground hover:underline"
          >
            ← Back to the site
          </Link>
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
