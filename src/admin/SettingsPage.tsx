/**
 * Settings page — /admin/settings (PRD §10).
 *
 * Mockup. All state is useState; a reload resets it. Registry components only.
 *
 * Three tabs:
 *   - General:     business name, legal name, phone, email, service area
 *   - Appearance:  theme (Light/Dark/System), accent preview, reduce-motion switch
 *   - Notifications: email on new lead, weekly summary, emergency-page alerts
 *
 * Save action shows a toast: "Saved (mockup — nothing was persisted)".
 * The toast must not claim success it did not achieve (PRD §10).
 *
 * Field values are seeded from GROUND_TRUTH-source-facts.txt (PRD §10).
 *
 * STUB — flesh out after running `npx shadcn@latest add tabs card field label
 * input select switch radio-group separator badge button sonner tooltip`.
 */
import { useState } from "react"
import { toast } from "sonner"
import { siteFacts } from "@/admin/mock/tokens"

export default function SettingsPage() {
  const [businessName, setBusinessName] = useState(siteFacts.brandName)
  const [legalName, setLegalName] = useState(siteFacts.legalName)
  const [phone, setPhone] = useState(siteFacts.primaryPhone)
  const [email, setEmail] = useState(siteFacts.publicEmail)

  const handleSave = () => {
    toast.success("Saved (mockup — nothing was persisted)")
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Mockup — all changes are in-memory only. Reloading discards state.
        </p>
      </div>

      {/* TODO: implement Tabs with three tab panels (General, Appearance, Notifications) */}
      <div className="rounded-lg border border-border bg-card p-6">
        <h2 className="text-lg font-semibold text-card-foreground mb-4">General</h2>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground">Business name</label>
            <input
              className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground">Legal name</label>
            <input
              className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
              value={legalName}
              onChange={(e) => setLegalName(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground">Phone</label>
            <input
              className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground">Email</label>
            <input
              className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground">Service area</label>
            <p className="mt-1 text-sm text-muted-foreground">{siteFacts.serviceArea}</p>
          </div>
        </div>
        <button
          className="mt-6 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
          onClick={handleSave}
        >
          Save changes
        </button>
      </div>
    </div>
  )
}
