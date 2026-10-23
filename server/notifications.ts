/**
 * The email that tells someone a lead arrived.
 *
 * Resend, from a verified domain. `call-indigo.com` is verified on the account
 * (measured: `GET /v1/domains` → one domain, status `verified`), so the sender is
 * a constant rather than a setting — an admin who could type an unverified sender
 * would get a 403 on every send and would have no way to know why.
 *
 * The four things that ARE configurable live in `notification_settings`, written
 * by the admin page through `/api/notification-settings`, and read here on every
 * send rather than cached: a serverless instance may be minutes or days old, and a
 * cached address is how a destination change appears to work and does not.
 */
import type { Inquiry, NotificationSettings } from "../src/lib/data/types"
import { sql } from "./db"

/** Verified on the Resend account. Overridable for a staging sender. */
const fromAddress = (): string => process.env.INQUIRY_FROM ?? "Call Indigo <inquiries@call-indigo.com>"

export const DEFAULT_SUBJECT = "New inquiry — {{name}} ({{service}})"

export interface StoredSettings extends NotificationSettings {
  updatedAt: string
}

/**
 * The single row, or `null` when the migration has not run.
 *
 * `null` is not swallowed into a default: an empty destination and a missing row
 * are different failures, and a lead that is stored but announced to nobody is the
 * exact defect this whole change exists to remove. The caller decides — it logs,
 * and it tells the client `notified: false`.
 */
export async function readNotificationSettings(): Promise<StoredSettings | null> {
  const rows = await sql<{
    to_email: string
    reply_to: string
    bcc: string
    subject_template: string
    updated_at: string
  }>("select to_email, reply_to, bcc, subject_template, updated_at from notification_settings where id = 'default'")

  const row = rows[0]
  if (!row) return null
  return {
    to: row.to_email,
    replyTo: row.reply_to,
    bcc: row.bcc,
    subjectTemplate: row.subject_template,
    updatedAt: row.updated_at,
  }
}

export async function writeNotificationSettings(
  next: NotificationSettings,
): Promise<StoredSettings | null> {
  const rows = await sql<{
    to_email: string
    reply_to: string
    bcc: string
    subject_template: string
    updated_at: string
  }>(
    `insert into notification_settings (id, to_email, reply_to, bcc, subject_template, updated_at)
     values ('default', $1, $2, $3, $4, now())
     on conflict (id) do update
       set to_email = excluded.to_email,
           reply_to = excluded.reply_to,
           bcc = excluded.bcc,
           subject_template = excluded.subject_template,
           updated_at = now()
     returning to_email, reply_to, bcc, subject_template, updated_at`,
    [next.to, next.replyTo, next.bcc, next.subjectTemplate],
  )
  const row = rows[0]
  if (!row) return null
  return {
    to: row.to_email,
    replyTo: row.reply_to,
    bcc: row.bcc,
    subjectTemplate: row.subject_template,
    updatedAt: row.updated_at,
  }
}

/** Substitute the tokens a subject may use; unknown tokens are left visible. */
export function renderSubject(template: string, inquiry: Inquiry | Omit<Inquiry, "id" | "status" | "notes" | "createdAt" | "updatedAt">): string {
  const tokens: Record<string, string> = {
    name: inquiry.name,
    service: inquiry.service,
    urgency: inquiry.urgency,
    propertyType: inquiry.propertyType,
  }
  return template.replace(/\{\{(\w+)\}\}/g, (whole, key: string) => tokens[key] ?? whole)
}

function esc(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

const LABEL: Record<string, string> = {
  emergency: "Emergency",
  soon: "Within a few days",
  flexible: "Flexible",
}

/** Split a comma/semicolon-separated address list, dropping blanks. */
export function addresses(value: string): string[] {
  return value
    .split(/[,;]/)
    .map((s) => s.trim())
    .filter(Boolean)
}

export interface SendResult {
  sent: boolean
  /** Why not, when `sent` is false. Never contains the API key. */
  error?: string
  id?: string
}

/**
 * Send the notification. Never throws: the lead is already stored by the time this
 * is called, and a mail outage must not turn a stored lead into an error page for
 * the visitor. The caller reports `notified` so the failure is visible in the
 * response and the function log rather than only in someone's missing inbox.
 */
export async function sendInquiryEmail(
  settings: StoredSettings,
  inquiry: Omit<Inquiry, "id" | "status" | "notes" | "createdAt" | "updatedAt">,
): Promise<SendResult> {
  const key = process.env.RESEND_API_KEY
  if (!key) return { sent: false, error: "RESEND_API_KEY is not set" }

  const to = addresses(settings.to)
  if (to.length === 0) return { sent: false, error: "notification destination is empty" }

  const replyTo = addresses(settings.replyTo)
  const bcc = addresses(settings.bcc)

  const rows: Array<[string, string]> = [
    ["Name", inquiry.name],
    ["Email", inquiry.email],
    ["Phone", inquiry.phone],
    ["Property", inquiry.propertyType],
    ["Service", inquiry.service],
    ["Urgency", LABEL[inquiry.urgency] ?? inquiry.urgency],
    ["Member", inquiry.member ?? "not answered"],
  ]

  const html = `<div style="font-family:system-ui,-apple-system,'Segoe UI',sans-serif;max-width:560px">
  <h1 style="font-size:18px;margin:0 0 4px">New inquiry</h1>
  <p style="margin:0 0 20px;color:#555">${esc(inquiry.name)} · ${esc(inquiry.service)}</p>
  <table cellpadding="0" cellspacing="0" style="border-collapse:collapse;width:100%">
    ${rows
      .map(
        ([k, v]) =>
          `<tr><td style="padding:6px 12px 6px 0;color:#777;white-space:nowrap">${esc(k)}</td><td style="padding:6px 0">${esc(v)}</td></tr>`,
      )
      .join("\n    ")}
  </table>
  <div style="margin:20px 0;padding:14px 16px;background:#f6f6f4;border-radius:8px;white-space:pre-wrap">${esc(inquiry.message)}</div>
  <p style="margin:0;color:#777;font-size:13px">Reply to this email to answer ${esc(inquiry.name)} directly.</p>
</div>`

  const text = [
    "New inquiry",
    "",
    ...rows.map(([k, v]) => `${k}: ${v}`),
    "",
    inquiry.message,
  ].join("\n")

  const payload: Record<string, unknown> = {
    from: fromAddress(),
    to,
    subject: renderSubject(settings.subjectTemplate || DEFAULT_SUBJECT, inquiry),
    html,
    text,
    // Replying to the notification should reach the person who wrote it, unless
    // someone deliberately set a different Reply-To.
    reply_to: replyTo.length > 0 ? replyTo : [inquiry.email],
  }
  if (bcc.length > 0) payload.bcc = bcc

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(8000),
    })
    const body = await res.text()
    if (!res.ok) return { sent: false, error: `resend ${res.status}: ${body.slice(0, 240)}` }
    const parsed = JSON.parse(body) as { id?: string }
    return { sent: true, id: parsed.id }
  } catch (err) {
    return { sent: false, error: err instanceof Error ? err.message : String(err) }
  }
}
