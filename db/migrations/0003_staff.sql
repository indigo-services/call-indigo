-- 0003 — who works here, and at what level.
--
-- The requirement was three staff roles: Admin, Service Manager, Service Rep.
-- Clerk was the obvious home for them, and it is not available: measured against
-- the production instance on 2026-10-27,
--
--     POST /v1/organization_roles
--     → 402 unsupported_subscription_plan_features  { unsupported_features: ["org:roles"] }
--
-- `max_allowed_roles` reports 10, which reads like "ten custom roles are fine",
-- but that number is the ceiling for a plan that includes the feature. It does
-- not. The only roles this instance has are `org:admin` and `org:member`, and
-- `max_allowed_permissions` is 0, so even a custom role could not carry a
-- capability.
--
-- So Clerk answers one question — *are you in Indigo Services?* — and this table
-- answers the other — *at what level?* That split is better than the one it
-- replaces, not merely cheaper:
--
--   · a role in a vendor dashboard is invisible to `git`, untestable, and changes
--     without a review; this table is in the repo, and `api/_lib/roles.ts` is
--     asserted by tests;
--   · a level change here takes effect on the next request, where a Clerk role
--     would be baked into the session token until it refreshes;
--   · "which rep is assigned to this lead" needs a join to `inquiries` anyway, so
--     the staff record has to be reachable from SQL regardless.
--
-- ⚠️ **Clerk `org:admin` outranks this table.** `api/_lib/auth.ts` grants the
-- admin capability set to a Clerk admin *without* consulting this row, so the
-- table starting empty cannot lock the two existing operators out — and cannot
-- be used to demote them by editing a row. A row can only narrow what Clerk
-- already granted, never widen it.

create table if not exists staff (
  -- Clerk's user id (`user_…`). Not a foreign key: Clerk is not in this database,
  -- and a constraint across the two systems would fail every time Clerk deleted
  -- an account. A stale row is inert — `api/_lib/staff.ts` looks it up by the id
  -- on a verified token, so a row for a deleted user can never be reached.
  clerk_user_id text primary key,

  -- Deliberately not an enum type. A new level is a code change in
  -- `api/_lib/roles.ts`, which already refuses an unknown key; a Postgres enum
  -- would need its own migration to add a value, and the two would drift.
  role          text not null default 'service_rep'
                check (role in ('admin', 'service_manager', 'service_rep')),

  -- Leavers keep their row so the audit trail stays intact; `active = false`
  -- is what withdraws access. Deleting the row would also work and would lose
  -- the record of who was ever allowed to see a customer's phone number.
  active        boolean not null default true,

  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Every authorization decision reads by this column, and it is already the
-- primary key, so no second index is needed. This comment exists so the absence
-- is not read as an oversight.
