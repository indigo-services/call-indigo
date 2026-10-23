/**
 * `/api/settings` — the admin's own configuration, out of `localStorage`.
 *
 *   GET /api/settings?key=site            public — the public site needs it
 *   GET /api/settings?key=profile         admin
 *   GET /api/settings?key=notifications   admin
 *   PUT /api/settings?key=…               admin
 *
 * `site` is the only key a `GET` leaves open, and deliberately: the marketing pages
 * read it for the theme colours and the phone number, and both are public facts.
 * Every write is admin-only. `null` means the key has never been written — the client
 * merges its shipped defaults, so a fresh install renders rather than blank.
 *
 * The key has to be read before the authorization decision, because it decides
 * whether there is one. Nothing else is touched first: the body is read only after
 * the caller has been authorised.
 */
import { body, methodNotAllowed, queryParam, type ApiRequest, type ApiResponse } from "./_lib/http.js"
import { requireAdmin } from "./_lib/auth.js"
import {
  PUBLIC_KEYS,
  isSettingsKey,
  readSettings,
  validateSettings,
  writeSettings,
} from "./_lib/adminSettings.js"

const ALLOWED = "GET, PUT"

export default async function handler(req: ApiRequest, res: ApiResponse): Promise<void> {
  const method = req.method ?? "GET"
  if (method !== "GET" && method !== "PUT") {
    methodNotAllowed(res, ALLOWED)
    return
  }

  const key = queryParam(req, "key")
  if (!isSettingsKey(key)) {
    res.status(422).json({ error: "validation_failed", fields: { key: "site, profile or notifications" } })
    return
  }

  const isPublicRead = method === "GET" && PUBLIC_KEYS.includes(key)
  if (!isPublicRead) {
    const auth = await requireAdmin(req)
    if (!auth.ok) {
      res.status(auth.status).json({ error: auth.error })
      return
    }
  }

  try {
    if (method === "GET") {
      res.status(200).json({ key, value: await readSettings(key) })
      return
    }

    const valid = validateSettings(key, body<unknown>(req))
    if (!valid.ok) {
      res.status(422).json({ error: "validation_failed", fields: valid.fields })
      return
    }
    await writeSettings(key, valid.value)
    // Echo the stored value, not the request: it is what the page will read back,
    // and it makes a silently-dropped unknown key visible in the response.
    res.status(200).json({ key, value: valid.value })
  } catch (err) {
    console.error("settings: request failed", err)
    res.status(503).json({ error: "unavailable" })
  }
}
