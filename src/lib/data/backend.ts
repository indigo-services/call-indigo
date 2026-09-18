/**
 * localStorage-backed storage engine.
 *
 * This is the *only* file that knows where the data physically lives. It is
 * deliberately synchronous and dumb — the async contract the pages see lives in
 * `api.ts`, so swapping this for an HTTP client means replacing this file and
 * nothing else (PRD §16.2 F2).
 *
 * Everything is namespaced under `call-indigo:v1:` so demo data is trivial to
 * find and clear, and versioned so a future shape change can migrate rather
 * than crash on stale JSON.
 */
import {
  DEFAULT_NOTIFICATIONS,
  DEFAULT_PROFILE,
  DEFAULT_SECURITY,
  DEFAULT_SETTINGS,
  createSeedInquiries,
} from "@/lib/data/seed"
import type {
  AdminProfile,
  Inquiry,
  NotificationPrefs,
  SecurityState,
  SiteSettings,
} from "@/lib/data/types"

const NS = "call-indigo:v1"
const K = {
  inquiries: `${NS}:inquiries`,
  settings: `${NS}:settings`,
  profile: `${NS}:profile`,
  notifications: `${NS}:notifications`,
  security: `${NS}:security`,
} as const

/**
 * localStorage throws in private-mode Safari and when the quota is exceeded.
 * Falling back to a Map keeps the dashboard usable in the same session rather
 * than white-screening, which is the failure users actually hit.
 */
interface StorageLike {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

const memory = new Map<string, string>()

const storage: StorageLike = (() => {
  try {
    const probe = `${NS}:probe`
    window.localStorage.setItem(probe, "1")
    window.localStorage.removeItem(probe)
    return window.localStorage
  } catch {
    return {
      getItem: (k) => memory.get(k) ?? null,
      setItem: (k, v) => void memory.set(k, v),
      removeItem: (k) => void memory.delete(k),
    }
  }
})()

function read<T>(key: string, fallback: T): T {
  try {
    const raw = storage.getItem(key)
    if (raw === null) return fallback
    return JSON.parse(raw) as T
  } catch {
    // Corrupt or hand-edited value: fall back rather than take the page down.
    return fallback
  }
}

function write(key: string, value: unknown): void {
  try {
    storage.setItem(key, JSON.stringify(value))
  } catch {
    // Quota exceeded — keep the in-memory copy authoritative for this session.
    memory.set(key, JSON.stringify(value))
  }
}

export interface DataBackend {
  readInquiries(): Inquiry[]
  writeInquiries(rows: Inquiry[]): void
  readSettings(): SiteSettings
  writeSettings(value: SiteSettings): void
  readProfile(): AdminProfile
  writeProfile(value: AdminProfile): void
  readNotifications(): NotificationPrefs
  writeNotifications(value: NotificationPrefs): void
  readSecurity(): SecurityState
  writeSecurity(value: SecurityState): void
  /** Wipe the namespace and re-seed. */
  reset(): void
  /** True once anything has been written by a user action. */
  isSeeded(): boolean
}

export const backend: DataBackend = {
  readInquiries() {
    const existing = read<Inquiry[] | null>(K.inquiries, null)
    if (existing !== null) return existing
    // First run: seed, then persist so subsequent edits have something to edit.
    const seeded = createSeedInquiries()
    write(K.inquiries, seeded)
    return seeded
  },
  writeInquiries(rows) {
    write(K.inquiries, rows)
  },

  readSettings: () => ({ ...DEFAULT_SETTINGS, ...read<Partial<SiteSettings>>(K.settings, {}) }),
  writeSettings: (value) => write(K.settings, value),

  readProfile: () => ({ ...DEFAULT_PROFILE, ...read<Partial<AdminProfile>>(K.profile, {}) }),
  writeProfile: (value) => write(K.profile, value),

  readNotifications: () => ({
    ...DEFAULT_NOTIFICATIONS,
    ...read<Partial<NotificationPrefs>>(K.notifications, {}),
  }),
  writeNotifications: (value) => write(K.notifications, value),

  readSecurity: () => ({ ...DEFAULT_SECURITY, ...read<Partial<SecurityState>>(K.security, {}) }),
  writeSecurity: (value) => write(K.security, value),

  reset() {
    Object.values(K).forEach((key) => storage.removeItem(key))
    write(K.inquiries, createSeedInquiries())
  },

  isSeeded: () => storage.getItem(K.inquiries) !== null,
}
