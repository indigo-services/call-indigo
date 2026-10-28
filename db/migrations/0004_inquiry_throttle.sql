-- 0004 — how often one connection may post a lead.
--
-- #94. Until this table, `POST /api/inquiry` accepted requests as fast as a client
-- could open connections, and every accepted request cost a Postgres row and a
-- **paid Resend send**. A loop of 500 requests was 500 rows and 500 emails.
--
-- ## Why a table here and not a second vendor
--
-- Upstash and Vercel KV are purpose-built for this, and both mean a new vendor, a
-- new env var, a new failure mode in the one code path that must never lose a lead.
-- `api/_lib/db.ts` already speaks Postgres over HTTP, and one upsert per request is
-- the whole of the work. At this volume the counter does not justify a second store.
--
-- ## What is stored, and what deliberately is not
--
-- `throttle_key` is **`sha256(ip + THROTTLE_SALT)`**, never the address. This is the
-- privacy decision #94 asked to be made before the schema was written, and it was
-- made in favour of hashing: an unsalted hash of an IPv4 address is not anonymisation
-- at all — the whole space is 2^32 and a laptop walks it in minutes — so the salt is
-- load-bearing, not decoration. `api/_lib/throttle.ts` refuses to build a key without
-- one rather than silently falling back to a reversible value.
--
-- The hash is still pseudonymous data: it is stable for a given address and salt, so
-- it can link two submissions from one connection inside the retention window. That
-- is why the privacy policy names it (§2) rather than leaving the claim that only the
-- hosting provider sees an address standing.
--
-- ## Why a fixed window
--
-- A sliding window needs either a row per request or a second read, and the point of
-- this table is that it costs one statement. Windows are aligned to the clock minute
-- by `date_trunc('minute', now())`, so `Retry-After` is simply "seconds until the
-- next boundary" and needs no stored expiry arithmetic. The cost is a burst at a
-- boundary — up to 2× the limit across two adjacent minutes — which for a lead form
-- is irrelevant and is written down here so it is not later mistaken for a bug.

create table if not exists inquiry_throttle (
  -- sha256 hex of the connection's address and a server-side salt. 64 chars.
  throttle_key  text        not null,

  -- The aligned start of the window this row counts. Part of the key, so a new
  -- window is a new row and the old one needs no update to "expire".
  window_start  timestamptz not null,

  hits          integer     not null default 1,

  -- The primary key is the lookup path: every request upserts on exactly this pair.
  -- A separate index would be a second structure over the same columns.
  primary key (throttle_key, window_start)
);

-- Pruning reads by age alone (`where window_start < now() - interval '1 day'`), which
-- the composite primary key cannot serve — it leads on `throttle_key`. Without this,
-- every prune is a sequential scan of a table that only grows.
create index if not exists inquiry_throttle_window_start_idx
  on inquiry_throttle (window_start);

-- No foreign keys and no references to `inquiries`: a refused submission writes
-- nothing to `inquiries` at all, which is the property #94 asks to be asserted — a
-- throttle that records the request it refused is a throttle that stores spam.
