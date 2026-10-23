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

const connectionString = (): string | undefined => process.env.DATABASE_URL ?? process.env.POSTGRES_URL

export class DbUnavailable extends Error {}

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
  const url = connectionString()
  if (!url) throw new DbUnavailable("DATABASE_URL is not set")

  const res = await fetch(`https://${new URL(url).host}/sql`, {
    method: "POST",
    headers: { "Neon-Connection-String": url, "Content-Type": "application/json" },
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
