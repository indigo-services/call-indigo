/**
 * Test runner.
 *
 *   npm test          build, then run every suite
 *   node tests/run.mjs  run the suites against the last build
 *
 * Suites are independent modules exporting `run()`; the runner only orders them
 * and turns the harness's tally into an exit code.
 */
import { readFileSync } from "node:fs"
import path from "node:path"
import { ROOT, check, finish, suite, tally } from "./harness.mjs"
import { run as auth } from "./auth.mjs"
import { run as docs } from "./docs.mjs"
import { run as docsMirror } from "./docs-mirror.mjs"
import { run as heroRotation } from "./hero-rotation.mjs"
import { run as policy } from "./policy.mjs"
import { run as serviceArea } from "./service-area.mjs"
import { run as verify } from "./verify.mjs"

process.stdout.write("\nCall Indigo \u2014 verification suite\n")

await policy()
await serviceArea()
await heroRotation()
await verify()
await auth()
await docs()
await docsMirror()

/* ── The front door's number, checked against the run that just happened ───── */

// LAST, and structurally last rather than merely placed last. This is the only
// check in the suite that needs the FINAL tally, so it cannot live inside a suite:
// a suite cannot see the checks that have not run yet, and one written mid-file
// would silently start comparing a document against a PARTIAL total the moment
// somebody appended a check below it.
//
// Why it exists. README.md stated "127 checks passed" beside its own producer,
// `npm run test:only`, for the whole of a milestone that took the suite to 139. It
// passed `tests/docs.mjs` check 8, which fires only when a count has NO producer —
// so a number that named its producer was trusted and never compared. That is the
// fifth instance of this repo's one recurring defect: an assertion that cannot see
// the thing it claims to check passes forever.
suite("Repository front door (README.md)", "README.md")

check("the README's stated check count matches the run that just happened", () => {
  const readme = readFileSync(path.join(ROOT, "README.md"), "utf8")
  const m = /\*\*(\d+)\s+checks passed\*\*/.exec(readme)
  if (!m) {
    return ["README.md no longer states a check count — if that is deliberate, delete this check"]
  }
  const claimed = Number(m[1])
  const actual = tally() // includes this check: the harness counts before it calls us
  if (claimed !== actual) {
    return [
      `README.md claims ${claimed} checks; this run registered ${actual}`,
      "  the README's status block is machine-checked — update it in the same commit as the check",
    ]
  }
  return []
})

process.exit(finish())
