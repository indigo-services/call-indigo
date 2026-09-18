/**
 * Inquiries inbox — /admin/inquiries.
 *
 * The other half of the public form: everything submitted on `/contact` lands
 * here. The two pages never reference each other — they are joined by the data
 * layer, which is what makes swapping localStorage for a real API a change to
 * one module rather than to every page.
 *
 * Reading is `useApiData`, writing is `api.updateInquiry` / `api.deleteInquiry`.
 * Every write bumps the API version, so the sidebar's unread badge, the
 * notifications feed and the stats on this page all refresh together.
 */
import { useMemo, useState } from "react"
import { toast } from "sonner"
import { Mail, Phone, Search, Trash2, TriangleAlert } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { PageHeader } from "@/admin/PageHeader"
import { api } from "@/lib/data/api"
import { useApiData } from "@/lib/data/hooks"
import {
  INQUIRY_STATUSES,
  type Inquiry,
  type InquiryStatus,
  type Urgency,
} from "@/lib/data/types"
import { formatDateTime, formatRelative, initials } from "@/lib/format"

/* ── Presentation helpers ────────────────────────────────────────────────── */

const STATUS_STYLE: Record<InquiryStatus, string> = {
  new: "bg-[#30c3eb]/15 text-[#0d6d88] border-[#30c3eb]/40",
  contacted: "bg-amber-100 text-amber-800 border-amber-300",
  quoted: "bg-[#2a5aa2]/12 text-[#1e4276] border-[#2a5aa2]/35",
  won: "bg-emerald-100 text-emerald-800 border-emerald-300",
  lost: "bg-muted text-muted-foreground border-border",
}

function statusLabel(value: InquiryStatus): string {
  return INQUIRY_STATUSES.find((s) => s.value === value)?.label ?? value
}

const URGENCY_STYLE: Record<Urgency, string> = {
  emergency: "bg-destructive/10 text-destructive border-destructive/40",
  soon: "bg-amber-100 text-amber-800 border-amber-300",
  flexible: "bg-muted text-muted-foreground border-border",
}

/** Fields the free-text search looks at. */
function matches(i: Inquiry, q: string): boolean {
  const hay = [i.name, i.email, i.phone, i.service, i.message, i.notes, i.status]
    .join(" ")
    .toLowerCase()
  return hay.includes(q)
}

function isThisWeek(iso: string): boolean {
  return Date.now() - new Date(iso).getTime() < 7 * 24 * 60 * 60 * 1000
}

/* ── Stats ───────────────────────────────────────────────────────────────── */

function Stat({ label, value, tone }: { label: string; value: number; tone?: string }) {
  return (
    <Card className="gap-1 py-4">
      <CardContent className="px-4">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <p className={`mt-1 text-2xl font-bold ${tone ?? "text-foreground"}`}>{value}</p>
      </CardContent>
    </Card>
  )
}

/* ── Page ────────────────────────────────────────────────────────────────── */

