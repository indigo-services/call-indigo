/**
 * `POST /api/inquiry` — the first endpoint this project has ever had.
 *
 * It exists because of one sentence in the 2026-09-29 proposal: *the inquiry form
 * currently writes to the submitter's own browser, and the business never receives
 * it*. Until this file, `api.createInquiry()` called `backend.writeInquiries()`,
 * which is `localStorage` — so a lead existed only on the visitor's machine.
 *
 * Order of operations is deliberate: **store first, notify second.** A mail
 * outage must not cost the lead, so the email is attempted after the row exists
 * and its failure is reported rather than thrown. `notified: false` in a 201 is a
 * stored lead with a broken announcement — which someone can fix — not a lost one.
 *
 * ⚠️ The rewrite in `vercel.json` used to send every path to `/index.html`,
 * including this one. That is why that file now excludes `/api/`: without it this
 * handler is never reached and the POST returns the SPA shell with a 200, which
 * looks exactly like success.
 */
import { body, methodNotAllowed, type ApiRequest, type ApiResponse } from "./_lib/http"
import { insertInquiry } from "./_lib/inquiries"
import { readNotificationSettings, sendInquiryEmail } from "./_lib/notifications"
import { validateInquiry } from "./_lib/validate"

export default async function handler(req: ApiRequest, res: ApiResponse): Promise<void> {
  if (req.method !== "POST") return methodNotAllowed(res, "POST")

  const parsed = validateInquiry(body(req))
  if (!parsed.ok) {
    // A filled honeypot gets the same answer a person gets. Telling a bot it was
    // caught only teaches it to leave the field empty next time.
    if ("honeypot" in parsed) {
      res.status(200).json({ ok: true })
      return
    }
    res.status(422).json({ error: "validation_failed", fields: parsed.errors })
    return
  }

  let inquiry
  try {
    inquiry = await insertInquiry(parsed.value)
  } catch (err) {
    // Nothing was stored, so the visitor must not be told it was. This is the one
    // branch that has to be an error.
    console.error("inquiry: insert failed", err)
    res.status(503).json({ error: "unavailable", message: "We could not save your inquiry. Please call us." })
    return
  }

  let notified = false
  try {
    const settings = await readNotificationSettings()
    if (!settings) {
      console.error("inquiry: notification_settings has no 'default' row — the migration has not run")
    } else {
      const result = await sendInquiryEmail(settings, inquiry)
      notified = result.sent
      if (!result.sent) console.error(`inquiry: ${inquiry.id} stored but not emailed — ${result.error}`)
    }
  } catch (err) {
    // A settings read that fails is still not a lost lead.
    console.error(`inquiry: ${inquiry.id} stored but notification lookup failed`, err)
  }

  res.status(201).json({ ok: true, id: inquiry.id, notified })
}
