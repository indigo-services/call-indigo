/**
 * The inquiry body, validated once, on the server.
 *
 * The client already validates — `ContactPage.tsx` has per-field errors and moves
 * focus to the first one. That validation is a courtesy to the person typing, not
 * a gate: anything can POST to this endpoint. So the same rules are restated here,
 * against the same *values* the form renders.
 *
 * ⚠️ **The lists below are copies, and that was forced by measurement.** The first
 * version imported `SERVICES` from `src/lib/data/types.ts`. Every endpoint that
 * shares this file then answered `FUNCTION_INVOCATION_FAILED` in production while
 * `api/health.ts` — which imports nothing — answered normally: a `.ts` file outside
 * `api/` is not in the function's compiled graph, so the import failed at load.
 * The values are duplicated rather than shared, and `tests/backend.mjs` asserts the
 * copy against the source, so a service added to the form cannot silently stop
 * being accepted here. Only the *types* are imported, and those are erased.
 */
import type { MemberAnswer, NewInquiry, PropertyType, Service, Urgency } from "../src/lib/data/types"

/** Must equal `SERVICES` in `src/lib/data/types.ts` — asserted by tests/backend.mjs. */
export const SERVICES: readonly string[] = [
  "Plumbing",
  "Electrical",
  "HVAC",
  "Carpentry & Remodeling",
  "Painting & Make-Readies",
  "Handyman & Repairs",
  "Not sure yet",
]

export const PROPERTY_TYPES: readonly PropertyType[] = ["residential", "commercial"]
export const URGENCIES: readonly Urgency[] = ["emergency", "soon", "flexible"]
export const MEMBER_ANSWERS: readonly MemberAnswer[] = ["yes", "no"]

/** Field limits. Chosen to be generous for a person and useless for a script. */
const MAX = { name: 120, email: 200, phone: 40, message: 4000, source: 32 } as const

/** Deliberately loose: the only thing worth rejecting here is "obviously not an address". */
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export interface ValidInquiry extends NewInquiry {
  source: string
}

export type ValidationResult =
  | { ok: true; value: ValidInquiry }
  | { ok: false; errors: Record<string, string> }
  /** A bot filled the honeypot. Answer 200 and store nothing. */
  | { ok: false; honeypot: true }

function str(value: unknown): string {
  return typeof value === "string" ? value.trim() : ""
}

export function validateInquiry(input: unknown): ValidationResult {
  if (typeof input !== "object" || input === null) {
    return { ok: false, errors: { body: "expected a JSON object" } }
  }
  const body = input as Record<string, unknown>

  // The form's hidden `company` field. A person never sees it; autofill fills it.
  // Checked FIRST so a bot gets the same 200 a person does, and the drop costs one
  // row instead of a queue entry someone has to triage.
  if (str(body.company) !== "") return { ok: false, honeypot: true }

  const errors: Record<string, string> = {}

  const name = str(body.name)
  if (name.length === 0) errors.name = "required"
  else if (name.length > MAX.name) errors.name = `at most ${MAX.name} characters`

  const email = str(body.email).toLowerCase()
  if (email.length === 0) errors.email = "required"
  else if (email.length > MAX.email) errors.email = `at most ${MAX.email} characters`
  else if (!EMAIL.test(email)) errors.email = "not an email address"

  const phone = str(body.phone)
  if (phone.length === 0) errors.phone = "required"
  else if (phone.length > MAX.phone) errors.phone = `at most ${MAX.phone} characters`

  const propertyType = str(body.propertyType) as PropertyType
  if (!PROPERTY_TYPES.includes(propertyType)) {
    errors.propertyType = `one of ${PROPERTY_TYPES.join(", ")}`
  }

  const service = str(body.service) as Service
  if (!SERVICES.includes(service)) errors.service = "one of the advertised services"

  const urgency = str(body.urgency) as Urgency
  if (!URGENCIES.includes(urgency)) errors.urgency = `one of ${URGENCIES.join(", ")}`

  const message = str(body.message)
  if (message.length === 0) errors.message = "required"
  else if (message.length > MAX.message) errors.message = `at most ${MAX.message} characters`

  // Required on the way in, optional on the way out — see `NewInquiry`.
  const member = str(body.member) as MemberAnswer
  if (!MEMBER_ANSWERS.includes(member)) errors.member = "yes or no"

  const source = str(body.source) || "contact"
  if (!/^[a-z0-9-]+$/.test(source) || source.length > MAX.source) {
    errors.source = "lowercase letters, digits and dashes"
  }

  if (Object.keys(errors).length > 0) return { ok: false, errors }

  return { ok: true, value: { name, email, phone, propertyType, service, urgency, message, member, source } }
}
