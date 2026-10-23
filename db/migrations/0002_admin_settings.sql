-- 0002 — the admin's own configuration, moved off one browser's localStorage.
--
-- Until this table existed, `SiteSettings`, `AdminProfile` and `NotificationPrefs`
-- lived in `localStorage`. Two consequences, one of them a live bug: a visitor's
-- browser decided the site's theme colours (`src/lib/use-theme.ts` reads the same
-- record), and an admin who edited the business phone number changed it for nobody
-- else.
--
-- One table rather than three, because these are three shapes of the same thing: a
-- single row per key, owned by the business, written only by an admin. The value is
-- `jsonb` so a shape change is a code change rather than a migration — the shapes
-- are validated in `api/_lib/adminSettings.ts`, which is where the rules belong,
-- because that is the boundary a request crosses.
--
-- `if not exists`, so applying this twice is a no-op. See 0001 for why that matters:
-- `scripts/_db_migrate.cjs` has no transaction to roll back.

create table if not exists admin_settings (
  key        text primary key,
  value      jsonb not null,
  updated_at timestamptz not null default now()
);
