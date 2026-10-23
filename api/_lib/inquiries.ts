/**
 * The only place snake_case (Postgres) and camelCase (the pages) meet.
 *
 * Keeping the mapping here rather than in the SQL means the column names can stay
 * unquoted — Postgres folds unquoted identifiers to lower case, so a `"createdAt"`
 * column would have to be quoted at every use, and the first person to forget the
 * quotes gets a silent `column does not exist`.
 */
import type { Inquiry, InquiryStatus } from "../../src/lib/data/types.js"
import type { ValidInquiry } from "./validate.js"
import { sql } from "./db.js"

interface Row {
  id: string
  name: string
  email: string
  phone: string
  property_type: Inquiry["propertyType"]
  service: Inquiry["service"]
  urgency: Inquiry["urgency"]
  message: string
  member: Inquiry["member"] | null
  source: string
  status: InquiryStatus
  notes: string
  created_at: string
  updated_at: string
}

function toInquiry(row: Row): Inquiry & { source: string } {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    propertyType: row.property_type,
    service: row.service,
    urgency: row.urgency,
    message: row.message,
    // `undefined`, not `null`: `Inquiry.member` is optional, and a null would make
    // every consumer handle a third state that the type says cannot exist.
    member: row.member ?? undefined,
    status: row.status,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    source: row.source,
  }
}

const COLUMNS = `id, name, email, phone, property_type, service, urgency, message,
  member, source, status, notes, created_at, updated_at`

export async function insertInquiry(input: ValidInquiry): Promise<Inquiry & { source: string }> {
  const rows = await sql<Row>(
    `insert into inquiries
       (id, name, email, phone, property_type, service, urgency, message, member, source)
     values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     returning ${COLUMNS}`,
    [
      crypto.randomUUID(),
      input.name,
      input.email,
      input.phone,
      input.propertyType,
      input.service,
      input.urgency,
      input.message,
      input.member,
      input.source,
    ],
  )
  const row = rows[0]
  if (!row) throw new Error("insert returned no row")
  return toInquiry(row)
}

export async function listInquiries(limit = 500): Promise<Array<Inquiry & { source: string }>> {
  const rows = await sql<Row>(
    `select ${COLUMNS} from inquiries order by created_at desc limit $1`,
    [Math.min(Math.max(limit, 1), 1000)],
  )
  return rows.map(toInquiry)
}

export async function getInquiry(id: string): Promise<(Inquiry & { source: string }) | null> {
  const rows = await sql<Row>(`select ${COLUMNS} from inquiries where id = $1`, [id])
  return rows[0] ? toInquiry(rows[0]) : null
}

const STATUSES: readonly InquiryStatus[] = ["new", "contacted", "quoted", "won", "lost"]

export interface InquiryPatch {
  status?: InquiryStatus
  notes?: string
}

export async function updateInquiry(
  id: string,
  patch: InquiryPatch,
): Promise<(Inquiry & { source: string }) | null> {
  if (patch.status !== undefined && !STATUSES.includes(patch.status)) {
    throw new Error(`unknown status: ${patch.status}`)
  }
  // COALESCE keeps this to one statement, because the endpoint runs one at a time.
  const rows = await sql<Row>(
    `update inquiries
        set status = coalesce($2, status),
            notes  = coalesce($3, notes),
            updated_at = now()
      where id = $1
      returning ${COLUMNS}`,
    [id, patch.status ?? null, patch.notes ?? null],
  )
  return rows[0] ? toInquiry(rows[0]) : null
}
