/**
 * Service-area lookup for the ZIP check on the home page.
 *
 * Kept as a pure function so the decision can be tested without a browser; the
 * hook that binds it to `#zip-form` is the only part that needs a DOM.
 *
 * The three served counties are Hays, Travis and Williamson, whose ZIPs sit in
 * the 786xx and 787xx blocks (Austin, Buda, Kyle, San Marcos and the corridor
 * between them). That is a proxy for the county list, not the list itself, so a
 * ZIP outside the blocks gets an invitation to call rather than a refusal.
 *
 * Before this existed the prototype revealed the result for any three
 * characters typed — "00000" was told we cover it, and the message promised
 * same-day service, which is not a published fact about this business.
 */
export interface ServiceAreaVerdict {
  /** False when the input is not a ZIP at all — the caller should refocus the field. */
  valid: boolean
  /** True when the ZIP falls inside the blocks the crews serve. */
  served: boolean
  message: string
}

const SERVED_BLOCKS = /^(786|787)\d{2}$/
/** 5 digits, optionally ZIP+4 — the field allows up to 10 characters. */
const ZIP = /^(\d{5})(?:-\d{4})?$/

export function checkServiceArea(input: string): ServiceAreaVerdict {
  const typed = input.trim()
  const match = ZIP.exec(typed)

  if (!match) {
    return { valid: false, served: false, message: "Enter a 5-digit ZIP code." }
  }

  if (SERVED_BLOCKS.test(match[1])) {
    return { valid: true, served: true, message: `✓ Yes — ${typed} is in our service area.` }
  }

  return {
    valid: true,
    served: false,
    message: `${typed} is outside our regular service area. Call (512) 608-4999 — we may still be able to help.`,
  }
}
