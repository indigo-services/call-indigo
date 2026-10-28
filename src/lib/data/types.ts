/**
 * Domain types for the dashboard's data layer.
 *
 * These are deliberately storage-agnostic: they describe the shape the pages
 * consume, not how it is persisted. Every one of them now crosses `/api/*` as
 * JSON, so they are also the contract with `api/` — which keeps its own copies,
 * because a runtime import from `src/` fails inside the deployed function
 * (PRD §16.2 F2).
 */

/* ── Inquiries ───────────────────────────────────────────────────────────── */

export type InquiryStatus = "new" | "contacted" | "quoted" | "won" | "lost"

export type PropertyType = "residential" | "commercial"

export type Urgency = "emergency" | "soon" | "flexible"

/**
 * The answer to "Already a member?" — the one question the public form asks
 * before it asks for a name.
 *
 * There is deliberately no "unknown" member: a third option would let the form
 * record a non-answer, and the dashboard cannot act on one. Callers that need
 * to represent a record predating the question use `undefined` instead.
 */
export type MemberAnswer = "yes" | "no"

export const MEMBER_ANSWERS: ReadonlyArray<{ value: MemberAnswer; label: string }> = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
]

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
  /**
   * Optional on the way OUT: inquiries written before 2026-09-25 predate the
   * question, and `readInquiries()` has to keep returning them rather than
   * inventing an answer. Required on the way IN — see `NewInquiry`.
   */
  member?: MemberAnswer
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
> & {
  /**
   * `member` is restated rather than added to the `Pick` above because the two
   * sides are deliberately asymmetric: `Pick` would inherit the `?` from
   * `Inquiry.member` and let a form submit without answering. Every inquiry the
   * form creates carries an answer; only the ones already in storage do not.
   */
  member: MemberAnswer
}

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
  /**
   * ⚠️ There is deliberately no `notificationEmail` here.
   *
   * There was, and it was the worst kind of field: rendered on `/admin/settings`,
   * labelled "Where new-inquiry alerts are sent", saved successfully — and read by
   * nothing. The sender reads `notification_settings.to`, which had no screen at all.
   * An operator changed the address, was told it saved, and every lead kept going to
   * the old inbox (#93).
   *
   * One address, one row, one screen: `NotificationSettings.to`, edited on
   * `/admin/notifications`. Do not reintroduce a delivery field into this record —
   * `tests/backend.mjs` fails if one appears with a hint that claims a delivery
   * behaviour.
   */
  /**
   * Per-page marketing primaries, `#rrggbb`.
   *
   * These are the shipped defaults, and they are also the values the Design
   * System page's colour picker writes. Because Tailwind v4 emits
   * `background-color:var(--color-residential)`, setting the matching custom
   * property re-colours every surface that reads it — see `src/marketing/theme.ts`
   * for the token map.
   *
   * Since 2026-10-23 the record is stored server-side and read by
   * `GET /api/settings?key=site`, so a colour picked in `/admin/design` reaches
   * every visitor rather than only the browser that picked it.
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

/**
 * Where a new inquiry is announced — **server-owned**.
 *
 * ⚠️ This is deliberately NOT part of `SiteSettings`. That record is read by the
 * public site (`GET /api/settings?key=site`) and is about how the site looks; a
 * "To:" field sitting next to "Business name" would look like it configured
 * delivery while the sender kept using its own value. So these four live in the
 * `notification_settings` table, the admin page reads and writes them through
 * `/api/notification-settings`, and `api/_lib/notifications.ts` reads the same row
 * when a lead arrives.
 */
export interface NotificationSettings {
  to: string
  /** Empty means "reply to the lead", which is what a person replying usually wants. */
  replyTo: string
  /** Comma-separated; empty means no Bcc. */
  bcc: string
  /** `{{name}}`, `{{service}}`, `{{urgency}}`, `{{propertyType}}` are substituted. */
  subjectTemplate: string
}

/**
 * What the team is told about, as opposed to **where** it is told.
 *
 * Split from `NotificationSettings` because the two have different owners and
 * different failure modes: the address is a delivery fact that one row must hold,
 * these are preferences. Both live in Postgres (`admin_settings` key
 * `notifications`, and `notification_settings`), and both are read by
 * `api/_lib/notifications.ts` at send time.
 *
 * ⚠️ **Both fields are read by the sender.** `emailOnLead` suppresses routine mail;
 * `emergencyAlerts` is a floor under that suppression, so an emergency-urgency lead
 * is still announced when routine alerts are off. A switch here that nothing read is
 * the defect #93 removed, so any field added to this interface needs a reader in
 * `api/` before it gets a control on the page.
 *
 * There is deliberately no `weeklySummary` and no `digestHour`. They were here, they
 * were editable, and they were read by nothing but the page that rendered them: a
 * digest needs a scheduler, and a switch with no scheduler is a switch that lies.
 * Both return with #115, and the type is the right place to reintroduce them.
 */
export interface NotificationPrefs {
  /** Routine mail: send an email for every lead that arrives. */
  emailOnLead: boolean
  /** A floor, not a filter — emergencies are announced even when the above is off. */
  emergencyAlerts: boolean
}

/* ── Staff ───────────────────────────────────────────────────────────────── */

/**
 * The three levels a `staff` row may hold — mirroring `StaffRole` in
 * `api/_lib/roles.ts`.
 *
 * A second copy, for the same reason `KNOWN_CAPABILITIES` has one: the two sides
 * are built by different tsconfigs and `src/` may not import `api/`. Unlike that
 * list this one is not asserted equal by a test — it is a response shape, and a
 * wrong value here would render a label the server never sends.
 */
export type StaffLevel = "admin" | "service_manager" | "service_rep"

/**
 * One person on the Team screen.
 *
 * ⚠️ `role` is the **staff level**, and `null` means no row exists — the server
 * gives that person the `member` floor. It is not the same field as `role` on
 * `/api/me`, which is what the *current request* runs as. `orgRole` is Clerk's
 * (`org:admin` / `org:member`) and outranks `role` outright.
 */
export interface StaffMember {
  userId: string
  name: string
  email: string
  imageUrl: string
  orgRole: string
  role: StaffLevel | null
  active: boolean
}

/**
 * One recorded level change — who changed whose level, from what, to what, when.
 *
 * ⚠️ `fromRole` and `fromActive` are **null on a first assignment**, and that is a
 * fact rather than a gap: "promoted from nothing" and "promoted from rep" are
 * different events, and a default would erase the difference. `fromActive: false`
 * with `toActive: true` is a restored leaver; `fromActive: null` is a person who
 * had never been given access at all.
 *
 * `actorId` is a Clerk user id, not a name: the log records the id, and the screen
 * resolves it against the roster — falling back to the id when that person has
 * since left, because a record that cannot name its actor is still a record.
 */
export interface StaffAuditEntry {
  id: number
  actorId: string
  subjectId: string
  fromRole: StaffLevel | null
  toRole: StaffLevel
  fromActive: boolean | null
  toActive: boolean
  /** ISO 8601. */
  at: string
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
