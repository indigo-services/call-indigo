/**
 * The data API — the seam every page talks to.
 *
 * Pages call these methods, and only these. Every one is **async on purpose**:
 * when this module was written the storage behind it was synchronous, so the call
 * sites were already written for the world where a method returns a network
 * promise. That promise has been cashed — every method now fetches `/api/…` — and
 * the asynchrony is what made cashing it a change to this file rather than to every
 * call site.
 *
 * **The browser stores nothing.** There is no local engine behind this module any
 * more: `backend.ts` held one `security` record that nothing read and a "Reset
 * demo data" control that cleared it, and both went in #95. A second device sees
 * the same rows because there is only one copy, in Postgres.
 *
 * Mutations bump a version counter. `useApiData` subscribes to it, so a change made
 * on one admin page repaints another without either page knowing about the other.
 * `createInquiry` deliberately does **not** bump: it writes nothing here.
 */
import { DEFAULT_NOTIFICATIONS, DEFAULT_PROFILE, DEFAULT_SETTINGS } from "@/lib/data/seed"
import type {
  AdminProfile,
  Inquiry,
  NewInquiry,
  NotificationPrefs,
  NotificationSettings,
  SiteSettings,
  StaffAuditEntry,
  StaffLevel,
  StaffMember,
} from "@/lib/data/types"

/**
 * A refusal the form can explain, as opposed to one it can only apologise for.
 *
 * `createInquiry` used to throw a bare `Error` on any non-2xx, which collapsed three
 * different situations into "Something went wrong sending that" — a server that is
 * down, a rate limit that will clear in a minute, and a form that needs reloading.
 * Only the first is a fault. The other two are instructions, and #92 and #94 both ask
 * for the refusal to be *visible* rather than a silent success, which a message the
 * visitor can act on satisfies better than one they can only report.
 */
export class InquiryError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    readonly fields: Record<string, string> = {},
  ) {
    super(`inquiry POST failed: ${status} ${code}`)
    this.name = "InquiryError"
  }
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

  /**
   * Called by the public inquiry form.
   *
   * `openedAt` is when this form was rendered, in epoch milliseconds. The server
   * refuses a submission that arrives sooner than its floor allows, and a body with
   * no timestamp at all — which is what a bot that never runs this page sends. It is
   * passed as an argument rather than folded into `NewInquiry` because it describes
   * the *submission*, not the lead: `NewInquiry` is the shape a lead has, and putting
   * a clock reading in it would also leak into the receipt returned below.
   */
  async createInquiry(input: NewInquiry, openedAt: number): Promise<Inquiry> {
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
      body: JSON.stringify({ ...input, openedAt }),
    })

    const body = (await res.json().catch(() => null)) as
      | { id?: string; error?: string; fields?: Record<string, string> }
      | null

    if (!res.ok || !body?.id) {
      // Thrown, never swallowed: the form turns this into a visible failure with a
      // phone number. A lead must never be told it was sent when it was not.
      throw new InquiryError(res.status, body?.error ?? "unknown", body?.fields ?? {})
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

  /**
   * Where a lead is actually announced — a different record from the preferences
   * above, and the one that decides delivery.
   *
   * ⚠️ Until #93 this was reachable only by `curl`: the endpoint existed and was
   * admin-gated, but nothing in `src/` called it, while `/admin/settings` offered a
   * "Notification email" field that saved to a row no sender read. So the address
   * with a screen did nothing and the address that mattered had none.
   *
   * `settings` is `null` when the migration has not run. The page shows the form
   * empty rather than inventing an address: a fabricated destination is exactly the
   * defect being fixed.
   */
  async getNotificationSettings(token?: TokenGetter): Promise<NotificationSettings | null> {
    const res = await fetch("/api/notification-settings", await withAuth(token))
    const { settings } = await readJson<{ settings: NotificationSettings | null }>(res)
    return settings
  },

  async saveNotificationSettings(
    value: NotificationSettings,
    token?: TokenGetter,
  ): Promise<NotificationSettings> {
    const res = await fetch(
      "/api/notification-settings",
      await withAuth(token, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(value),
      }),
    )
    const { settings } = await readJson<{ settings: NotificationSettings }>(res)
    bump()
    return settings
  },

  /* ── Staff ── */

  /**
   * The roster, and the recent history of level changes.
   *
   * One call rather than two because the join is the server's: `useUser()` only
   * carries the signed-in user's own memberships, so a browser-side join would
   * need `useOrganization()` and its own pagination to see the same list. The
   * history rides along for the same reason — it is the same screen and the same
   * capability, and a second request would make the page wait twice.
   *
   * `role === null` is a real answer — a member with no row, whom the server
   * treats as read-only. It is not an error and not an empty state.
   *
   * `audit` defaults to `[]` rather than throwing: a server that stops sending it
   * should leave the panel empty, not break the roster above it. The panel is the
   * part of the page that is allowed to be missing.
   */
  async getTeam(
    token?: TokenGetter,
  ): Promise<{ staff: StaffMember[]; audit: StaffAuditEntry[] }> {
    const res = await fetch("/api/staff", await withAuth(token))
    const body = await readJson<{ staff: StaffMember[]; audit?: StaffAuditEntry[] }>(res)
    return { staff: body.staff, audit: body.audit ?? [] }
  },

  /**
   * Set one person's level, and return the row as stored.
   *
   * `active` is sent only when the caller means to change it: omitting it leaves a
   * deactivated row deactivated, so changing a leaver's level cannot quietly hand
   * their access back.
   *
   * ⚠️ A refusal carries the server's own error code (`not_a_member`,
   * `cannot_change_own_level`, `missing_capability`), because `API 422` tells the
   * person reading the toast nothing they can act on. The page maps the code to a
   * sentence; an unknown code still reaches the screen rather than being swallowed.
   */
  async setStaffLevel(
    input: { userId: string; role: StaffLevel; active?: boolean },
    token?: TokenGetter,
  ): Promise<StaffMember> {
    const res = await fetch(
      "/api/staff",
      await withAuth(token, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      }),
    )
    if (!res.ok) {
      const payload = (await res.json().catch(() => null)) as { error?: string } | null
      throw new Error(payload?.error ?? `API ${res.status}`)
    }
    const { staff } = await readJson<{ staff: StaffMember }>(res)
    bump()
    return staff
  },
}
