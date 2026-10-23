/**
 * `GET` / `PUT /api/notification-settings` — where a lead is announced.
 *
 * Admin-only, and the first endpoint in this project with an authorization check
 * that a caller cannot skip by editing the bundle. See `server/auth.ts`.
 *
 * ⚠️ These four values are NOT in `SiteSettings`. That object lives in
 * `localStorage`, so it is per-browser: an admin could set "To:" on their laptop
 * and the function — which has no access to any browser — would keep sending to
 * whatever the database held. A setting that looks like it works and does not is
 * the defect class this project has paid for repeatedly, so the row lives in
 * Postgres and the page reads it back from here.
 */
import { methodNotAllowed, body, type ApiRequest, type ApiResponse } from "./_lib/http.js"
import { requireAdmin } from "./_lib/auth.js"
import { DEFAULT_SUBJECT, readNotificationSettings, writeNotificationSettings } from "./_lib/notifications.js"
import type { NotificationSettings } from "../src/lib/data/types.js"

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** One address for To and Reply-To; a comma list for Bcc. */
function addresses(value: unknown): string[] {
  return typeof value === "string"
    ? value
        .split(/[,;]/)
        .map((s) => s.trim())
        .filter(Boolean)
    : []
}

type Parsed = { ok: true; value: NotificationSettings } | { ok: false; errors: Record<string, string> }

export function validateSettings(input: unknown): Parsed {
  if (typeof input !== "object" || input === null) {
    return { ok: false, errors: { body: "expected a JSON object" } }
  }
  const raw = input as Record<string, unknown>
  const errors: Record<string, string> = {}

  const to = addresses(raw.to)
  if (to.length !== 1) errors.to = "exactly one address"
  else if (!EMAIL.test(to[0]!)) errors.to = "not an email address"

  const replyTo = addresses(raw.replyTo)
  if (replyTo.length > 1) errors.replyTo = "at most one address — leave it empty to reply to the lead"
  else if (replyTo.length === 1 && !EMAIL.test(replyTo[0]!)) errors.replyTo = "not an email address"

  const bcc = addresses(raw.bcc)
  if (bcc.length > 5) errors.bcc = "at most five addresses"
  else if (bcc.some((a) => !EMAIL.test(a))) errors.bcc = "every address must be an email address"

  const subjectTemplate =
    typeof raw.subjectTemplate === "string" && raw.subjectTemplate.trim() !== ""
      ? raw.subjectTemplate.trim()
      : DEFAULT_SUBJECT
  if (subjectTemplate.length > 200) errors.subjectTemplate = "at most 200 characters"

  if (Object.keys(errors).length > 0) return { ok: false, errors }

  return {
    ok: true,
    value: {
      to: to[0]!,
      replyTo: replyTo[0] ?? "",
      bcc: bcc.join(", "),
      subjectTemplate,
    },
  }
}

export default async function handler(req: ApiRequest, res: ApiResponse): Promise<void> {
  const method = req.method ?? "GET"
  if (method !== "GET" && method !== "PUT") return methodNotAllowed(res, "GET, PUT")

  const auth = await requireAdmin(req)
  if (!auth.ok) {
    res.status(auth.status).json({ error: auth.error })
    return
  }

  try {
    if (method === "GET") {
      const settings = await readNotificationSettings()
      res.status(200).json({ settings })
      return
    }

    const parsed = validateSettings(body(req))
    if (!parsed.ok) {
      res.status(422).json({ error: "validation_failed", fields: parsed.errors })
      return
    }

    const saved = await writeNotificationSettings(parsed.value)
    if (!saved) {
      res.status(500).json({ error: "not_saved" })
      return
    }
    // Logged with the actor, because "who changed where the leads go" is the one
    // question worth being able to answer later.
    console.log(`notification-settings: ${auth.userId} set to=${saved.to}`)
    res.status(200).json({ settings: saved })
  } catch (err) {
    console.error("notification-settings: failed", err)
    res.status(503).json({ error: "unavailable" })
  }
}
