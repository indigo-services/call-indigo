/**
 * Seed fixtures for the local backend.
 *
 * Used once, on first run, to populate an empty store. After that the store is
 * whatever the user has done to it — `resetDemoData()` restores these.
 *
 * The inquiry set is deliberately varied: every status, both property types,
 * all three urgency levels, and dates spread across the last three weeks, so
 * the inbox's filters and sorting have something real to work against.
 */
import type {
  AdminProfile,
  Inquiry,
  NotificationPrefs,
  SecurityState,
  Service,
  SiteSettings,
  Urgency,
} from "@/lib/data/types"
import { THEME_TOKENS } from "@/lib/theme"

/** The shipped value of each theme token, keyed by its `SiteSettings` field. */
const THEME_DEFAULTS = Object.fromEntries(
  THEME_TOKENS.map((t) => [t.key, t.default]),
) as Pick<SiteSettings, "themeHome" | "themeResidential" | "themeCommercial">

/** ISO timestamp `daysAgo` days back, at `hour`:00 local time. */
function daysAgo(days: number, hour = 9): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  d.setHours(hour, 0, 0, 0)
  return d.toISOString()
}

export function createSeedInquiries(): Inquiry[] {
  const rows: Array<
    [string, string, string, "residential" | "commercial", Service, Urgency, Inquiry["status"], string, number]
  > = [
    [
      "Amanda Reyes",
      "amanda.reyes@example.com",
      "(512) 555-0142",
      "residential",
      "Plumbing",
      "emergency",
      "new",
      "Water is pooling under the kitchen sink and the cabinet floor is soaked. It started about an hour ago. I've shut off the valve under the sink but I'm not sure that's the right one.",
      0,
    ],
    [
      "Michael Sandoval",
      "m.sandoval@northloopprop.com",
      "(512) 555-0198",
      "commercial",
      "Electrical",
      "soon",
      "new",
      "We manage a 24-unit building on Burnet. Three units have dead outlets on the north wall and the breaker for that circuit trips under load. Need a panel inspection and a written scope before we approve anything.",
      1,
    ],
    [
      "Derrick Moore",
      "derrick@mooreprops.com",
      "(512) 555-0177",
      "commercial",
      "Handyman & Repairs",
      "flexible",
      "contacted",
      "Two make-readies coming up at the end of the month — unit 4B and 7A. Paint, patch drywall, replace two interior doors, and a punch list of about fifteen small items. Can we get a standing estimate?",
      3,
    ],
    [
      "Priya Natarajan",
      "priya.n@example.com",
      "(512) 555-0121",
      "residential",
      "HVAC",
      "soon",
      "contacted",
      "AC is running but not cooling below 82. Filter is clean, I replaced it last month. Upstairs is worse than downstairs.",
      5,
    ],
    [
      "Tom Whitfield",
      "tom.whitfield@example.com",
      "(512) 555-0163",
      "residential",
      "Carpentry & Remodeling",
      "flexible",
      "quoted",
      "Quote for a 16x20 deck off the back of the house, cedar, with a built-in bench. We discussed it on the phone on the 4th — following up to get it in writing.",
      7,
    ],
    [
      "Sandra Okafor",
      "s.okafor@lakesidefacilities.com",
      "(512) 555-0109",
      "commercial",
      "Plumbing",
      "emergency",
      "won",
      "Two restrooms down on the ground floor of the Lakeside building. We need someone tonight if at all possible — the building has tenants until 7pm.",
      9,
    ],
    [
      "Ben Carter",
      "ben.carter@example.com",
      "(512) 555-0154",
      "residential",
      "Painting & Make-Readies",
      "flexible",
      "won",
      "Interior repaint of the whole house before we list it. Roughly 2,100 sq ft, some drywall repair needed in the hallway where a door was replaced.",
      12,
    ],
    [
      "Lucia Fernández",
      "lucia.f@example.com",
      "(512) 555-0186",
      "residential",
      "Electrical",
      "soon",
      "lost",
      "Ceiling fan install in two bedrooms. Went with someone who could come same-week — no hard feelings, will call for the panel work later.",
      16,
    ],
    [
      "Grant Halloran",
      "grant@halloranmgmt.com",
      "(512) 555-0132",
      "commercial",
      "HVAC",
      "flexible",
      "contacted",
      "Rooftop units at the Kyle property are due for service. Not urgent, want it on the books for the shoulder season.",
      19,
    ],
  ]

  return rows.map((r, i) => {
    const [name, email, phone, propertyType, service, urgency, status, message, days] = r
    const created = daysAgo(days)
    return {
      id: `inq_seed_${String(i + 1).padStart(3, "0")}`,
      name,
      email,
      phone,
      propertyType,
      service,
      urgency,
      message,
      status,
      createdAt: created,
      updatedAt: created,
      notes: "",
    }
  })
}

/**
 * Defaults are the site's own published facts, written out literally rather
 * than imported from the dashboard's fixture module — a shared data layer must
 * not depend on `src/admin/**`, and these values are the seed, not a mock.
 * Source: valvoro-prototype/GROUND_TRUTH-source-facts.txt
 */
export const DEFAULT_SETTINGS: SiteSettings = {
  brandName: "Call Indigo",
  legalName: "Indigo Home & Facility Services",
  primaryPhone: "(512) 608-4999",
  publicEmail: "support@call-indigo.com",
  address: "1005 Meredith Drive, Austin, TX 78748",
  establishedYear: "2012",
  serviceArea: "Hays, Travis, and Williamson counties",
  licenseNumber: "RMP45574 EC23851",
  notificationEmail: "support@call-indigo.com",
  ...THEME_DEFAULTS,
}

export const DEFAULT_PROFILE: AdminProfile = {
  fullName: "Mock User",
  email: "admin@call-indigo.com",
  phone: "(512) 608-4999",
  role: "Owner / Dispatcher",
  bio: "Runs the board and takes the after-hours calls. Not a real account — this dashboard is unreleased software.",
  timezone: "America/Chicago (Central)",
}

export const DEFAULT_NOTIFICATIONS: NotificationPrefs = {
  emailOnLead: true,
  weeklySummary: false,
  emergencyAlerts: true,
  digestHour: 8,
}

export const DEFAULT_SECURITY: SecurityState = {
  twoFactorEnabled: false,
  passwordChangedAt: null,
  sessionTimeoutMinutes: 60,
}
