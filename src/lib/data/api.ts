/**
 * The data API — the seam every page talks to.
 *
 * Pages never touch `backend.ts`. They call these methods, which are **async on
 * purpose**: the local backend is synchronous, but a real HTTP backend will not
 * be, so the call sites are already written for the world where this returns a
 * network promise.
 *
 * **That promise has now been cashed for one method.** `createInquiry` posts to
 * `POST /api/inquiry` instead of writing `localStorage`, because the server owns the
 * record — see `docs/60-reference/data-layer.md` §9. Every other method still reads
 * the browser, which is proposal A2: the dashboard does not yet read the database.
 *
 * Mutations bump a version counter. `useApiData` subscribes to it, so a change made
 * on one admin page repaints another without either page knowing about the other.
 * `createInquiry` deliberately does **not** bump: it writes nothing here.
 */
import { backend } from "@/lib/data/backend"
import type {
  AdminProfile,
  Inquiry,
  NewInquiry,
  NotificationPrefs,
  SecurityState,
  SiteSettings,
} from "@/lib/data/types"

/**
 * Simulated network latency. Small enough not to be annoying, large enough that
 * loading and in-flight button states are actually exercised during review —
 * a UI that only ever renders its loaded state is a UI whose loading state is
 * untested.
 */
const LATENCY_MS = 140

function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), LATENCY_MS))
}

/* ── Change notification ─────────────────────────────────────────────────── */

const listeners = new Set<() => void>()
let version = 0

function bump(): void {
  version += 1
  listeners.forEach((l) => l())
}

/** For `useSyncExternalStore` — must be a stable primitive. */
export function getVersion(): number {
  return version
}

export function subscribeToChanges(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

/* ── Helpers ─────────────────────────────────────────────────────────────── */

/** Newest first — the inbox's default order. */
function byNewest(a: Inquiry, b: Inquiry): number {
  return b.createdAt.localeCompare(a.createdAt)
}

/* ── The API ─────────────────────────────────────────────────────────────── */

export const api = {
  /* ── Inquiries ── */

  async listInquiries(): Promise<Inquiry[]> {
    return delay([...backend.readInquiries()].sort(byNewest))
  },

  async getInquiry(id: string): Promise<Inquiry | null> {
    return delay(backend.readInquiries().find((r) => r.id === id) ?? null)
  },

  /** Called by the public inquiry form. */
  async createInquiry(input: NewInquiry): Promise<Inquiry> {
    // The server owns this record now. Writing to `localStorage` as well would give
    // the site two sources of truth that disagree the moment a lead arrives by email
    // — which is the primary channel — so the browser keeps nothing.
    //
    // The returned object is a **receipt**, not the stored row: the form needs an id
    // for its reference, and everything else about the inquiry is the server's.
    // Reading the stored rows back is proposal A2 (`docs/40-project/`).
    const res = await fetch("/api/inquiry", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    })

    const body = (await res.json().catch(() => null)) as { id?: string } | null
    if (!res.ok || !body?.id) {
      // Thrown, never swallowed: the form turns this into a visible failure with a
      // phone number. A lead must never be told it was sent when it was not.
      throw new Error(`inquiry POST failed: ${res.status}`)
    }

    const now = new Date().toISOString()
    return {
      ...input,
      id: body.id,
      status: "new",
      createdAt: now,
      updatedAt: now,
      notes: "",
    }
  },

  async updateInquiry(id: string, patch: Partial<Omit<Inquiry, "id">>): Promise<Inquiry> {
    const rows = backend.readInquiries()
    const index = rows.findIndex((r) => r.id === id)
    if (index === -1) throw new Error(`No inquiry with id ${id}`)

    const updated: Inquiry = {
      ...rows[index],
      ...patch,
      id,
      updatedAt: new Date().toISOString(),
    }
    const next = [...rows]
    next[index] = updated
    backend.writeInquiries(next)
    bump()
    return delay(updated)
  },

  async deleteInquiry(id: string): Promise<void> {
    backend.writeInquiries(backend.readInquiries().filter((r) => r.id !== id))
    bump()
    await delay(null)
  },

  /* ── Settings ── */

  async getSettings(): Promise<SiteSettings> {
    return delay(backend.readSettings())
  },

  async saveSettings(value: SiteSettings): Promise<SiteSettings> {
    backend.writeSettings(value)
    bump()
    return delay(value)
  },

  /* ── Profile ── */

  async getProfile(): Promise<AdminProfile> {
    return delay(backend.readProfile())
  },

  async saveProfile(value: AdminProfile): Promise<AdminProfile> {
    backend.writeProfile(value)
    bump()
    return delay(value)
  },

  /* ── Notification preferences ── */

  async getNotifications(): Promise<NotificationPrefs> {
    return delay(backend.readNotifications())
  },

  async saveNotifications(value: NotificationPrefs): Promise<NotificationPrefs> {
    backend.writeNotifications(value)
    bump()
    return delay(value)
  },

  /* ── Security ── */

  async getSecurity(): Promise<SecurityState> {
    return delay(backend.readSecurity())
  },

  async saveSecurity(value: SecurityState): Promise<SecurityState> {
    backend.writeSecurity(value)
    bump()
    return delay(value)
  },

  /* ── Demo housekeeping ── */

  /** Clears every stored key and restores the seed fixtures. */
  async resetDemoData(): Promise<void> {
    backend.reset()
    bump()
    await delay(null)
  },
}
