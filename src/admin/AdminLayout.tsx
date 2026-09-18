/**
 * AdminLayout — the two-menu shadcn sidebar shell (PRD §9.2).
 *
 * Implemented as one inset sidebar containing two menu groups, matching
 * registry block sidebar-08 ("An inset sidebar with secondary navigation").
 *
 * Composition (PRD §9.2):
 *
 *   SidebarProvider
 *   └── Sidebar (variant="inset")        ← app-sidebar.tsx
 *       ├── SidebarHeader                ← Call Indigo mark + wordmark
 *       ├── SidebarContent
 *       │   ├── SidebarGroup             ← MENU 1: "Settings"   (nav-main.tsx)
 *       │   └── SidebarGroup             ← MENU 2: "Design"     (nav-secondary.tsx)
 *       ├── SidebarFooter                ← nav-user.tsx, mock identity
 *       └── SidebarRail
 *   └── SidebarInset
 *       └── SiteHeader (SidebarTrigger + Breadcrumb) + <Outlet />
 *
 * After running `npx shadcn@latest add sidebar-08`, the block files
 * (app-sidebar.tsx, nav-main.tsx, nav-secondary.tsx, nav-user.tsx) land
 * in src/components/ and are imported here.
 *
 * STUB — flesh out after running the shadcn CLI.
 */
import { Outlet } from "react-router-dom"

export default function AdminLayout() {
  return (
    <div className="min-h-screen bg-muted">
      {/* TODO: replace with the sidebar-08 block after `npx shadcn@latest add sidebar-08` */}
      <div className="flex">
        {/* Sidebar placeholder */}
        <aside className="hidden w-64 bg-sidebar text-sidebar-foreground lg:block">
          <div className="p-4">
            <p className="text-sm font-bold">Call Indigo</p>
            <p className="text-xs text-sidebar-foreground/60">Admin Dashboard</p>
          </div>
          <nav className="px-2 py-4 space-y-1">
            <a href="/admin/settings" className="block px-3 py-2 rounded text-sm hover:bg-sidebar-accent">
              Settings
            </a>
            <a href="/admin/design" className="block px-3 py-2 rounded text-sm hover:bg-sidebar-accent">
              Design System
            </a>
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
