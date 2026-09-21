/**
 * Domain types for the dashboard's data layer.
 *
 * These are deliberately storage-agnostic: they describe the shape the pages
 * consume, not how it is persisted. The localStorage backend in `backend.ts`
 * and any future HTTP backend must both satisfy them (PRD §16.2 F2).
 */

/* ── Inquiries ───────────────────────────────────────────────────────────── */

export type InquiryStatus = "new" | "contacted" | "quoted" | "won" | "lost"

export type PropertyType = "residential" | "commercial"

export type Urgency = "emergency" | "soon" | "flexible"

/** The six services the site advertises, plus an escape hatch. */
export const SERVICES = [
  "Plumbing",
  "Electrical",
  "HVAC",
  "Carpentry & Remodeling",
  "Painting & Make-Readies",
  "Handyman & Repairs",
  "Not sure yet",
] as const

export type Service = (typeof SERVICES)[number]

export const URGENCIES: ReadonlyArray<{ value: Urgency; label: string; hint: string }> = [
  { value: "emergency", label: "Emergency", hint: "Typical arrival 30–60 min" },
  { value: "soon", label: "Within a few days", hint: "Non-urgent but prompt" },
  { value: "flexible", label: "Flexible", hint: "Get it on the schedule" },
]

export interface Inquiry {
  id: string
  name: string
  email: string
  phone: string
  propertyType: PropertyType
  service: Service
  urgency: Urgency
  message: string
  status: InquiryStatus
  /** ISO 8601. */
  createdAt: string
  updatedAt: string
  /** Internal follow-up notes, dashboard-only. */
  notes: string
}

/** The shape the public form submits — everything else is server-assigned. */
export type NewInquiry = Pick<
  Inquiry,
  "name" | "email" | "phone" | "propertyType" | "service" | "urgency" | "message"
>

/* ── Settings, profile, notifications, security ──────────────────────────── */

export interface SiteSettings {
  brandName: string
  legalName: string
  primaryPhone: string
  publicEmail: string
  address: string
  establishedYear: string
  serviceArea: string
  licenseNumber: string
  /** Where new-inquiry notification emails are delivered. */
  notificationEmail: string
  /**
   * Per-page marketing primaries, `#rrggbb`.
   *
   * These are the shipped defaults, and they are also the values the Design
   * System page's colour picker writes. Because Tailwind v4 emits
   * `background-color:var(--color-residential)`, setting the matching custom
   * property re-colours every surface that reads it — see `src/marketing/theme.ts`
   * for the token map and for why a saved value is per-browser.
   */
  themeHome: string
  themeResidential: string
  themeCommercial: string
}

export interface AdminProfile {
  fullName: string
  email: string
  phone: string
  role: string
  bio: string
  /** IANA-ish label, display only. */
  timezone: string
}

export interface NotificationPrefs {
  emailOnLead: boolean
  weeklySummary: boolean
  emergencyAlerts: boolean
  /** Daily digest hour, 0–23. */
  digestHour: number
}

export interface SecurityState {
  twoFactorEnabled: boolean
  /** ISO 8601 or null when the account has never rotated its password. */
  passwordChangedAt: string | null
  sessionTimeoutMinutes: number
}

/* ── Assets ──────────────────────────────────────────────────────────────── */

export type AssetGroup = "Brand" | "Photography" | "Icons" | "Logos"

export interface AssetRecord {
  name: string
  /** Served path, e.g. /assets/images/services-img1.jpg */
  path: string
  ext: string
  group: AssetGroup
}

/* ── Status presentation ─────────────────────────────────────────────────── */

export const INQUIRY_STATUSES: ReadonlyArray<{
  value: InquiryStatus
  label: string
  description: string
}> = [
  { value: "new", label: "New", description: "Not yet opened" },
  { value: "contacted", label: "Contacted", description: "We've reached out" },
  { value: "quoted", label: "Quoted", description: "Estimate sent" },
  { value: "won", label: "Won", description: "Job booked" },
  { value: "lost", label: "Lost", description: "Went elsewhere" },
]
