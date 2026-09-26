# Tests

Verification for the rc1 build. Zero new dependencies — the loader uses the
`esbuild` that already ships inside `vite`, so nothing here needs installing.

```bash
npm test          # build, then run every suite
npm run test:only # run the suites against the last build
```

`npm test` exits non-zero on the first failing check, so it works as a gate.

---

## What runs

| Module | Suite | What it proves |
|---|---|---|
| `harness.mjs` | — | Assertions, the report, the TS loader, and the HTML helpers |
| `policy.mjs` | Component policy (PRD §7) | The registry rules hold in the source tree |
| | Routing (PRD §5) | The sidebar, the router, the "no catch-all" rule and the **auth boundary** all agree |
| | Stack (PRD §4, §14) | Tailwind v4 is wired as specified and the tokens live in one file |
| `service-area.mjs` | Service area (ZIP check) | The ZIP decision has boundaries |
| `hero-rotation.mjs` | Hero rotation | The rotating word and the arch photograph cannot drift apart |
| `verify.mjs` | Rendered markup | Each public route renders, and its links, ids, images and form hold up |
| | Stylesheet coverage | Every class in the markup is actually emitted by the compiled CSS |
| | Copy hygiene | No scaffolding language, no doubled words, no contradictory facts, and the shared-chrome seams still applied |
| | Punch list (v1.0.1) | The client-confirmed changes cannot silently regress |
| | Hero Emergency card and About row | The derived disc protrusion, the photo swap, and the badge's two-part centring |
| | Brand lockup | All four copies of the chrome carry the client's icon + wordmark, and the favicons match |
| | Legal copy matches the build | The policy describes *this* build — coupled to the code in both directions |
| | Credentials, not placeholder brands | The band is real, and it is the only one |
| | Service heroes and page primaries | Each service page scopes its own scrim, and the header agrees |
| | CTA bands carry the client's mark | No floating badge, one phone glyph everywhere |
| | Theme tokens are authorable | The picker's defaults, validation and contrast bars |
| `auth.mjs` | Dashboard gate | The KDF cost, the digest encodings, the guard's placement, and that no page still claims there is no sign-in |
| `run.mjs` | — | Entry point; orders the suites and turns the tally into an exit code |

**Check counts are deliberately not listed here.** They grow with every round, and
the copy of this file that read "67 checks" was wrong within a day of being written.
The run prints the authoritative total — read it from there, never from a document.
(A suite that returns `[]` for everything also "passes", which is why the runner
prints the count rather than just the failures.)

---

## How it works

The prototype's `verify.py` drove a browser. This does not — `react-dom/server`
renders each route to static HTML and the assertions run against that output.
Two consequences worth knowing:

- It runs in CI, and it cannot be skipped for being inconvenient.
- It cannot see layout. See *What this does not cover* below.

`harness.mjs` bundles each page module to ESM in `tests/.tmp/` (gitignored) and
imports it. `react`, `react-dom` and `react-dom/server` are marked `external` so
the rendered tree and the renderer share one React instance — bundling a second
copy produces "Invalid hook call", which reads as a test failure and is not one.

Assertions run on **rendered output**, not on source text. That is the difference
between "the file contains an anchor" and "the component renders an anchor", and
it is why the inert `Learn more →` spans were catchable at all.

### Four traps the helpers exist to avoid

Each of these produced a real false result before it was handled:

| Trap | Symptom | Fix |
|---|---|---|
| Scanning comments | 3 phantom dead `#terms` anchors, matched from inside comments that *document* those anchors. **The same trap has since produced four more false results**: a CSS rule matched inside a comment, `localStorage` matched in a doc block explaining why the session is deliberately *not* in `localStorage`, and `/admin/login` matched in two comments explaining why no such route exists | Comments are stripped before every scan — `stripComments()` for HTML, `stripJsComments()` for TypeScript and CSS |
| Unanchored attribute match | `aria-invalid="false"` read as `id="false"` — 6 phantom duplicate ids on `/contact` | `attr()` uses a `(?<![\w-])` lookbehind |
| Lazy element match | `element()` stopped at the first nested `</div>`, hiding everything inside the legal dialogs | Depth-aware tag scanner |
| Nested `<footer>` | `<footer>` is legal inside `<blockquote>`, and the home page uses it under each testimonial. Greedy matching ran from a testimonial to the end of the document; lazy stopped at that testimonial. Both read as "the footers differ between pages" when they are identical | `siteFooter()` takes the **last** `<footer>` |

