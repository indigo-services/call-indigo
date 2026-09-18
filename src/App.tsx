import { Routes, Route, Navigate } from "react-router-dom"
import { Toaster } from "sonner"

// Marketing pages (bespoke — PRD §8)
import HomePage from "@/marketing/pages/HomePage"
import ResidentialPage from "@/marketing/pages/ResidentialPage"
import CommercialPage from "@/marketing/pages/CommercialPage"

// Admin dashboard (registry-only — PRD §7)
import AdminLayout from "@/admin/AdminLayout"
import SettingsPage from "@/admin/SettingsPage"
import DesignSystemPage from "@/admin/DesignSystemPage"

export default function App() {
  return (
    <>
      <Routes>
        {/* Public routes — exact duplicates of the static prototype (PRD §5.1) */}
        <Route path="/" element={<HomePage />} />
        <Route path="/residential" element={<ResidentialPage />} />
        <Route path="/commercial" element={<CommercialPage />} />

        {/* Admin routes — exactly three entries, no catch-all (PRD §5.2) */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="/admin/settings" replace />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="design" element={<DesignSystemPage />} />
        </Route>

        {/* Fallback — redirect unknown routes to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {/* Sonner toaster — used by Settings page save action (PRD §10) */}
      <Toaster richColors position="top-right" />
    </>
  )
}
