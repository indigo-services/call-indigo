/**
 * The shipped `DEFAULT_*` records.
 *
 * These are not fixtures any more. A record reaches this module when
 * `GET /api/settings?key=…` answers `value: null` — the server has never been
 * written for that key — and `api.ts` merges the default underneath the empty
 * object so a page renders the site's real phone number rather than a blank
 * field. The server does not seed itself on a read: a read that writes is a read
 * that cannot be cached or retried safely.
 *
 * **The demo inbox is gone (#95).** A fixture function used to hand the browser store
 * nine plausible leads on first run, and the Security page's "Reset demo data" button
 * restored them. Once the inbox read Postgres, the only way to see those rows was to
 * believe the dashboard was showing real work — the fixture outlived its purpose by a
 * release and was deleted with the store it belonged to.
 */
import type { AdminProfile, NotificationPrefs, SiteSettings } from "@/lib/data/types"
import { THEME_TOKENS } from "@/lib/theme"

/** The shipped value of each theme token, keyed by its `SiteSettings` field. */
const THEME_DEFAULTS = Object.fromEntries(
  THEME_TOKENS.map((t) => [t.key, t.default]),
) as Pick<SiteSettings, "themeHome" | "themeResidential" | "themeCommercial">

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

/**
 * What a lead announcement does before anyone has chosen otherwise: mail every lead,
 * and never suppress an emergency.
 *
 * These two are the only preference fields there are — `weeklySummary` and
 * `digestHour` were removed rather than left editable and unread (#93, #115).
 *
 * `api/_lib/notifications.ts` keeps its own copy, because a runtime import from
 * `src/` fails inside the deployed function. `tests/backend.mjs` asserts the two
 * agree, so this is a copy with a guard rather than a second source of truth.
 */
export const DEFAULT_NOTIFICATIONS: NotificationPrefs = {
  emailOnLead: true,
  emergencyAlerts: true,
}
