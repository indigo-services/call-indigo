/**
 * The notification rule, as the browser needs it.
 *
 * `api/_lib/notifications.ts` holds the authoritative `shouldNotify()`. This is a
 * **copy**, and it exists because `src/` may not import `api/` — the two sides are
 * built by different tsconfigs, and a runtime import of a server file from the
 * bundle would ship server code to the browser.
 *
 * The page needs it to answer one question honestly: *what would these switches have
 * done?* The card below the form replays the current inquiries against it. If this
 * copy drifted, that card would describe a rule the sender does not use — which is
 * the defect #93 exists to remove, wearing a different hat.
 *
 * So it is not left to trust: `tests/backend.mjs` enumerates every combination of
 * the two switches and all three urgencies, and asserts this function and the
 * server's return the same answer for each. A copy with a comparison is a
 * specification; a copy without one is a second source of truth.
 */
import type { NotificationPrefs, Urgency } from "@/lib/data/types"

/**
 * - `emailOnLead` is the routine case: mail every lead.
 * - `emergencyAlerts` is a **floor, not a filter** — it guarantees an
 *   emergency-urgency lead is announced even when routine mail is off. It never
 *   narrows the routine mail, which is why the copy on the switch says "even when
 *   routine alerts are off" rather than "only emergencies".
 */
export function willNotify(prefs: NotificationPrefs, urgency: Urgency): boolean {
  if (prefs.emailOnLead) return true
  return prefs.emergencyAlerts && urgency === "emergency"
}
