-- 0005 — who changed whose staff level, and when.
--
-- `staff.updated_at` says *when* a level last changed. It has never said *who*
-- changed it, and before #102 there was no one to ask: a level was set by a psql
-- session against production, so the database's own timestamp was the whole
-- record. #102 made it a button on `/admin/team`, which turned an unattributable
-- fact into an unattributable *action* — and the two questions an incident asks,
--
--     who made this person a manager, and when
--     who withdrew this person's access, and when
--
-- were both unanswerable. The only trace was Vercel's function log, retained for
-- hours rather than for the life of the account.
--
-- ── Why a log and not `staff.updated_by` ────────────────────────────────────
--
-- A single `updated_by` column survives only the most recent change. Re-promote
-- someone and the record of who demoted them is gone — which is precisely the
-- sequence an incident is about. The log keeps every transition, and `staff`
-- keeps none of them, so there is one place to read and no second copy to drift.
--
-- ── Why no foreign keys ─────────────────────────────────────────────────────
--
-- `actor_id` and `subject_id` are Clerk user ids. Clerk is not in this database,
-- and a constraint across the two systems fails every time Clerk deletes an
-- account — which is also the moment the audit record matters most. A stale id
-- here is inert: the panel resolves it against the roster and falls back to the
-- id itself.
--
-- ── Why no CHECK on the role columns ────────────────────────────────────────
--
-- `staff.role` already has the CHECK, so a bad value cannot reach this table
-- through the writer. Adding a second one here would only add a way for a
-- legitimate level change to fail: the audit insert runs in the *same statement*
-- as the level change, so a constraint violation here rolls back both. The record
-- must never be the reason the change it records does not happen.

create table if not exists staff_audit (
  -- Identity rather than a timestamp for ordering: two changes in the same
  -- millisecond are possible from a script, and `at` is not unique.
  id          bigint generated always as identity primary key,

  -- Who pressed the button. From the verified Clerk session (`auth.userId`),
  -- never from the request body — a body field would let a caller attribute
  -- their own change to someone else.
  actor_id    text not null,

  -- Whose level changed.
  subject_id  text not null,

  -- Null on a first assignment: there was no previous level to come from.
  -- "Promoted from nothing" and "promoted from rep" are different facts, and a
  -- default here would erase the difference.
  from_role   text,
  to_role     text not null,

  -- Null on a first assignment, for the same reason. `from_active = false` and
  -- `from_active is null` mean different things: one is a restored leaver, the
  -- other is a person who had never been given access.
  from_active boolean,
  to_active   boolean not null,

  at          timestamptz not null default now()
);

-- "Who changed this person" — the question an incident asks about one subject.
create index if not exists staff_audit_subject_idx
  on staff_audit (subject_id, at desc);

-- "What has been changed lately" — the panel's own ordering, which reads the
-- whole table rather than one subject.
create index if not exists staff_audit_at_idx
  on staff_audit (at desc);
