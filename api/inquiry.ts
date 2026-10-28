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
 * Since #93 `notified: false` also covers the case where an operator switched
 * routine mail off: the preference decides *whether* to announce, never whether to
 * store.
 *
 * ⚠️ The rewrite in `vercel.json` used to send every path to `/index.html`,
 * including this one. That is why that file now excludes `/api/`: without it this
 * handler is never reached and the POST returns the SPA shell with a 200, which
 * looks exactly like success.
 *
 * Four gates before a row exists, cheapest and least informative first:
 *
 *   1. **honeypot** — a filled `company` answers 200 and stores nothing;
 *   2. **validation** — field rules, plus the minimum time-to-submit (#92);
 *   3. **rate limit** — 5 per address per 10 minutes (#94);
 *   4. the insert itself.
 *
 * Steps 1–3 write nothing, so a refused request costs no row and no email. The order
 * is not cosmetic: the limit runs after the honeypot so a bot cannot discover it, and
 * after validation so an attacker cannot spend a real visitor's budget with bodies
 * that would have been rejected anyway.
 */
import { body, methodNotAllowed, type ApiRequest, type ApiResponse } from "./_lib/http.js"
import { insertInquiry } from "./_lib/inquiries.js"
import { readNotificationPrefs, readNotificationSettings, sendInquiryEmail, shouldNotify } from "./_lib/notifications.js"
import { enforce } from "./_lib/throttle.js"
import { validateInquiry } from "./_lib/validate.js"

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

  // #94. After the honeypot and after validation, deliberately:
  //   · after the honeypot, so a bot cannot learn the limit by filling a field a
  //     person never sees;
  //   · after validation, because a request that fails it costs nothing — no row, no
  //     email — and counting it would let an attacker exhaust a real visitor's budget
  //     with bodies that were never going to be stored.
  // A refusal here writes nothing and sends nothing, which is the property the tests
  // assert by counting sends rather than by reading the status code.
  const verdict = await enforce(req)
  if (!verdict.allowed) {
    const retryAfter = String(verdict.retryAfter ?? 60)
    res.setHeader("Retry-After", retryAfter)
    res.status(429).json({ error: "rate_limited", retryAfter: Number(retryAfter) })
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
    // The switches on /admin/notifications, read here rather than trusted from the
    // page — the page decides what to *show*, this decides what to *send* (#93).
    const prefs = await readNotificationPrefs()
    if (!shouldNotify(prefs, inquiry)) {
      // Deliberately not an error: an operator turned routine mail off. The lead is
      // stored and appears in the inbox, which is the channel that always works.
      console.log(
        `inquiry: ${inquiry.id} stored, notification suppressed ` +
          `(emailOnLead=${prefs.emailOnLead}, emergencyAlerts=${prefs.emergencyAlerts}, urgency=${inquiry.urgency})`,
      )
    } else {
      const settings = await readNotificationSettings()
      if (!settings) {
        console.error("inquiry: notification_settings has no 'default' row — the migration has not run")
      } else {
        const result = await sendInquiryEmail(settings, inquiry)
        notified = result.sent
        if (!result.sent) console.error(`inquiry: ${inquiry.id} stored but not emailed — ${result.error}`)
      }
    }
  } catch (err) {
    // A settings read that fails is still not a lost lead.
    console.error(`inquiry: ${inquiry.id} stored but notification lookup failed`, err)
  }

  res.status(201).json({ ok: true, id: inquiry.id, notified })
}
