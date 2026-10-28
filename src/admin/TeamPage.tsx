/**
 * Team — /admin/team (issue #102).
 *
 * The roster, and the level each person holds. Until this page existed the only
 * way to give someone a level was a psql session against production, which is not
 * a permanent answer for a dashboard whose whole point is that a non-technical
 * operator can run the desk.
 *
 * ── Three states, and why each is drawn differently ─────────────────────────
 *
 * 1. **A Clerk admin.** Their level is decided by Clerk, before the `staff` table
 *    is even read (`roleFromOrgRole` short-circuits). So there is no select: a
 *    control there would write a row that never applies, and an operator who moved
 *    it and saw nothing change would read that as a broken feature. The badge says
 *    where the level comes from instead.
 * 2. **A member with a row.** A select, when this session holds `settings:write`.
 *    The Access column shows what the level amounts to, because "service_manager"
 *    is our word for it and "deletes leads" is the fact.
 * 3. **A member with no row.** Shown as *no level set*, with a select — not as an
 *    error and not as an absence. That is exactly what the server does with them:
 *    the `member` floor, a read-only inbox. Hiding them would make "not set up
 *    yet" look like "not allowed".
 *
 * ── Why the page is visible without `settings:write` ────────────────────────
 *
 * `settings:read` opens this page and only this page. A Service Manager sees the
 * whole roster and can move none of it — a finished read view, which is the
 * difference between this and a settings form whose every control is disabled.
 * Who works here is not a secret from the person who runs the desk.
 *
 * ── The fourth card: what changed, and who changed it ───────────────────────
 *
 * The roster says what everyone's level *is*. It cannot say how it got that way,
 * which is the question an incident asks — and until #114 the answer was nowhere,
 * because `staff.updated_at` records *when* and never *who*. `Recent changes`
 * reads `staff_audit`, which the server writes in the same statement as the
 * change itself, so a row here cannot describe something that did not happen.
 *
 * The sentence for each row comes from `changeText()` in `team-roster.ts`, not
 * from a template in this file: a first assignment has no previous level, and an
 * access change is not a level change at all — both are wrong the moment they are
 * squeezed through one `a → b` template.
 *
 * ⚠️ **Nothing here is authorization**, and the rules are not in this file:
 * `team-roster.ts` decides which control belongs on a row (so it can be tested —
 * Radix's `Select` cannot be imported into the runner), and `api/staff.ts`
 * re-checks `settings:read` on the read and `settings:write` on the write.
 */
import { useState } from "react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { PageHeader } from "@/admin/PageHeader"
import { useAdminAccess } from "@/admin/access-context"
import { LEVELS, LEVEL_LABEL, accessText, changeText, personName, refusalText, rowState } from "@/admin/team-roster"
import { useAuth } from "@clerk/react"
import { api } from "@/lib/data/api"
import { useApiData } from "@/lib/data/hooks"
import type { StaffLevel, StaffMember } from "@/lib/data/types"
import { formatRelative, initials } from "@/lib/format"

