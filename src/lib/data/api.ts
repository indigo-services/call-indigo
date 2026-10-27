/**
 * The data API — the seam every page talks to.
 *
 * Pages never touch `backend.ts`. They call these methods, which are **async on
 * purpose**: the local backend is synchronous, but a real HTTP backend will not
 * be, so the call sites are already written for the world where this returns a
 * network promise.
 *
 * **The promise has been cashed.** Inquiries, settings, profile and notification
 * preferences all go through `/api/…` now; the browser keeps nothing that a
 * second device would disagree with. What is left in `backend.ts` is the `security`
 * record, which has no server-side meaning yet (#95). See
 * `docs/60-reference/data-layer.md` §9.
 *
 * Mutations bump a version counter. `useApiData` subscribes to it, so a change made
 * on one admin page repaints another without either page knowing about the other.
 * `createInquiry` deliberately does **not** bump: it writes nothing here.
 */
import { backend } from "@/lib/data/backend"
import { DEFAULT_NOTIFICATIONS, DEFAULT_PROFILE, DEFAULT_SETTINGS } from "@/lib/data/seed"
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

/**
 * A Clerk session token, supplied by the admin shell.
 *
 * Passed in rather than imported so this module keeps knowing nothing about React or
 * Clerk: `src/marketing` imports it too, and the public form has no session. The
 * server decides what the token is worth — this only carries it.
 */
export type TokenGetter = () => Promise<string | null>

async function withAuth(token: TokenGetter | undefined, init: RequestInit = {}): Promise<RequestInit> {
  const value = token ? await token() : null
  if (!value) return init
  return { ...init, headers: { ...(init.headers as Record<string, string> | undefined), Authorization: `Bearer ${value}` } }
}

/** Read a JSON body, or throw with the status — never return a plausible empty value. */
async function readJson<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => null)) as T | null
  if (!res.ok || data === null) throw new Error(`API ${res.status}`)
  return data
}

/* ── The API ─────────────────────────────────────────────────────────────── */

export const api = {
  /* ── The session ── */

  /**
   * Who this session is, and what it may do.
   *
   * The one call the admin shell makes for itself. The capability list is the same
   * one `requireCapability()` checks against, which is what stops the nav promising
   * a page the server will refuse — the drift that made `org:member` see a Settings
   * page that answered `403` on every save.
   */
  async getMe(token?: TokenGetter): Promise<{ userId: string; role: string; capabilities: string[] }> {
    const res = await fetch("/api/me", await withAuth(token))
    return readJson<{ userId: string; role: string; capabilities: string[] }>(res)
  },

  /* ── Inquiries ── */

  async listInquiries(token?: TokenGetter): Promise<Inquiry[]> {
    const res = await fetch("/api/inquiries", await withAuth(token))
    const { inquiries } = await readJson<{ inquiries: Inquiry[] }>(res)
    return inquiries
  },

  async getInquiry(id: string, token?: TokenGetter): Promise<Inquiry | null> {
    const res = await fetch(`/api/inquiries?id=${encodeURIComponent(id)}`, await withAuth(token))
    if (res.status === 404) return null
    const { inquiry } = await readJson<{ inquiry: Inquiry }>(res)
    return inquiry
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

  async updateInquiry(
    id: string,
    patch: Partial<Omit<Inquiry, "id">>,
    token?: TokenGetter,
  ): Promise<Inquiry> {
    // Only the two fields the server accepts. Sending the whole record would let a
    // stale row overwrite a newer one field by field.
    const res = await fetch(
      "/api/inquiries",
      await withAuth(token, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: patch.status, notes: patch.notes }),
      }),
    )
    const { inquiry } = await readJson<{ inquiry: Inquiry }>(res)
    bump()
    return inquiry
  },

  async deleteInquiry(id: string, token?: TokenGetter): Promise<void> {
    const res = await fetch(
      `/api/inquiries?id=${encodeURIComponent(id)}`,
      await withAuth(token, { method: "DELETE" }),
    )
    // 204 carries no body, so `readJson` would be wrong here.
    if (!res.ok) throw new Error(`API ${res.status}`)
    bump()
  },

  /* ── Settings, profile, notification preferences ── */

  /**
   * Read one record and fall back to the shipped defaults.
   *
   * The server returns `null` for a key that has never been written, rather than
   * seeding itself on a GET — a read that writes is a read you cannot cache or retry
   * safely. The defaults are constants in `seed.ts`, so a fresh install renders.
   */
  async getSettings(token?: TokenGetter): Promise<SiteSettings> {
    const res = await fetch("/api/settings?key=site", await withAuth(token))
    const { value } = await readJson<{ value: Partial<SiteSettings> | null }>(res)
    return { ...DEFAULT_SETTINGS, ...(value ?? {}) }
  },

  async saveSettings(value: SiteSettings, token?: TokenGetter): Promise<SiteSettings> {
    const res = await fetch(
      "/api/settings?key=site",
      await withAuth(token, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(value),
      }),
    )
    const stored = await readJson<{ value: SiteSettings }>(res)
    bump()
    return stored.value
  },

  async getProfile(token?: TokenGetter): Promise<AdminProfile> {
    const res = await fetch("/api/settings?key=profile", await withAuth(token))
    const { value } = await readJson<{ value: Partial<AdminProfile> | null }>(res)
    return { ...DEFAULT_PROFILE, ...(value ?? {}) }
  },

  async saveProfile(value: AdminProfile, token?: TokenGetter): Promise<AdminProfile> {
    const res = await fetch(
      "/api/settings?key=profile",
      await withAuth(token, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(value),
      }),
    )
    const stored = await readJson<{ value: AdminProfile }>(res)
    bump()
    return stored.value
  },

  async getNotifications(token?: TokenGetter): Promise<NotificationPrefs> {
    const res = await fetch("/api/settings?key=notifications", await withAuth(token))
    const { value } = await readJson<{ value: Partial<NotificationPrefs> | null }>(res)
    return { ...DEFAULT_NOTIFICATIONS, ...(value ?? {}) }
  },

  async saveNotifications(value: NotificationPrefs, token?: TokenGetter): Promise<NotificationPrefs> {
    const res = await fetch(
      "/api/settings?key=notifications",
      await withAuth(token, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(value),
      }),
    )
    const stored = await readJson<{ value: NotificationPrefs }>(res)
    bump()
    return stored.value
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
