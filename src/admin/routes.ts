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
  BookOpen,
  Component,
  Fingerprint,
  Github,
  Image,
  Inbox,
  Palette,
  Settings,
  Shield,
  Triangle,
  User,
  type LucideIcon,
} from "lucide-react"

import type { AdminFeature } from "@/admin/clerkAuth"

export interface AdminNavItem {
  /** Sidebar label and breadcrumb leaf. */
  title: string
  /** Absolute path, used by the router, the sidebar and the breadcrumb. */
  path: string
  icon: LucideIcon
  /** One line under the page heading. */
  description: string
  /**
   * The access area this page belongs to. The sidebar filters on it with
   * `can()`, so this field — not the group label — is what a role grants.
   * Grouping may change (issue #73); the areas must not.
   */
  feature: AdminFeature
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
        feature: "inbox",
        icon: Inbox,
        description: "Every request submitted through the public inquiry form.",
      },
    ],
  },
  {
    // One label for the whole back office. Design and Reference were groups of
    // their own until issue #73; they are sub-panes here now, because the person
    // who changes the business phone number and the person who changes a brand
    // colour are the same person on the same errand, and four top-level groups
    // made a nine-page dashboard look like four products.
    //
    // ⚠️ `feature` is what access grants — NOT this label. A member sees four of
    // these eight, and #74's permission model reads the item, never the group.
    // Keep it that way: regrouping must not move a permission.
    label: "Settings",
    items: [
      {
        title: "General",
        path: "/admin/settings",
        feature: "settings",
        icon: Settings,
        description: "Business details, used across the site and its documents.",
      },
      {
        title: "Profile",
        path: "/admin/profile",
        feature: "settings",
        icon: User,
        description: "The signed-in operator's own details.",
      },
      {
        title: "Notifications",
        path: "/admin/notifications",
        feature: "settings",
        icon: Bell,
        description: "What the team gets told about, and when.",
      },
      {
        title: "Security",
        path: "/admin/security",
        feature: "settings",
        icon: Shield,
        description: "Clerk account and session controls.",
      },
      {
        title: "Design System",
        path: "/admin/design",
        feature: "design",
        icon: Palette,
        description: "The brand tokens, read-only.",
      },
      {
        title: "Assets",
        path: "/admin/assets",
        feature: "design",
        icon: Image,
        description: "The images the marketing pages serve.",
      },
      {
        title: "Components",
        path: "/admin/components",
        feature: "design",
        icon: Component,
        description: "The primitives available to dashboard pages.",
      },
      {
        title: "Documentation",
        path: "/admin/docs",
        feature: "reference",
        icon: BookOpen,
        description: "The project's documentation library, read-only.",
      },
    ],
  },
]

export const ADMIN_ROUTES: readonly AdminNavItem[] = ADMIN_NAV.flatMap((g) => g.items)

/** The nav entry for a pathname, or undefined for an unknown path. */
export function findAdminRoute(pathname: string): AdminNavItem | undefined {
  return ADMIN_ROUTES.find((r) => r.path === pathname)
}

/* ── External links (issue #70) ──────────────────────────────────────────── */

/**
 * A link that leaves the app.
 *
 * Deliberately NOT an `AdminNavItem` with optional fields. The two shapes differ
 * in more than their property names, and merging them would put four meaningless
 * combinations in the type (`path` + `href`, neither, both, an external item
 * with a `description` that no surface renders):
 *
 *   · `AdminNavItem.path` is a **route**. It is resolved by `findAdminRoute()`,
 *     compared against `useLocation().pathname` for the active pill, and matched
 *     against `App.tsx` by `tests/policy.mjs`. An external URL in that field
 *     would make the breadcrumb look for a route called `https://…` and would
 *     fail the router/sidebar agreement check.
 *   · An external item is never "current", never breadcrumbed, and never a
 *     router destination. It opens a new tab.
 *
 * Keeping them apart is what lets `ADMIN_ROUTES` stay a complete list of the
 * app's own pages — the property every check in `policy.mjs` depends on.
 */
export interface AdminExternalNavItem {
  /** Sidebar label and the link's accessible name. */
  title: string
  /** Absolute URL. Validated as such by `tests/policy.mjs`. */
  href: string
  icon: LucideIcon
}

export interface AdminExternalNavGroup {
  label: string
  items: AdminExternalNavItem[]
}

/**
 * The three dashboards an operator needs and this app does not host.
 *
 * **Hard-coded, not read from `VITE_*`.** These are not per-environment: the
 * Clerk dashboard, the Vercel project and the GitHub repository are the same
 * three addresses in local, preview and production. An env var would add three
 * required configuration values to every deploy to express something that never
 * varies, and a missing one would render a dead link instead of failing loudly.
 * If a URL ever does need to vary, that is the moment to add the variable — and
 * `tests/policy.mjs` asserts every href here is absolute, so the change cannot
 * be made silently.
 */
export const ADMIN_EXTERNAL_NAV: readonly AdminExternalNavGroup[] = [
  {
    label: "Dashboards",
    items: [
      {
        title: "Clerk",
        href: "https://dashboard.clerk.com",
        icon: Fingerprint,
      },
      {
        title: "Vercel",
        href: "https://vercel.com/indigo-projects",
        icon: Triangle,
      },
      {
        title: "GitHub",
        href: "https://github.com/indigo-services/call-indigo",
        icon: Github,
      },
    ],
  },
]