### Two traps that belong to the source, not the assertions

- **A string-replace injection seam fails silently.** `chrome.ts` composes the
  shared chrome out of `chrome-markup.ts` with `.replace()` calls. A needle that
  stops matching changes nothing and raises nothing — the page just renders the
  prototype's copy again. `check("the shared-chrome copy corrections reach the
  rendered footer")` asserts the *output*, and was negative-controlled against the
  raw slice, where all three removed strings are still present.
- **The shared chrome is not shared by every page.** `/contact` renders
  `SiteChrome` from `chrome.ts`; the three mirror pages carry their own inline
  copy of the same markup. A change made only in the seam reaches one page of
  four — which is exactly what happened, and what the ribbon and phone checks now
  catch.

---

## The copy-hygiene suite

These checks are not in the PRD. They exist because this build changed the
marketing copy, and **PRD §5.1 asks for the opposite**:

> ### 5.1 Public routes — must be exact duplicates

The three public routes were ported from `valvoro-prototype/*.html` and were
required to stay textually identical, with §13 parity as the acceptance test. The
request that produced this pass was to remove duplicated and unnecessary copy, so
the two cannot both hold. The copy was cleaned; §5.1's *behavioural* requirements
— route table, structure, class names, `id`s, the `BODY_HTML` rendering model —
are all intact. See `CHANGELOG.md` for the decision record.

Because parity can no longer be the acceptance test for copy, the suite asserts
the properties the cleanup was *for*:

- no scaffolding or placeholder language reaches a visitor;
- no doubled words (`Call Call Indigo` was shipping);
- the service-area city list is identical everywhere it is stated;
- no sentence is repeated verbatim within one page;
- the county name stays under a noise ceiling.

The ceiling is deliberate, not an accident of what currently passes. Global
chrome, the About band, the FAQ answer and the two legal documents each state
"Hays, Travis, and Williamson counties" legitimately; the check fails above 8
occurrences per page, which is headroom rather than a target.

---

## What this does not cover

**Layout parity (PRD §13.2).** Thresholds, unchanged:

- every landmark box within **±1px** at every viewport;
- page height within **±0.5%**;
- no more than **0.5%** of pixels differing by more than **8/255** per channel;
- hard zeros: console errors, broken images, dead anchors, horizontal overflow.

Broken images and dead anchors are covered here, headlessly. The **pixel and
landmark thresholds are not** — they need a real browser at 1920 / 1440 / 390 and
have not been re-run since the copy changed. Two known risks:

- The hero's `.navy-box`, the `.years-experience-con` badge and the `.plumber-img`
  overlay are absolutely positioned. Removing a licence line from the footer and
  shortening sentences in the services and choose-us bands changes flow height,
  which can move those boxes.
- `/contact` uses the shared `SiteChrome` rather than the per-page chrome the
  three mirror pages carry. It is not a prototype mirror and is outside §13's
  scope, but its footer is shared, so the footer copy edits reach it.

Re-running §13.2 before sign-off is the outstanding item. `F10` in PRD §16.2
(retire `valvoro-prototype/` once parity is signed off) is blocked on it.

**The scroll-reveal animation.** `IntersectionObserver` does not fire in this
harness. The CSS cascade and the observer port were both verified by reading
them, but the animation needs a real tab.

---

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

Register it in `run.mjs` with `await thing()`. A check returns an array of
problem strings — so one check can report every failure it finds rather than
stopping at the first, which is what makes the output usable when something
breaks broadly.
