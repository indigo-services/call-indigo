/**
 * How often one connection may post a lead — #94.
 *
 * The endpoint this guards is unauthenticated, it **writes**, and every write sends
 * a **paid** email. Before this file the only ceilings were field lengths and the
 * honeypot, so a loop of 500 requests was 500 rows and 500 emails.
 *
 * ## The two decisions #94 asked to be made before any code
 *
 * **Where the counters live.** A Postgres table, not Upstash or Vercel KV.
 * `api/_lib/db.ts` already speaks Postgres over HTTP and one upsert per request is
 * the whole of the work, so the alternative was a new vendor, a new env var and a
 * new failure mode in the one code path that must never lose a lead. The volume does
 * not justify a second store.
 *
 * **What the key is.** `sha256(ip + salt)` — never the address. Hashing was chosen
 * over keying on the submitted email because an email-keyed limit lets a flood that
 * varies the address walk straight through, and this limit exists to stop floods.
 * The hash is still pseudonymous data (stable for one address and salt), which is why
 * the privacy policy names it rather than leaving "only the hosting provider sees an
 * address" standing.
 *
 * ## Why the salt is mandatory rather than defaulted
 *
 * The whole IPv4 space is 2^32. An unsalted `sha256` of an address is not
 * anonymisation — it is an encoding, and a laptop walks it in minutes. So there is no
 * fallback value and no default: without `THROTTLE_SALT` this module refuses to build
 * a key at all and the endpoint **fails open**, loudly. A silent fallback to a
 * constant salt would be the security equivalent of a green check that asserts
 * nothing, which is this repository's one recurring defect.
 *
 * ## Failing open, deliberately
 *
 * If the counter cannot be read or written, the submission is **accepted**. Losing a
 * real customer because a counter table is missing is worse than one spam row, and
 * the honeypot and the time-to-submit check still apply. Every fail-open path logs,
 * because an unenforced limit that says nothing is indistinguishable from a limit
 * that works.
 */
import { createHash } from "node:crypto"
import type { ApiRequest } from "./http.js"
import { header } from "./http.js"
import { sql } from "./db.js"

/**
 * The policy, in one place so it can be asserted rather than described.
 *
 * 5 in 10 minutes is generous for a household or a small office behind one address —
 * the only legitimate case that submits more than once — and caps the damage at 720
 * rows and 720 emails a day per address, against "as fast as it can connect".
 */
export const THROTTLE = {
  /** Accepted submissions per key per window. */
  limit: 5,
  /** Window length. Windows are aligned to the epoch, not to the clock face. */
  windowSeconds: 600,
  /** Rows older than this are pruned opportunistically. One day is far beyond any window. */
  retentionHours: 24,
} as const

/** The env var holding the salt. Named here so the failure message and the docs agree. */
export const SALT_VAR = "THROTTLE_SALT"

/**
 * The caller's address, as far as the platform will say.
 *
 * `x-forwarded-for` is a list — `client, proxy1, proxy2` — and the client is the
 * **first** entry. Taking the last, or the whole string, would bucket every visitor
 * behind one CDN edge into a single counter. Both headers are read because Vercel
 * sets `x-forwarded-for` and other hosts set `x-real-ip`.
 */
export function clientIp(req: ApiRequest): string {
  const forwarded = header(req, "x-forwarded-for")
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim()
    if (first) return first
  }
  return header(req, "x-real-ip").trim()
}

/**
 * `sha256(ip + salt)` as hex, or `null` when there is nothing safe to hash.
 *
 * Returns `null` — rather than hashing with an empty salt — when either input is
 * missing. The caller treats `null` as "cannot enforce", which is the honest answer.
 */
export function throttleKey(ip: string, salt: string): string | null {
  if (!ip || !salt) return null
  return createHash("sha256").update(`${ip}${salt}`).digest("hex")
}

