import { Routes, Route, Navigate } from "react-router-dom"
import { Toaster } from "sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { useSiteTheme } from "@/lib/use-theme"

// Marketing pages (bespoke — PRD §8)
import HomePage from "@/marketing/pages/HomePage"
import ResidentialPage from "@/marketing/pages/ResidentialPage"
import CommercialPage from "@/marketing/pages/CommercialPage"
import ContactPage from "@/marketing/pages/ContactPage"

// Admin dashboard (registry-only — PRD §7)
import AdminLayout from "@/admin/AdminLayout"
import RequireAuth from "@/admin/RequireAuth"
import InquiriesPage from "@/admin/InquiriesPage"
import SettingsPage from "@/admin/SettingsPage"
import ProfilePage from "@/admin/ProfilePage"
import NotificationsPage from "@/admin/NotificationsPage"
import SecurityPage from "@/admin/SecurityPage"
import DesignSystemPage from "@/admin/DesignSystemPage"
import AssetsPage from "@/admin/AssetsPage"
import ComponentsPage from "@/admin/ComponentsPage"
import { lazy, Suspense } from "react"

/**
 * The docs mirror is the one lazily-loaded admin page, and the reason is measured.
 *
 * `DocsPage` reads `docs/00-meta/doc-map.md` eagerly to build its index, and it pulls in
 * `marked` plus one chunk per document. Imported statically it moved the entry chunk from
 * **810.81 kB to 835.18 kB** — a 24 kB tax on every marketing visitor, for a page only a
 * signed-in operator ever opens. Lazily, the entry chunk is unchanged and the whole mirror
 * moves behind the navigation.
 *
 * `tests/docs-mirror.mjs` asserts this stays lazy: making it static again is otherwise a
 * silent regression that no other check would see.
 */
const DocsPage = lazy(() => import("@/admin/DocsPage"))

/**
 * The Suspense boundary for the lazy page, kept as its own component so the route itself
 * stays a single self-closing tag.
 *
 * ⚠️ That is load-bearing, not cosmetic. `tests/policy.mjs` locates the `/admin` catch-all
 * with a non-greedy match — from `<Route path="/admin"` to the FIRST closing tag after it.
 * Every admin child route is self-closing, so today that first close is the parent's own.
 * A child written with an explicit closing tag would end the match early, and the
 * "unknown /admin paths redirect rather than render a page" check would then inspect a
 * truncated block — passing while looking at the wrong thing. **Keep admin child routes
 * self-closing, or tighten that check before adding one that is not.**
 */
function DocsRoute() {
  return (
    <Suspense fallback={<p className="p-6 text-sm text-muted-foreground">Loading documentation…</p>}>
      <DocsPage />
    </Suspense>
  )
}

export default function App() {
  // Publishes the saved per-page primaries onto :root. Here rather than on the
  // marketing pages because those are raw HTML strings, and rather than in the
  // admin because the colours it edits are the public site's.
  useSiteTheme()

  return (
    <TooltipProvider>
      <Routes>
        {/* Public routes (PRD §5.1). The first three are exact duplicates of the
            static prototype; /contact is a real page added on top. */}
        <Route path="/" element={<HomePage />} />
        <Route path="/residential" element={<ResidentialPage />} />
        <Route path="/commercial" element={<CommercialPage />} />
        <Route path="/contact" element={<ContactPage />} />

        {/* Admin routes. The sidebar's source of truth is `src/admin/routes.ts`;
            this table must stay in step with it.

            The whole shell is behind `RequireAuth`, which is why the guard wraps
            `AdminLayout` here rather than living inside it: an unauthenticated
            visitor must not see the sidebar at all. `RequireAuth` renders the
            sign-in page in place of its children, so no `/admin/login` route
            exists and no redirect can loop. */}
        <Route
          path="/admin"
          element={
            <RequireAuth>
              <AdminLayout />
            </RequireAuth>
          }
        >
          <Route index element={<Navigate to="/admin/inquiries" replace />} />
          <Route path="inquiries" element={<InquiriesPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="security" element={<SecurityPage />} />
          <Route path="design" element={<DesignSystemPage />} />
          <Route path="assets" element={<AssetsPage />} />
          <Route path="components" element={<ComponentsPage />} />
          <Route path="docs" element={<DocsRoute />} />

          {/* An unknown /admin path redirects rather than rendering an empty
              shell. This is a redirect, not a page — so it does not reintroduce
              the "fourth page by accident" PRD §5.2 was guarding against. */}
          <Route path="*" element={<Navigate to="/admin/inquiries" replace />} />
        </Route>

        {/* Fallback — redirect unknown routes to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {/* Sonner toaster — dashboard save confirmations (PRD §10) */}
      <Toaster richColors position="top-right" />
    </TooltipProvider>
  )
}
