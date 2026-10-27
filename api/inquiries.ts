/**
 * `/api/inquiries` — the inbox's data.
 *
 * Until this existed, `/admin/inquiries` read one browser's `localStorage`, which
 * meant two devices saw two different inboxes and a lead that arrived by email was
 * invisible to both. This is proposal A2 for the inquiry domain
 * (`docs/40-project/proposal-backend-and-lead-handling-2026-09-29.md`).
 *
 * Every method is admin-only, and the check runs **before** anything else: no query
 * parsing, no body read, no database round trip for a caller who is about to be
 * refused. The authorization itself is `api/_lib/auth.ts` — the same org-pinned rule
 * the settings endpoint uses.
 *
 *   GET    /api/inquiries        → { inquiries: [...] }   newest first
 *   GET    /api/inquiries?id=…   → { inquiry }
 *   PATCH  /api/inquiries        → { inquiry }            body { id, status?, notes? }
 *   DELETE /api/inquiries?id=…   → 204
 */
import { body, methodNotAllowed, queryParam, type ApiRequest, type ApiResponse } from "./_lib/http.js"
import { denialBody, requireCapability } from "./_lib/auth.js"
import {
  deleteInquiry,
  getInquiry,
  isInquiryStatus,
  listInquiries,
  updateInquiry,
  type InquiryPatch,
} from "./_lib/inquiries.js"

const ALLOWED = "GET, PATCH, DELETE"
const MAX_NOTES = 4000

export default async function handler(req: ApiRequest, res: ApiResponse): Promise<void> {
  const method = req.method ?? "GET"
  if (method !== "GET" && method !== "PATCH" && method !== "DELETE") {
    methodNotAllowed(res, ALLOWED)
    return
  }

  // The method decides which capability is needed, so `method` is read first —
  // and nothing else is. No query parameter, no body and no database call happens
  // until this returns; `tests/backend.mjs` asserts that by position, because a
  // status code alone cannot tell "refused" from "refused after writing".
  const capability =
    method === "GET" ? "inbox:read" : method === "PATCH" ? "inbox:write" : "inbox:delete"
  const auth = await requireCapability(req, capability)
  if (!auth.ok) {
    res.status(auth.status).json(denialBody(auth))
    return
  }

  try {
    if (method === "GET") {
      const id = queryParam(req, "id")
      if (id) {
        const inquiry = await getInquiry(id)
        if (!inquiry) {
          res.status(404).json({ error: "not_found" })
          return
        }
        res.status(200).json({ inquiry })
        return
      }
      res.status(200).json({ inquiries: await listInquiries() })
      return
    }

    if (method === "PATCH") {
      const input = body<{ id?: unknown; status?: unknown; notes?: unknown }>(req)
      if (!input || typeof input !== "object") {
        res.status(422).json({ error: "validation_failed", fields: { body: "required" } })
        return
      }
      if (typeof input.id !== "string" || !input.id) {
        res.status(422).json({ error: "validation_failed", fields: { id: "required" } })
        return
      }

      const patch: InquiryPatch = {}
      const fields: Record<string, string> = {}
      if (input.status !== undefined) {
        if (isInquiryStatus(input.status)) patch.status = input.status
        else fields.status = "one of new, contacted, quoted, won, lost"
      }
      if (input.notes !== undefined) {
        if (typeof input.notes === "string") patch.notes = input.notes.slice(0, MAX_NOTES)
        else fields.notes = "text"
      }
      if (Object.keys(fields).length > 0) {
        res.status(422).json({ error: "validation_failed", fields })
        return
      }
      if (patch.status === undefined && patch.notes === undefined) {
        // An empty patch would still bump `updated_at`, which reads as activity.
        res.status(422).json({ error: "validation_failed", fields: { patch: "nothing to change" } })
        return
      }

      const updated = await updateInquiry(input.id, patch)
      if (!updated) {
        res.status(404).json({ error: "not_found" })
        return
      }
      res.status(200).json({ inquiry: updated })
      return
    }

    // DELETE
    const id = queryParam(req, "id")
    if (!id) {
      res.status(422).json({ error: "validation_failed", fields: { id: "required" } })
      return
    }
    const removed = await deleteInquiry(id)
    if (!removed) {
      res.status(404).json({ error: "not_found" })
      return
    }
    res.status(204).end()
  } catch (err) {
    // The database is the only thing that can throw past the validation above.
    console.error("inquiries: request failed", err)
    res.status(503).json({ error: "unavailable" })
  }
}