export default function InquiriesPage() {
  const { data, loading, error } = useApiData("admin-inquiries", () => api.listInquiries())
  const [query, setQuery] = useState("")
  const [status, setStatus] = useState<InquiryStatus | "all">("all")
  const [openId, setOpenId] = useState<string | null>(null)

  // Memoised so the `useMemo` below can depend on the array itself rather than
  // on an expression that allocates a fresh `[]` on every render.
  const rows = useMemo(() => data ?? [], [data])

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase()
    return rows.filter((i) => (status === "all" || i.status === status) && (q === "" || matches(i, q)))
  }, [rows, query, status])

  const open = rows.find((i) => i.id === openId) ?? null

  const stats = {
    total: rows.length,
    unread: rows.filter((i) => i.status === "new").length,
    emergency: rows.filter((i) => i.urgency === "emergency" && i.status !== "lost").length,
    week: rows.filter((i) => isThisWeek(i.createdAt)).length,
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inquiries"
        description="Every request submitted through the public inquiry form."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="All time" value={stats.total} />
        <Stat label="Unread" value={stats.unread} tone={stats.unread > 0 ? "text-[#0d6d88]" : undefined} />
        <Stat label="Emergency open" value={stats.emergency} tone={stats.emergency > 0 ? "text-destructive" : undefined} />
        <Stat label="Last 7 days" value={stats.week} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filter</CardTitle>
          <CardDescription>
            {shown.length} of {rows.length} shown.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[240px] flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name, phone, service or message…"
              aria-label="Search inquiries"
              className="pl-9"
            />
          </div>
          <Select value={status} onValueChange={(v) => setStatus(v as InquiryStatus | "all")}>
            <SelectTrigger className="w-[190px]" aria-label="Filter by status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {INQUIRY_STATUSES.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {error ? (
        <Card>
          <CardContent className="pt-6 text-sm text-destructive">
            Could not load inquiries: {error.message}
          </CardContent>
        </Card>
      ) : null}

      <Card className="overflow-hidden py-0">
        {loading && rows.length === 0 ? (
          <div className="space-y-3 p-6">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : shown.length === 0 ? (
          <CardContent className="py-12 text-center">
            <p className="text-sm text-muted-foreground">
              {rows.length === 0
                ? "No inquiries yet. Submit one through the contact form and it will appear here."
                : "Nothing matches those filters."}
            </p>
          </CardContent>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6">Who</TableHead>
                <TableHead>Service</TableHead>
                <TableHead>Urgency</TableHead>
                <TableHead>Received</TableHead>
                <TableHead className="pr-6">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {shown.map((i) => (
                <TableRow
                  key={i.id}
                  onClick={() => setOpenId(i.id)}
                  className="cursor-pointer"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault()
                      setOpenId(i.id)
                    }
                  }}
                >
                  <TableCell className="pl-6">
                    <div className="flex items-center gap-3">
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold">
                        {initials(i.name)}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-medium">{i.name}</p>
                        <p className="truncate text-xs text-muted-foreground">{i.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <span className="text-sm">{i.service}</span>
                      <span className="text-xs capitalize text-muted-foreground">
                        {i.propertyType}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={URGENCY_STYLE[i.urgency]}>
                      {i.urgency === "emergency" ? (
                        <TriangleAlert className="mr-1 size-3" />
                      ) : null}
                      {i.urgency}
                    </Badge>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                    {formatRelative(i.createdAt)}
                  </TableCell>
                  <TableCell className="pr-6">
                    <Badge variant="outline" className={STATUS_STYLE[i.status]}>
                      {statusLabel(i.status)}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      <InquiryDetail inquiry={open} onClose={() => setOpenId(null)} />
    </div>
  )
}

/* ── Detail sheet ────────────────────────────────────────────────────────── */

function InquiryDetail({ inquiry, onClose }: { inquiry: Inquiry | null; onClose: () => void }) {
  const [notes, setNotes] = useState("")
  const [notesFor, setNotesFor] = useState<string | null>(null)
  const [confirming, setConfirming] = useState(false)

  // Re-seed the notes box whenever a different inquiry is opened.
  if (inquiry && notesFor !== inquiry.id) {
    setNotesFor(inquiry.id)
    setNotes(inquiry.notes)
  }

  async function setStatus(status: InquiryStatus) {
    if (!inquiry) return
    await api.updateInquiry(inquiry.id, { status })
    toast.success(`Marked as ${statusLabel(status)}`)
  }

  async function saveNotes() {
    if (!inquiry) return
    await api.updateInquiry(inquiry.id, { notes })
    toast.success("Notes saved")
  }

  async function remove() {
    if (!inquiry) return
    await api.deleteInquiry(inquiry.id)
    setConfirming(false)
    onClose()
    toast.success("Inquiry deleted")
  }

  return (
    <Sheet open={inquiry !== null} onOpenChange={(v) => (!v ? onClose() : undefined)}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-[560px]">
        {inquiry ? (
          <>
            <SheetHeader>
              <SheetTitle className="flex items-center gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                  {initials(inquiry.name)}
                </span>
                <span className="min-w-0 truncate">{inquiry.name}</span>
              </SheetTitle>
              <SheetDescription>
                Received {formatDateTime(inquiry.createdAt)} · {formatRelative(inquiry.createdAt)}
              </SheetDescription>
            </SheetHeader>

            <div className="space-y-6 px-4 pb-8">
              <div className="flex flex-wrap gap-2">
                <a
                  href={`tel:${inquiry.phone.replace(/[^\d+]/g, "")}`}
                  className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm font-medium hover:bg-muted"
                >
                  <Phone className="size-4" />
                  {inquiry.phone}
                </a>
                <a
                  href={`mailto:${inquiry.email}`}
                  className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm font-medium hover:bg-muted"
                >
                  <Mail className="size-4" />
                  Email
                </a>
              </div>

              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className={URGENCY_STYLE[inquiry.urgency]}>
                  {inquiry.urgency}
                </Badge>
                <Badge variant="outline">{inquiry.service}</Badge>
                <Badge variant="outline" className="capitalize">
                  {inquiry.propertyType}
                </Badge>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Request</Label>
                <p className="whitespace-pre-wrap rounded-md bg-muted p-3 text-sm leading-relaxed">
                  {inquiry.message}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="detail-status">Status</Label>
                <Select value={inquiry.status} onValueChange={(v) => void setStatus(v as InquiryStatus)}>
                  <SelectTrigger id="detail-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {INQUIRY_STATUSES.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label} — {s.description}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="detail-notes">Internal notes</Label>
                <Textarea
                  id="detail-notes"
                  rows={4}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Called back, quoted $450, waiting on approval…"
                />
                <div className="flex justify-end">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => void saveNotes()}
                    disabled={notes === inquiry.notes}
                  >
                    Save notes
                  </Button>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Delete</Label>
                {confirming ? (
                  <div className="flex flex-wrap items-center gap-3">
                    <p className="text-sm text-muted-foreground">Delete this inquiry for good?</p>
                    <Button size="sm" variant="destructive" onClick={() => void remove()}>
                      Yes, delete
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setConfirming(false)}>
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <Button size="sm" variant="outline" onClick={() => setConfirming(true)}>
                    <Trash2 className="mr-2 size-4" />
                    Delete inquiry
                  </Button>
                )}
              </div>
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  )
}
