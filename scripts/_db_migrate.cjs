#!/usr/bin/env node
/**
 * Apply `db/migrations/*.sql` to the database in `DATABASE_URL`, in filename order,
 * once each.
 *
 * WHY A RUNNER AND NOT A PASTE. Until #68 this repository had no server and no
 * schema, so there was nothing to migrate. What it *did* have is a rule about
 * schema: additive, idempotent, enforced by a check, never applied by pasting SQL
 * into a console (`docs/20-development/standards.md`). A console paste is
 * unrepeatable — nobody can tell which statements ran on production — and it is
 * how a table ends up existing in one environment and not another.
 *
 * `schema_migrations` is the ledger. A file is applied when its name is not in the
 * ledger, and each file is applied inside a transaction together with its ledger
 * row, so a failure leaves neither the table nor the record behind.
 *
 * The statements themselves are ALSO written `if not exists` — belt and braces,
 * because a ledger can be lost (a restored dump, a new branch database) while the
 * objects survive, and re-running must not then fail.
 *
 * Usage:
 *   node scripts/_db_migrate.cjs            # apply what is pending
 *   node scripts/_db_migrate.cjs --check    # exit 1 if anything is pending; apply nothing
 *
 * Connection: `DATABASE_URL` from the environment, else from `.env.local`. The
 * script speaks Neon's SQL-over-HTTP endpoint, so it needs no `pg` dependency —
 * and works from a sandbox where only HTTPS is reachable.
 */
const fs = require("fs")
const path = require("path")

const ROOT = path.resolve(__dirname, "..")
const DIR = path.join(ROOT, "db", "migrations")
const CHECK = process.argv.includes("--check")

/** Minimal .env.local reader — no dependency, no override of real env vars. */
function envLocal() {
  const file = path.join(ROOT, ".env.local")
  if (!fs.existsSync(file)) return {}
  const out = {}
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    if (!line || line.startsWith("#") || !line.includes("=")) continue
    const i = line.indexOf("=")
    out[line.slice(0, i).trim()] = line
      .slice(i + 1)
      .trim()
      .replace(/^["']|["']$/g, "")
  }
  return out
}

const env = { ...envLocal(), ...process.env }
const url = env.DATABASE_URL
if (!url) {
  console.error("DATABASE_URL is not set (checked the environment and .env.local).")
  process.exit(1)
}
const host = new URL(url).host

/**
 * One round trip, one statement batch.
 *
 * ⚠️ **One statement per request.** Neon's SQL-over-HTTP endpoint prepares every
 * query, and Postgres refuses more than one command in a prepared statement
 * (`42601 cannot insert multiple commands into a prepared statement`) — measured
 * on the first attempt to send a whole file, `begin; …; commit;` included. So the
 * file is split here, and there is **no transaction around a migration**: a file
 * that fails halfway leaves the statements before it applied. That is why every
 * statement in `db/migrations/` is written `if not exists` — a re-run after a
 * partial apply is the recovery path, and the ledger row is only written once the
 * last statement has succeeded.
 */
async function sql(query) {
  const res = await fetch(`https://${host}/sql`, {
    method: "POST",
    headers: { "Neon-Connection-String": url, "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  })
  const text = await res.text()
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${text.slice(0, 400)}`)
  return text ? JSON.parse(text) : { rows: [] }
}

/**
 * Split a .sql file into statements.
 *
 * Deliberately conservative: it understands `--` comments and single-quoted
 * strings, and it **refuses** `$tag$` bodies and `create function`, because
 * splitting those by semicolon is wrong and a wrong split would run half a
 * function body as if it were a statement. Nothing in this directory needs them;
 * the refusal is here so that the day something does, it fails loudly instead of
 * quietly doing the wrong thing.
 */
function statements(body) {
  if (/\$\w*\$/.test(body) || /create\s+(or\s+replace\s+)?function/i.test(body)) {
    throw new Error("dollar-quoted bodies and create function cannot be split safely — apply by hand")
  }
  const out = []
  let buf = ""
  let quoted = false
  for (let i = 0; i < body.length; i++) {
    const ch = body[i]
    if (quoted) {
      buf += ch
      if (ch === "'") quoted = false
      continue
    }
    if (ch === "'") {
      quoted = true
      buf += ch
      continue
    }
    if (ch === "-" && body[i + 1] === "-") {
      while (i < body.length && body[i] !== "\n") i++
      buf += "\n"
      continue
    }
    if (ch === ";") {
      if (buf.trim()) out.push(buf.trim())
      buf = ""
      continue
    }
    buf += ch
  }
  if (buf.trim()) out.push(buf.trim())
  return out
}

async function main() {
  const files = fs
    .readdirSync(DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort()

  if (files.length === 0) {
    console.error(`no .sql files in ${path.relative(ROOT, DIR)}`)
    process.exit(1)
  }

  await sql(`create table if not exists schema_migrations (
    name text primary key,
    applied_at timestamptz not null default now()
  )`)

  const { rows } = await sql("select name from schema_migrations order by name")
  const done = new Set(rows.map((r) => r.name))
  const pending = files.filter((f) => !done.has(f))

  if (CHECK) {
    if (pending.length === 0) {
      console.log(`up to date — ${files.length} migration(s) applied`)
      return
    }
    console.error(`pending: ${pending.join(", ")}`)
    process.exit(1)
  }

  if (pending.length === 0) {
    console.log(`up to date — ${files.length} migration(s) applied`)
    return
  }

  for (const name of pending) {
    const body = fs.readFileSync(path.join(DIR, name), "utf8")
    const list = statements(body)
    if (list.length === 0) {
      console.error(`${name} contains no statements`)
      process.exit(1)
    }
    // Ledger row LAST. A failure halfway leaves the earlier statements applied and
    // the file unrecorded — which is exactly what makes the next run retry it, and
    // the `if not exists` in every statement is what makes that retry harmless.
    for (const statement of list) await sql(statement)
    await sql(`insert into schema_migrations (name) values ('${name}')`)
    console.log(`applied ${name} — ${list.length} statement(s)`)
  }
}

main().catch((err) => {
  console.error(err.message)
  process.exit(1)
})
