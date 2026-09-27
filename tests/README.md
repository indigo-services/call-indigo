# Tests

**This directory is the source of truth for the *code*.**
**[`docs/20-development/testing.md`](../docs/20-development/testing.md) is the source of
truth for the *documentation* of it** — the module list, how the harness works, the
traps each helper exists to avoid, and **what the suite cannot see**.

One copy, so there is one thing to be wrong.

```bash
npm test          # build, then run every suite
npm run test:only # run the suites against the LAST build — does not rebuild
```

`npm test` exits non-zero on the first failing check, so it works as a gate. CI runs
`npm run build` then `npm run test:only` (see `.github/workflows/ci.yml`).

## The four things to know before you trust a green run

| | |
|---|---|
| **The check count is not written down anywhere.** | It grows with every round. The run prints the authoritative total; read it from there. A copy of the docs that read "67 checks" was wrong within a day and stayed wrong for 60 checks. |
| **A suite returning `[]` for everything also "passes".** | Assert an exact count, and pair a negative check with a positive one. |
| **`render` must be awaited OUTSIDE a `check` callback.** | `check` is synchronous and reads a returned Promise as "no problems" — so an async assertion reports green while asserting nothing. |
| **`renderToStaticMarkup` sees neither CSS nor effects.** | Every `useApiData` page renders as **skeletons**, so no data-driven admin UI is checkable here. Verify those in a browser. |

**Before you trust a new check, negative-control it** — run it against a fixture
containing the defect and confirm it fails. A check that has only ever seen the correct
input is a claim, not a guard.

## Adding a suite

```js
// tests/thing.mjs
import { check, load, suite } from "./harness.mjs"

export async function run() {
  const mod = await load("src/path/to/module.ts", "module-name")

  suite("Thing (PRD §n)", "src/path/to/module.ts")

  check("what it proves, in one sentence", () => {
    const out = []
    if (mod.something() !== expected) out.push("what went wrong, with the value")
    return out // empty array = pass
  })
}
```

Register it in `run.mjs` with `await thing()`.

Full guidance: [`docs/20-development/testing.md` §5](../docs/20-development/testing.md#5-adding-a-suite).
