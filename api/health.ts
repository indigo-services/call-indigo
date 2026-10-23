/**
 * `GET /api/health` — is the server actually working, in the environment it runs in?
 *
 * Deliberately self-contained: **no import from `api/_lib/`**. That is the point. When
 * every endpoint that shares `api/_lib/` fails with `FUNCTION_INVOCATION_FAILED`, this
 * one has to be able to say whether the problem is the shared module graph or
 * something more fundamental, and it cannot answer that if it shares the graph.
 *
 * It reports **booleans and a version string, never a value**: whether the variables
 * exist is the operational question, and printing a connection string or a key would
 * turn a health check into a disclosure.
 */
interface Req {
  method?: string
}
interface Res {
  status(code: number): Res
  json(body: unknown): void
}

export default async function handler(req: Req, res: Res): Promise<void> {
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.status(405).json({ error: "method_not_allowed", allowed: "GET" })
    return
  }

  // Its own copy of the list, deliberately not an import: this file has to load when
  // nothing else can, which is how the 2026-10-23 outage was localised. A test asserts
  // this copy matches the one in api/_lib/db.ts, so the two cannot drift apart.
  const CANDIDATES = [
    "DATABASE_URL",
    "NEON_DATABASE_URL",
    "POSTGRES_URL",
    "NEON_POSTGRES_URL",
    "NEON_POSTGRES_PRISMA_URL",
  ]
  let source: { name: string; url: string } | null = null
  for (const name of CANDIDATES) {
    const value = process.env[name]
    if (value) {
      source = { name, url: value }
      break
    }
  }

  const out: Record<string, unknown> = {
    ok: true,
    node: process.version,
    env: {
      RESEND_API_KEY: Boolean(process.env.RESEND_API_KEY),
      CLERK_SECRET_KEY: Boolean(process.env.CLERK_SECRET_KEY),
    },
    // The variable's NAME, never its value: naming the source is the operational
    // answer, and it is not a disclosure.
    dbSource: source?.name ?? null,
    db: false,
    dbError: null as string | null,
  }

  if (!source) {
    out.dbError = `no connection string — none of ${CANDIDATES.join(", ")} is set`
  } else {
    try {
      const res2 = await fetch(`https://${new URL(source.url).host}/sql`, {
        method: "POST",
        headers: { "Neon-Connection-String": source.url, "Content-Type": "application/json" },
        body: JSON.stringify({ query: "select count(*)::int as inquiries from inquiries" }),
        signal: AbortSignal.timeout(8000),
      })
      const text = await res2.text()
      if (!res2.ok) {
        out.db = false
        out.dbError = `neon ${res2.status}: ${text.slice(0, 200)}`
      } else {
        out.db = true
        out.inquiries = JSON.parse(text)?.rows?.[0]?.inquiries ?? null
      }
    } catch (err) {
      out.dbError = err instanceof Error ? `${err.name}: ${err.message}` : String(err)
    }
  }

  // A health check that says 200 while the database is unreachable is worse than
  // none, so the status follows the answer.
  res.status(out.db ? 200 : 503).json(out)
}