export interface ThrottleVerdict {
  /** False only when a counter was read successfully and it is over the limit. */
  allowed: boolean
  /** Seconds until the window turns over. Set when `allowed` is false. */
  retryAfter?: number
  /**
   * Why enforcement did not happen. Present only on a fail-open, so a test can tell
   * "the limit was satisfied" apart from "the limit was never consulted".
   */
  unenforced?: "no-salt" | "no-ip" | "store-unavailable"
}

/** What the counter reports back for one hit. */
export interface HitRecord {
  hits: number
  retryAfter: number
}

/**
 * Count one hit and report the window's total.
 *
 * One statement, because `api/_lib/db.ts` refuses more than one — the endpoint
 * prepares every query and Postgres rejects two commands in a prepared statement.
 * The window start is derived from the epoch so the alignment matches the window
 * length exactly; `date_trunc` would tie the code to a specific granularity and
 * silently make `Retry-After` wrong the moment the length changed.
 */
export async function recordHit(key: string): Promise<HitRecord> {
  const rows = await sql<{ hits: number; retry_after: number }>(
    `insert into inquiry_throttle (throttle_key, window_start)
     values ($1, to_timestamp(floor(extract(epoch from now()) / $2) * $2))
     on conflict (throttle_key, window_start) do update
        set hits = inquiry_throttle.hits + 1
     returning hits,
       greatest(1, ceil(extract(epoch from
         to_timestamp((floor(extract(epoch from now()) / $2) + 1) * $2) - now())))::int
         as retry_after`,
    [key, THROTTLE.windowSeconds],
  )
  const row = rows[0]
  if (!row) throw new Error("throttle upsert returned no row")
  return { hits: Number(row.hits), retryAfter: Number(row.retry_after) }
}

/**
 * Drop windows that cannot affect any decision.
 *
 * Best effort and never awaited on the critical path of a *decision*: a failed prune
 * costs disk, not correctness. Called only when a key opens a fresh window, so it is
 * one statement per key per window rather than one per request.
 */
export async function pruneThrottle(): Promise<void> {
  await sql(`delete from inquiry_throttle where window_start < now() - make_interval(hours => $1)`, [
    THROTTLE.retentionHours,
  ])
}

/**
 * The decision for one request.
 *
 * `record` is a parameter rather than a direct call so the refusal path can be
 * exercised offline — CI has no database, and a limit that is only ever observed
 * failing open is a limit whose refusal branch is untested.
 */
export async function enforce(
  req: ApiRequest,
  record: (key: string) => Promise<HitRecord> = recordHit,
): Promise<ThrottleVerdict> {
  const salt = process.env[SALT_VAR] ?? ""
  const ip = clientIp(req)
  const key = throttleKey(ip, salt)

  if (!key) {
    const unenforced = !ip ? "no-ip" : "no-salt"
    console.error(
      `inquiry: rate limit NOT enforced (${unenforced}) — ` +
        (unenforced === "no-salt"
          ? `set ${SALT_VAR} in the environment; without a salt the key would be reversible`
          : "the request carried no x-forwarded-for or x-real-ip header"),
    )
    return { allowed: true, unenforced }
  }

  let hit: HitRecord
  try {
    hit = await record(key)
  } catch (err) {
    console.error("inquiry: rate limit NOT enforced (store-unavailable)", err)
    return { allowed: true, unenforced: "store-unavailable" }
  }

  if (hit.hits === 1 && record === recordHit) {
    // First hit of a new window for this key — the cheapest place to do hygiene.
    //
    // Guarded on the real counter, not just on `hits === 1`: a caller that injects its
    // own recorder (the test suite) has no database to prune, and a developer running
    // the suite with `DATABASE_URL` exported would otherwise issue a delete against
    // production from a unit test. The guard is the difference between "best effort"
    // and "best effort against whatever store happens to be in the environment".
    pruneThrottle().catch((err) => console.error("inquiry: throttle prune failed", err))
  }

  if (hit.hits > THROTTLE.limit) return { allowed: false, retryAfter: hit.retryAfter }
  return { allowed: true }
}
