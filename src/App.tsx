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
import InquiriesPage from "@/admin/InquiriesPage"
import SettingsPage from "@/admin/SettingsPage"
import ProfilePage from "@/admin/ProfilePage"
import NotificationsPage from "@/admin/NotificationsPage"
import SecurityPage from "@/admin/SecurityPage"
import DesignSystemPage from "@/admin/DesignSystemPage"
import AssetsPage from "@/admin/AssetsPage"
import ComponentsPage from "@/admin/ComponentsPage"

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
            this table must stay in step with it. */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="/admin/inquiries" replace />} />
          <Route path="inquiries" element={<InquiriesPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="security" element={<SecurityPage />} />
          <Route path="design" element={<DesignSystemPage />} />
          <Route path="assets" element={<AssetsPage />} />
          <Route path="components" element={<ComponentsPage />} />

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
