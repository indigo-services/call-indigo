#!/usr/bin/env node
"use strict"
/**
 * Regenerate the `/admin` gate credential.
 *
 * Prints the four constants to paste into `src/admin/auth.ts`. The password is
 * never written anywhere and never echoed back — it goes in, four hashes come
 * out, and the terminal's scrollback is the only record.
 *
 * Usage:
 *   ADMIN_USER='someone' ADMIN_PASS='a-good-password' node scripts/_gen-admin-credential.cjs
 *
 * WHY ENVIRONMENT VARIABLES AND NOT ARGUMENTS. `node script.cjs user pass` puts
 * the password in your shell history and in the process list, where any other
 * user on the machine can read it while the command runs. The env prefix has the
 * same problem in some shells, but it is not written to a history file by
 * default and it is the smaller of the two exposures.
 *
 * The KDF here MUST match `src/admin/auth.ts` exactly — same algorithm, same
 * iteration count, same salt encoding — or every sign-in will fail. The suite
 * pins the iteration count and proves the two PBKDF2 implementations agree, so a
 * mismatch shows up as a failing test rather than as a login that mysteriously
 * never works.
 */
const crypto = require("crypto")

const ITERATIONS = 210_000
const MIN_PASSWORD_LENGTH = 12

const user = process.env.ADMIN_USER || ""
const pass = process.env.ADMIN_PASS || ""

if (!user || !pass) {
  console.error("usage: ADMIN_USER='…' ADMIN_PASS='…' node scripts/_gen-admin-credential.cjs")
  process.exit(2)
}

if (pass.length < MIN_PASSWORD_LENGTH) {
  console.error(
    `refusing: the password is ${pass.length} characters. With no server, the hash in the bundle is ` +
      `the only thing standing between a reader and the dashboard, so it has to survive an offline ` +
      `dictionary attack — ${MIN_PASSWORD_LENGTH}+ characters, and not a phrase anyone would guess.`,
  )
  process.exit(1)
}

const userSalt = crypto.randomBytes(16)
const passSalt = crypto.randomBytes(16)

const userHash = crypto
  .createHash("sha256")
  .update(Buffer.concat([userSalt, Buffer.from(user, "utf8")]))
  .digest("hex")

const passHash = crypto
  .pbkdf2Sync(Buffer.from(pass, "utf8"), passSalt, ITERATIONS, 32, "sha256")
  .toString("base64")

console.log("\nPaste these over the four constants in src/admin/auth.ts:\n")
console.log(`export const USERNAME_SALT_HEX = "${userSalt.toString("hex")}"`)
console.log(`export const USERNAME_HASH_HEX = "${userHash}"`)
console.log(`export const PASSWORD_SALT_B64 = "${passSalt.toString("base64")}"`)
console.log(`export const PASSWORD_HASH_B64 = "${passHash}"`)
console.log(
  `\nLeave PBKDF2_ITERATIONS at ${ITERATIONS} unless you are also changing it in auth.ts —\n` +
    "the two must agree, and `tests/auth.mjs` fails if they do not.\n" +
    "\nThen: npm test, and verify the sign-in in a browser with\n" +
    "  ADMIN_USER='…' ADMIN_PASS='…' scripts/_devshot.sh --run scripts/_probe_admin_gate.cjs\n",
)
