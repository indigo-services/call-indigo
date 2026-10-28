/**
 * AppSidebar — the dashboard's single inset sidebar (registry block sidebar-08).
 *
 * Every item is now a real route driven by `src/admin/routes.ts`, so the sidebar
 * and the breadcrumb cannot disagree. Three things are live rather than static:
 *
 *   · the Inquiries item carries a badge with the number of unread leads
 *   · the footer shows the profile from the store, so editing Profile is
 *     reflected here without a reload
 *   · the footer's account control opens Clerk's own modal (#106)
 *
 * Navigation uses react-router `Link` rather than `<a href>` so moving between
 * dashboard pages is client-side and keeps the loaded state warm instead of
 * re-fetching every page's data on each click.
 *
 * ── The two links every role gets (#106) ────────────────────────────────────
 *
 * Both halves of "a home link and an account link" already existed, and neither
 * read that way on screen: the home link was a 12px footnote sharing a row with
 * the sign-out text, and the account control was a bare `<UserButton />` avatar
 * with no words beside it. The client reported both as missing, which is the
 * correct reading of a screenshot — an operator who has not been told what the
 * circle is has no account link. The treatment was the defect, not the presence.
 *
 * ⚠️ **The account control is Clerk's modal, NOT `/admin/profile`.** That page is
 * tagged `settings` (`src/admin/routes.ts`), a `service_rep` holds
 * `inbox:read`/`inbox:write` and nothing else (`api/_lib/roles.ts`), so
 * `AdminLayout` replaces the outlet with the refusal screen — and
 * `PUT /api/settings?key=profile` would answer 403 even if it rendered. A rep's
 * "your account" surface is Clerk's own account modal — name, email, password,
 * sessions — which every signed-in person has regardless of staff level.
 * `openUserProfile()` is one call, no route, no capability.
 *
 * Do not "tidy" this into a `<Link to="/admin/profile">`. It would work for an
 * admin, which is exactly why the mistake would survive a review by one.
 */
import { Link, useLocation } from "react-router-dom"
import { useAuth, useClerk, useUser } from "@clerk/react"
import { House, LogOut, UserRound } from "lucide-react"

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
  const { openUserProfile, signOut } = useClerk()
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

            ✅ This group IS gated, by `accounts:read` (#104). It was not until
            then, and the comment that used to sit here is worth remembering
            because it was confidently wrong: it argued the group needed no gate
            since `RequireAuth` refused anyone without the admin role, making a
            predicate "tautologically true for every render that can reach it".

            That held while there was one admin role. #100 split it into three
            staff levels, `RequireAuth.tsx` refuses only when
            `access.features.size === 0`, and a `service_rep` holds `inbox:read`
            — so the size was 1, the shell rendered, and the rep was shown three
            organization-level vendor accounts they cannot open. Nothing failed:
            a comment that explains why a guard is absent stops anyone looking
            for the guard when the premise changes.

            So the rule is the internal groups' rule, and it lives in the
            component: `ExternalNavLinks` filters each item with `can()`, and
            `access` is a required prop. Do not replace that with a `role`
            comparison here — two access rules beside each other is the drift
            #100 spent a release removing. */}
        <ExternalNavLinks access={access} />

        {/* The way out, for every role (#106). Its own group at the bottom of
            the nav rather than a footnote in the footer: the same link, one
            treatment up, where it is reachable without reading small print.

            ⚠️ Deliberately NOT an `AdminNavItem`. `path` there is a *route* —
            `findAdminRoute()` resolves it for the breadcrumb, and
            `tests/policy.mjs` asserts every one of those is mounted in
            `App.tsx`. `/` is the marketing site, not a page of this app, and
            putting it in `ADMIN_ROUTES` would make the crumb read "Not found"
            on the home page.

            ⚠️ And no `can()` — that is the requirement, not an omission. The
            site is public, so every level including a `service_rep` may leave
            for it. A `feature` on this item would be the one nav decision the
            capability model does not own, which is the drift #104 removed. */}
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Back to the site">
                <Link to="/">
                  <House />
                  <span>Back to the site</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <div className="px-3 py-2 text-xs text-sidebar-foreground/60">
          <p className="font-medium text-sidebar-foreground">
            {displayName}
          </p>
          <p className="truncate">{email}</p>
        </div>
        {/* Two labelled controls of one shape. `<UserButton />` stood here as a
            bare avatar: it opens the same modal as `openUserProfile()` and
            carries no words, which is why the account settings could not be
            found on screen. Nothing is lost by replacing it — the name and the
            address directly above are the identity it was showing — and the
            avatar was the only unlabelled control left in the sidebar. */}
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              type="button"
              tooltip="Your account"
              onClick={() => openUserProfile()}
            >
              <UserRound />
              <span>Your account</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              type="button"
              tooltip="Sign out"
              onClick={() => void signOut({ redirectUrl: "/" })}
            >
              <LogOut />
              <span>Sign out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