export default function TeamPage() {
  const { getToken, userId } = useAuth()
  const access = useAdminAccess()
  const canWrite = access.capabilities.has("settings:write")
  const { data, loading, error } = useApiData("admin-staff", () => api.getTeam(getToken))
  // Both come from one request, so they cannot describe different moments. `?? []`
  // covers the first render, before the response lands.
  const roster = data?.staff ?? []
  const audit = data?.audit ?? []
  const [pending, setPending] = useState<string | null>(null)

  async function change(member: StaffMember, patch: { role?: StaffLevel; active?: boolean }) {
    setPending(member.userId)
    try {
      await api.setStaffLevel(
        { userId: member.userId, role: patch.role ?? member.role ?? "service_rep", ...patch },
        getToken,
      )
      // `bump()` inside the api repaints every reader, so this page reloads
      // without asking: the table is `useApiData`, not a local copy that could
      // drift from what the server stored.
      const level = LEVEL_LABEL[patch.role ?? member.role ?? "service_rep"]
      // A level change does not resurrect a deactivated person, and the toast says
      // so rather than implying it did. `role !== null` for the same reason
      // `rowState()` uses it — a member with no row also reports `active: false`.
      const withdrawn = member.role !== null && !member.active
      toast.success(
        patch.active === false
          ? `${member.name} no longer has access`
          : patch.active === true
            ? `${member.name} can sign in again`
            : withdrawn
              ? `${member.name} is now ${level}, and still inactive`
              : `${member.name} is now ${level}`,
      )
    } catch (err) {
      toast.error(refusalText(err instanceof Error ? err.message : String(err)))
    } finally {
      setPending(null)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Team" description="Who can sign in, and what each person may do." />

      {error ? (
        <Card>
          <CardContent className="pt-6 text-sm text-destructive">
            Could not load the team: {error.message}
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>People</CardTitle>
          <CardDescription>
            {canWrite
              ? "A level applies from that person's next request — they do not have to sign in again."
              : "You can see everyone here. An administrator changes levels."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading && !data ? (
            <div className="space-y-3">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : roster.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nobody is in Indigo Services yet. Add people in the Clerk dashboard, then come back.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Person</TableHead>
                  <TableHead>Level</TableHead>
                  <TableHead>Access</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {roster.map((member) => {
                  const isSelf = member.userId === userId
                  const isClerkAdmin = member.orgRole === "org:admin"
                  const state = rowState(member, { canWrite, isSelf })

                  return (
                    <TableRow key={member.userId}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                            {initials(member.name)}
                          </span>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-foreground">
                              {member.name}
                              {isSelf ? (
                                <span className="ml-2 text-xs font-normal text-muted-foreground">you</span>
                              ) : null}
                            </p>
                            <p className="truncate text-xs text-muted-foreground">{member.email}</p>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        {isClerkAdmin ? (
                          <Badge variant="outline" className="border-primary/40 text-primary">
                            Clerk admin
                          </Badge>
                        ) : state.editable ? (
                          <Select
                            // `""`, not a sentinel: Radix shows the placeholder only
                            // for `""` or `undefined`, and any other unmatched value
                            // renders an empty trigger.
                            value={member.role ?? ""}
                            disabled={pending === member.userId}
                            onValueChange={(value) =>
                              void change(member, { role: value as StaffLevel })
                            }
                          >
                            <SelectTrigger className="w-48" aria-label={`Level for ${member.name}`}>
                              <SelectValue placeholder="No level set" />
                            </SelectTrigger>
                            <SelectContent>
                              {LEVELS.map((level) => (
                                <SelectItem key={level.value} value={level.value}>
                                  {level.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <span className="text-sm text-foreground">
                            {member.role ? LEVEL_LABEL[member.role] : "No level set"}
                          </span>
                        )}
                        {isSelf && canWrite && !isClerkAdmin ? (
                          <p className="mt-1 text-xs text-muted-foreground">
                            You cannot change your own level.
                          </p>
                        ) : null}
                      </TableCell>

                      <TableCell>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm text-foreground">{accessText(member)}</span>
                          {state.showInactive ? (
                            <Badge variant="outline" className="border-border text-muted-foreground">
                              Inactive
                            </Badge>
                          ) : null}
                          {state.canWithdraw ? (
                            <Button
                              size="sm"
                              variant="ghost"
                              disabled={pending === member.userId}
                              onClick={() => void change(member, { active: false })}
                            >
                              Remove access
                            </Button>
                          ) : null}
                          {state.canRestore ? (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={pending === member.userId}
                              onClick={() => void change(member, { active: true })}
                            >
                              Restore
                            </Button>
                          ) : null}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* ── Who changed whose level (#114) ────────────────────────────────────
       *
       * `staff.updated_at` says when a level last changed and never said who
       * changed it, so the two questions an incident asks — who made this person
       * a manager, who withdrew this person's access — were unanswerable from the
       * data. This reads `staff_audit`, which the write below records in the same
       * statement as the change itself.
       */}
      <Card>
        <CardHeader>
          <CardTitle>Recent changes</CardTitle>
          <CardDescription>
            Who changed whose level, and when. Each row was written in the same statement as the
            change it describes, so there is no change here that did not happen — and no level
            change that went unrecorded.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading && !data ? (
            <Skeleton className="h-12 w-full" />
          ) : audit.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No level has been changed since this record began. It fills the first time someone
              changes one.
            </p>
          ) : (
            <ul className="space-y-3">
              {audit.map((entry) => (
                <li
                  key={entry.id}
                  className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-border pb-3 text-sm last:border-0 last:pb-0"
                >
                  <span className="text-muted-foreground">
                    <strong className="font-medium text-foreground">
                      {personName(entry.actorId, roster)}
                    </strong>{" "}
                    changed{" "}
                    <strong className="font-medium text-foreground">
                      {personName(entry.subjectId, roster)}
                    </strong>
                  </span>
                  <span className="text-foreground">{changeText(entry)}</span>
                  <span className="text-xs text-muted-foreground">{formatRelative(entry.at)}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>How a level is decided</CardTitle>
          <CardDescription>
            Two facts, from two places. Clerk says whether someone is in Indigo Services; this
            database says at what level. A Clerk admin is an admin whatever their level says, which
            is why that badge has no control — and why the last admin cannot demote themselves out
            of the page that would fix it.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {LEVELS.map((level) => (
            <div key={level.value} className="flex flex-wrap items-baseline gap-2 text-sm">
              <span className="font-medium text-foreground">{level.label}</span>
              <span className="text-muted-foreground">{level.hint}</span>
            </div>
          ))}
          <div className="flex flex-wrap items-baseline gap-2 text-sm">
            <span className="font-medium text-foreground">No level set</span>
            <span className="text-muted-foreground">
              A read-only inbox. That is what the server does with a member who has no row, so it is
              a state to set, not an error.
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
