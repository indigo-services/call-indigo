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
import type { MemberAnswer, NewInquiry, PropertyType, Service, Urgency } from "../../src/lib/data/types.js"

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

/**
 * The minimum time between the form opening and being submitted — #92.
 *
 * Chosen over Cloudflare Turnstile because this project's recorded invariant is *no
 * cookie, no analytics*: Turnstile processes the visitor's IP address, TLS
 * fingerprint and User-Agent, may set a cookie, and would need a new processor named
 * in the privacy policy. A time floor needs no vendor and no notice change.
 *
 * It is a speed bump, not a wall, and that is the honest description: a script that
 * reads this file can send any timestamp it likes. What it stops is the naive case —
 * a bot that fetches the page and POSTs immediately, and a bot that does not run the
 * page's JavaScript at all and so cannot send `openedAt`. That second class is the
 * majority of form spam, and refusing a missing timestamp is what catches it.
 *
 * ⚠️ Three seconds is deliberately short. A person filling nine fields in under three
 * seconds is not a thing; a person who pastes a prepared message and clicks send
 * immediately is, and they are a customer.
 */
export const MIN_FILL_MS = 3000

/**
 * How far ahead of us a client's clock may be before we stop trusting the delta.
 *
 * A clock five minutes fast makes `now - openedAt` negative, which would otherwise
 * read as "submitted instantly" and reject a real person **forever**. Losing a lead
 * to a skewed clock is a worse failure than letting a bot through a check it could
 * bypass by sending an older timestamp anyway, so a future timestamp is accepted.
 */
export const CLOCK_SKEW_MS = 60_000

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

/**
 * `now` is a parameter so the timing rule is testable without waiting three seconds.
 * It defaults to the real clock at the call site, which is the only place that
 * should decide what "now" means.
 */
export function validateInquiry(input: unknown, now: number = Date.now()): ValidationResult {
  if (typeof input !== "object" || input === null) {
    return { ok: false, errors: { body: "expected a JSON object" } }
  }
  const body = input as Record<string, unknown>

  // The form's hidden `company` field. A person never sees it; autofill fills it.
  // Checked FIRST so a bot gets the same 200 a person does, and the drop costs one
  // row instead of a queue entry someone has to triage.
  if (str(body.company) !== "") return { ok: false, honeypot: true }

  const errors: Record<string, string> = {}

  // Time-to-submit (#92). See MIN_FILL_MS for why this is a floor and not a captcha.
  // A missing timestamp is refused — that is the whole point, since a bot that does
  // not execute the page's JavaScript cannot invent one.
  const openedAt = Number(body.openedAt)
  if (body.openedAt === undefined || body.openedAt === null || !Number.isFinite(openedAt)) {
    errors.openedAt = "missing"
  } else if (openedAt <= now && now - openedAt < MIN_FILL_MS) {
    errors.openedAt = "submitted too quickly"
  }
  // A timestamp in the future is accepted, up to and beyond CLOCK_SKEW_MS: a fast
  // client clock is not evidence of a bot, and the check is bypassable regardless.

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
