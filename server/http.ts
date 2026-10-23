/**
 * The smallest HTTP surface the handlers need, typed locally.
 *
 * `@vercel/node` exists for this, and it would be a dependency whose only job is
 * to describe four methods. These interfaces match what Vercel actually passes
 * (an IncomingMessage with a parsed `body`, and a ServerResponse with `status()`
 * and `json()`), so a handler written against them runs unchanged.
 */

export interface ApiRequest {
  method?: string
  url?: string
  headers: Record<string, string | string[] | undefined>
  body?: unknown
  query?: Record<string, string | string[] | undefined>
}

export interface ApiResponse {
  status(code: number): ApiResponse
  json(body: unknown): void
  setHeader(name: string, value: string): void
  end(): void
}

/** A JSON body, whatever the platform did or did not parse for us. */
export function body<T = unknown>(req: ApiRequest): T | null {
  const raw = req.body
  if (raw === undefined || raw === null || raw === "") return null
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw) as T
    } catch {
      return null
    }
  }
  if (typeof raw === "object") return raw as T
  return null
}

export function header(req: ApiRequest, name: string): string {
  const value = req.headers[name] ?? req.headers[name.toLowerCase()]
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "")
}

/** `Authorization: Bearer <token>` → `<token>`, or "" when absent. */
export function bearer(req: ApiRequest): string {
  const match = /^Bearer\s+(.+)$/i.exec(header(req, "authorization"))
  return match ? match[1] : ""
}

export function methodNotAllowed(res: ApiResponse, allowed: string): void {
  res.setHeader("Allow", allowed)
  res.status(405).json({ error: "method_not_allowed", allowed })
}

/**
 * No CORS headers, deliberately.
 *
 * This API is called by the site's own pages and by nothing else, so a permissive
 * `Access-Control-Allow-Origin` would only widen who may post a lead. Same-origin
 * needs no header at all.
 */
