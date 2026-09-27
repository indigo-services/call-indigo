# 20 — Development: how to build here

The rules, the seams, and the traps. This domain is where a contributor spends their
time.

| Document | Kind | Answers |
|---|---|---|
| [`standards.md`](./standards.md) | living | **The rules.** Evidence, branches, commits, PR flow, gates, component policy, file layout, release process, pitfalls |
| [`architecture.md`](./architecture.md) | living | The four seams: routing, the data layer, the chrome, the auth gate — and why each exists |
| [`patterns.md`](./patterns.md) | living | The house patterns, and the anti-pattern each one kills |
| [`testing.md`](./testing.md) | living | How the verification suite works, and **what it cannot see** |
| [`design-tokens.md`](./design-tokens.md) | living | `src/index.css` in full: the palette, the scrims, the per-page primaries, the contrast bars |
| [`css-pipeline.md`](./css-pipeline.md) | living | Tailwind v4, the preflight drift, and why a parity failure is usually 1–2px |

---

## Read in this order

1. **[`../10-onboarding/`](../10-onboarding/)** if you are new.
2. **[`standards.md` §1](./standards.md#1-evidence-based-development)** — one page, and it governs everything else.
3. **[`architecture.md`](./architecture.md)** — the four seams. Most mistakes here are a change that reaches *past* a seam.
4. **[`patterns.md`](./patterns.md)** — the traps, before you touch `src/index.css` or a marketing page.

## The three things that break most often

| | |
|---|---|
| **The chrome is not shared.** | The top bar, header, drawer, footer and legal modals are duplicated inside all three marketing pages' `BODY_HTML` strings. A change in `chrome.ts` reaches **one page of four**. |
| **Two layers can describe one behaviour and contradict each other — and the CSS wins.** | The hero's Emergency card carried `max-md:static` while `index.css` hid `.navy-box` below 991px, so it never showed on a phone — and the changelog said it did. **Grep both layers before believing either.** |
| **The suite is green on things that are visibly broken.** | `renderToStaticMarkup` sees neither CSS nor effects, and every `useApiData` page renders as **skeletons**. No data-driven admin UI is checkable from the suite. See [`testing.md`](./testing.md). |

## The four gates

`npm run typecheck` · `npm run lint` · `npm run build` · `npm run test:only`

CI runs the same four on every pull request. See
[`standards.md` §4](./standards.md#4-pr-flow) for the gate table and
[`../10-onboarding/setup.md`](../10-onboarding/setup.md) for the commands.
