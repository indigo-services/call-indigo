/**
 * Test runner.
 *
 *   npm test          build, then run every suite
 *   node tests/run.mjs  run the suites against the last build
 *
 * Suites are independent modules exporting `run()`; the runner only orders them
 * and turns the harness's tally into an exit code.
 */
import { finish } from "./harness.mjs"
import { run as auth } from "./auth.mjs"
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

process.exit(finish())
