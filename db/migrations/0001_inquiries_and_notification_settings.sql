-- 0001 — the first two tables the site has ever had.
--
-- Nothing in this repository had a server before #68: `src/lib/data/backend.ts`
-- is a localStorage engine, and Neon's `neondb` held zero tables when this
-- migration was written. So this file is additive by construction rather than by
-- convention, and every statement is written to be re-runnable: applying it twice
-- is a no-op, which is what lets `scripts/_db_migrate.cjs` be safe to run on every
-- deploy without a "have I already done this?" flag.
--
-- Column names are snake_case because Postgres folds unquoted identifiers; the
-- camelCase the pages consume is mapped in `api/_lib/inquiries.ts`, at the one
-- boundary where the two meet, rather than by quoting every identifier here.

/* ── Inquiries ───────────────────────────────────────────────────────────── */

create table if not exists inquiries (
  id            text primary key,
  name          text not null,
  email         text not null,
  phone         text not null,
  property_type text not null check (property_type in ('residential', 'commercial')),
  service       text not null,
  urgency       text not null check (urgency in ('emergency', 'soon', 'flexible')),
  message       text not null,

  -- Nullable, and deliberately so. `Inquiry.member` is optional on the way OUT
  -- because records written before 2026-09-25 predate the question; the API
  -- requires it on the way IN (see NewInquiry). A NOT NULL here would make the
  -- two sides disagree in the direction that loses data.
  member        text check (member in ('yes', 'no')),

  -- Which form it came from — proposal §3.2. Defaulted rather than nullable so
  -- "where did this lead come from?" is always answerable, and `contact` is the
  -- only writer today.
  source        text not null default 'contact',

  status        text not null default 'new'
                check (status in ('new', 'contacted', 'quoted', 'won', 'lost')),
  notes         text not null default '',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- The inbox reads newest-first; this is the only access path it has.
create index if not exists inquiries_created_at_idx on inquiries (created_at desc);

/* ── Notification settings ───────────────────────────────────────────────── */

-- One row, not many: there is exactly one business, and a table of destinations
-- would invite a second row that nothing reads.
--
-- `from_email` is NOT a column on purpose. Resend will only send from a verified
-- domain (`call-indigo.com`), so exposing it would let an admin set a sender that
-- silently fails every send. It stays a constant in code.
create table if not exists notification_settings (
  id               text primary key default 'default',
  to_email         text not null,
  reply_to         text not null default '',
  bcc              text not null default '',
  subject_template text not null default 'New inquiry — {{name}} ({{service}})',
  updated_at       timestamptz not null default now()
);

-- The value the client asked for, as the seed rather than as a hidden default in
-- code: an empty settings table and a hardcoded fallback would mean the admin UI
-- shows one thing and the sender uses another the first time a row is missing.
insert into notification_settings (id, to_email)
values ('default', 'indigobuildops@gmail.com')
on conflict (id) do nothing;
