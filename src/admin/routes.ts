/**
 * The admin navigation model — one source of truth for the sidebar, the
 * breadcrumb and each page's title.
 *
 * SCOPE NOTE. PRD §5.2 said rc1 contains exactly three `/admin` entries and
 * called any fourth a scope violation. This build deliberately goes further:
 * every sidebar item is now a real page and the inbox is new. The reasoning is
 * recorded in `docs/60-reference/dashboard-scope.md`, and §5.2's "no catch-all"
 * rule is still honoured — an unknown `/admin/*` path still redirects to the
 * inbox rather than rendering a fourth page by accident. The redirect is
 * `<Route path="*">` inside the `/admin` block of `src/App.tsx`; this comment
 * said "falls through to the home page" until 2026-09-27, which was wrong, and
 * nothing could see it because the suite asserts the behaviour, not this line.
 */
import {
  Bell,
  Component,
  Image,
  Inbox,
  Palette,
  Settings,
  Shield,
  User,
  type LucideIcon,
} from "lucide-react"

export interface AdminNavItem {
  /** Sidebar label and breadcrumb leaf. */
  title: string
  /** Absolute path, used by the router, the sidebar and the breadcrumb. */
  path: string
  icon: LucideIcon
  /** One line under the page heading. */
  description: string
}

export interface AdminNavGroup {
  label: string
  items: AdminNavItem[]
}

export const ADMIN_NAV: readonly AdminNavGroup[] = [
  {
    label: "Inbox",
    items: [
      {
        title: "Inquiries",
        path: "/admin/inquiries",
        icon: Inbox,
        description: "Every request submitted through the public inquiry form.",
      },
    ],
  },
  {
    label: "Settings",
    items: [
      {
        title: "General",
        path: "/admin/settings",
        icon: Settings,
        description: "Business details, used across the site and its documents.",
      },
      {
        title: "Profile",
        path: "/admin/profile",
        icon: User,
        description: "The signed-in operator's own details.",
      },
      {
        title: "Notifications",
        path: "/admin/notifications",
        icon: Bell,
        description: "What the team gets told about, and when.",
      },
      {
        title: "Security",
        path: "/admin/security",
        icon: Shield,
        description: "Sign-in protections and session behaviour.",
      },
    ],
  },
  {
    label: "Design",
    items: [
      {
        title: "Design System",
        path: "/admin/design",
        icon: Palette,
        description: "The brand tokens, read-only.",
      },
      {
        title: "Assets",
        path: "/admin/assets",
        icon: Image,
        description: "The images the marketing pages serve.",
      },
      {
        title: "Components",
        path: "/admin/components",
        icon: Component,
        description: "The primitives available to dashboard pages.",
      },
    ],
  },
]

export const ADMIN_ROUTES: readonly AdminNavItem[] = ADMIN_NAV.flatMap((g) => g.items)

/** The nav entry for a pathname, or undefined for an unknown path. */
export function findAdminRoute(pathname: string): AdminNavItem | undefined {
  return ADMIN_ROUTES.find((r) => r.path === pathname)
}
