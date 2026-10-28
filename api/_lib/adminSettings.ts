/**
 * The admin's own configuration — `site`, `profile` and `notifications` — in one
 * table, validated at the boundary.
 *
 * All three used to live in `localStorage`. That was wrong in two different ways:
 * an admin who edited the business phone number changed it only for themselves, and
 * `src/lib/use-theme.ts` reads the `site` record, so **a visitor's browser decided
 * the site's theme colours**. Moving them here fixes both.
 *
 * The shapes are described once, as a field spec, rather than as three hand-written
 * validators. A spec makes the rules readable in one screen and makes "unknown key"
 * a single decision: unknown keys are **dropped**, so a client cannot smuggle
 * anything into the stored row.
 *
 * `value` is `jsonb`, so changing a shape is a code change rather than a migration.
 */
import { sql } from "./db.js"
import type { AdminProfile, NotificationPrefs, SiteSettings } from "../../src/lib/data/types.js"

export const SETTINGS_KEYS = ["site", "profile", "notifications"] as const
export type SettingsKey = (typeof SETTINGS_KEYS)[number]

export function isSettingsKey(value: unknown): value is SettingsKey {
  return typeof value === "string" && (SETTINGS_KEYS as readonly string[]).includes(value)
}

/**
 * `site` is the one key a `GET` does not gate: the public site reads it for its
 * theme and its phone number, and those are public facts. Everything else, and every
 * write, is admin-only.
 */
export const PUBLIC_KEYS: readonly SettingsKey[] = ["site"]

/**
 * The kinds of field a settings record may hold.
 *
 * `hour` was here for `digestHour` and was removed with it (#93): a kind that no
 * shape uses is a rule that no test can reach, and this repository has paid for
 * unreachable rules often enough. It comes back with the digest in #115.
 */
type Field = { kind: "text"; max: number } | { kind: "colour" } | { kind: "bool" }

const HEX = /^#[0-9a-f]{6}$/i

const SHAPES: Record<SettingsKey, Record<string, Field>> = {
  site: {
    brandName: { kind: "text", max: 80 },
    legalName: { kind: "text", max: 120 },
    primaryPhone: { kind: "text", max: 40 },
    publicEmail: { kind: "text", max: 200 },
    address: { kind: "text", max: 200 },
    establishedYear: { kind: "text", max: 8 },
    serviceArea: { kind: "text", max: 200 },
    licenseNumber: { kind: "text", max: 60 },
    // ⚠️ No `notificationEmail`. It used to be here, it rendered on /admin/settings
    // labelled "Where new-inquiry alerts are sent", and no sender read it — the
    // address that decides delivery is `notification_settings.to` (#93). A delivery
    // field in this record would be a second source of truth again, so it is not
    // just unused: `tests/backend.mjs` fails if a field here claims a delivery
    // behaviour that nothing in `api/` reads.
    themeHome: { kind: "colour" },
    themeResidential: { kind: "colour" },
    themeCommercial: { kind: "colour" },
  },
  profile: {
    fullName: { kind: "text", max: 120 },
    email: { kind: "text", max: 200 },
    phone: { kind: "text", max: 40 },
    role: { kind: "text", max: 80 },
    bio: { kind: "text", max: 2000 },
    timezone: { kind: "text", max: 60 },
  },
  /**
   * Only the two fields something actually acts on.
   *
   * `weeklySummary` and `digestHour` were removed: a digest needs a scheduler, and a
   * switch with no scheduler is a switch that lies. They return with #115.
   */
  notifications: {
    emailOnLead: { kind: "bool" },
    emergencyAlerts: { kind: "bool" },
  },
}

export type SettingsValue = SiteSettings | AdminProfile | NotificationPrefs

export type Validation =
  | { ok: true; value: Record<string, unknown> }
  | { ok: false; fields: Record<string, string> }

/**
 * Validate one key's payload against its shape.
 *
 * Every field is required. These are whole records written by a form that renders
 * all of them, so a partial body means the client is wrong, not that a field should
 * be preserved — `coalesce`-style merging belongs to `updateInquiry`, where the
 * editor genuinely sends one field at a time.
 */
export function validateSettings(key: SettingsKey, input: unknown): Validation {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return { ok: false, fields: { body: "expected an object" } }
  }
  const source = input as Record<string, unknown>
  const value: Record<string, unknown> = {}
  const fields: Record<string, string> = {}

  for (const [name, field] of Object.entries(SHAPES[key])) {
    const raw = source[name]
    switch (field.kind) {
      case "text":
        if (typeof raw !== "string") fields[name] = "text"
        else if (raw.length > field.max) fields[name] = `at most ${field.max} characters`
        else value[name] = raw
        break
      case "colour":
        if (typeof raw !== "string") fields[name] = "colour"
        else if (!HEX.test(raw)) fields[name] = "#rrggbb"
        else value[name] = raw.toLowerCase()
        break
      case "bool":
        if (typeof raw !== "boolean") fields[name] = "true or false"
        else value[name] = raw
        break
    }
  }

  if (Object.keys(fields).length > 0) return { ok: false, fields }
  return { ok: true, value }
}

/** The stored row, or null when the key has never been written. */
export async function readSettings(key: SettingsKey): Promise<Record<string, unknown> | null> {
  const rows = await sql<{ value: unknown }>(`select value from admin_settings where key = $1`, [key])
  const raw = rows[0]?.value
  if (raw === undefined || raw === null) return null
  // jsonb arrives parsed through Neon's HTTP endpoint; a string would mean the
  // column is text somewhere else, and that should still read rather than crash.
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw) as Record<string, unknown>
    } catch {
      return null
    }
  }
  return raw as Record<string, unknown>
}

/** Upsert — one statement, because the endpoint prepares one at a time. */
export async function writeSettings(key: SettingsKey, value: Record<string, unknown>): Promise<void> {
  await sql(
    `insert into admin_settings (key, value, updated_at)
          values ($1, $2::jsonb, now())
     on conflict (key) do update
        set value = excluded.value, updated_at = now()`,
    [key, JSON.stringify(value)],
  )
}
