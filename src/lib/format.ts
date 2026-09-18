/**
 * Small display formatters shared by the dashboard.
 *
 * Kept separate from the data layer so the API never returns pre-formatted
 * strings — a real HTTP backend returns ISO timestamps, and formatting is a
 * presentation concern.
 */

/** "18 Sep 2026, 09:00" */
export function formatDateTime(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return "—"
  return d.toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

/** "18 Sep 2026" */
export function formatDate(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return "—"
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })
}

/**
 * "3 days ago", "just now", "in 2 hours". Falls back to an absolute date past
 * a week, where relative wording stops being more useful than the date itself.
 */
export function formatRelative(iso: string): string {
  const then = new Date(iso).getTime()
  if (Number.isNaN(then)) return "—"

  const diffMs = Date.now() - then
  const future = diffMs < 0
  const mins = Math.round(Math.abs(diffMs) / 60_000)

  if (mins < 1) return "just now"
  if (mins < 60) return future ? `in ${mins} min` : `${mins} min ago`

  const hours = Math.round(mins / 60)
  if (hours < 24) return future ? `in ${hours} hr` : `${hours} hr ago`

  const days = Math.round(hours / 24)
  if (days <= 7) return future ? `in ${days} d` : `${days} d ago`

  return formatDate(iso)
}

/** 1234 -> "1,234" */
export function formatNumber(n: number): string {
  return new Intl.NumberFormat().format(n)
}

/** Renders byte counts as KB/MB. */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/** "Amanda Reyes" -> "AR". Used for avatar fallbacks. */
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "?"
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}
