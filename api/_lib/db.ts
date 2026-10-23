/**
 * The database, over Neon's SQL-over-HTTP endpoint.
 *
 * No `pg`, no `@neondatabase/serverless`: the endpoint is a `fetch` with the
 * connection string in a header, which is one dependency fewer and one pool fewer
 * to leak in a serverless function. Measured reachable from this machine before
 * the first line of this file was written — PostgreSQL 18.6, `neondb`.
 *
 * ⚠️ **One statement per call.** The endpoint prepares every query, and Postgres
 * refuses more than one command in a prepared statement (`42601`). Anything that
 * needs two statements needs two calls, and no call here is a transaction.
 */

/**
 * Where the connection string comes from, in order.
 *
 * `DATABASE_URL` is the name everyone expects, and the Neon Vercel integration does
 * **not** set it — it injects prefixed names instead. Measured in Production on
 * 2026-10-23: `NEON_DATABASE_URL`, `NEON_POSTGRES_URL`, `NEON_POSTGRES_PRISMA_URL`
 * and unpooled variants exist; `DATABASE_URL` does not. Reading only `DATABASE_URL`
 * meant the function loaded correctly and still could not reach the database.
 *
 * Pooled before unpooled, because a serverless function opens a connection per
 * request. `api/health.ts` keeps its **own** copy of this list, because it must not
 * import anything — a test asserts the two copies agree.
 */
export const CONNECTION_VARS = [
  "DATABASE_URL",
  "NEON_DATABASE_URL",
  "POSTGRES_URL",
  "NEON_POSTGRES_URL",
  "NEON_POSTGRES_PRISMA_URL",
] as const

export interface ConnectionSource {
  /** The variable's **name**, so a log can say where the string came from. */
  name: string
  url: string
}

export class DbUnavailable extends Error {}

/** Read per call: a module-level capture bakes in whatever the environment held at import. */
export const connectionSource = (): ConnectionSource | null => {
  for (const name of CONNECTION_VARS) {
    const url = process.env[name]
    if (url) return { name, url }
  }
  return null
}

/**
 * Run one parameterised statement.
 *
 * `$1`-style placeholders are used everywhere a value comes from a request, so a
 * name containing a quote cannot become SQL. There is no string interpolation of
 * user input anywhere in this file's callers.
 */
export async function sql<T = Record<string, unknown>>(
  query: string,
  params: unknown[] = [],
): Promise<T[]> {
  // Read per call, not at module load: a module-level capture bakes in whatever
  // the environment held when the file was first imported, which is a difference
  // that only shows up in a harness or a warm lambda with a rotated secret.
  const source = connectionSource()
  if (!source) throw new DbUnavailable(`no connection string — set one of ${CONNECTION_VARS.join(", ")}`)

  let host: string
  try {
    host = new URL(source.url).host
  } catch {
    // A malformed value should read as "unavailable", not as an unhandled 500.
    throw new DbUnavailable(`${source.name} is not a URL`)
  }

  const res = await fetch(`https://${host}/sql`, {
    method: "POST",
    headers: { "Neon-Connection-String": source.url, "Content-Type": "application/json" },
    body: JSON.stringify({ query, params }),
  })

  const text = await res.text()
  if (!res.ok) {
    // The endpoint puts the Postgres error in the body; a bare status code would
    // turn "column does not exist" into "500", which is unactionable at 2am.
    throw new Error(`neon ${res.status}: ${text.slice(0, 300)}`)
  }
  if (!text) return []
  const body = JSON.parse(text) as { rows?: T[] }
  return body.rows ?? []
}
