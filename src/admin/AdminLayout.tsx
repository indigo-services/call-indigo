/**
 * AdminLayout — the shadcn sidebar shell that wraps every `/admin` page.
 *
 * One inset sidebar containing two menu groups — Inbox, and Settings with its
 * nine sub-panes — following registry block sidebar-08 (PRD §9.2). It was four
 * groups until issue #73; Design and Reference are sub-panes now, because four
 * top-level labels made a ten-page dashboard read as four products. The
 * breadcrumb's leaf comes from the shared nav model in `routes.ts`, so a page
 * cannot be added to the sidebar without also getting a correct breadcrumb.
 *
 * ⚠️ **The nav filter is not a guard.** The sidebar hides a link the caller's
 * capabilities do not open, but the route is still mounted — so a Service Rep who
 * types `/admin/settings` would get a page that loads (the `site` read is public)
 * and then answers `403` on every save. This component is where that is closed: the
 * outlet is replaced by a named refusal, so a URL cannot reach a surface the nav
 * hides. One check, in one place, covering every route.
 */
import { Link, Outlet, useLocation } from "react-router-dom"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { can } from "@/admin/clerkAuth"
import { useAdminAccess } from "@/admin/access-context"
import { findAdminRoute } from "@/admin/routes"

/** Shown instead of a page the caller's capabilities do not open. */
function NotAvailable({ title }: { title: string }) {
  return (
    <div className="rounded-lg border bg-card p-6 text-sm">
      <p className="font-medium text-foreground">{title} is not part of your access.</p>
      <p className="mt-1 text-muted-foreground">
        An administrator sets what each level may open. Your inbox is unaffected.
      </p>
      <Button asChild size="sm" variant="outline" className="mt-4">
        <Link to="/admin/inquiries">Go to the inbox</Link>
      </Button>
    </div>
  )
}

export default function AdminLayout() {
  const location = useLocation()
  const access = useAdminAccess()
  const route = findAdminRoute(location.pathname)

  // An unknown path is left to the router (the outlet renders nothing). Only a
  // route we know about, whose feature this caller lacks, is refused here.
  const denied = route && !can(access, route.feature) ? route : null

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink asChild>
                    <Link to="/admin/inquiries">Admin</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>{route?.title ?? "Not found"}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          {denied ? <NotAvailable title={denied.title} /> : <Outlet />}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
