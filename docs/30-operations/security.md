# Security posture

**Kind:** dated · **Owner:** the repo · **Last verified:** 2026-09-27 at `2f009a2`

This document is an **index**, not a copy. The threat model lives in
[`../60-reference/admin-gate.md`](../60-reference/admin-gate.md); the reporting channel
lives in [`../../SECURITY.md`](../../SECURITY.md). This page states the posture and the
gaps in one place, so a reviewer does not have to assemble it.

---

## 1. The posture, in one table

| Surface | State | Evidence |
|---|---|---|
| **`/admin` sign-in** | **Client-side. NOT access control.** | `src/admin/auth.ts`; four in-app surfaces say so; `tests/auth.mjs` fails if any reverts |
| **Credentials in the bundle** | **None.** Password is a salted PBKDF2-HMAC-SHA-256 digest at 210,000 iterations; username is a salted SHA-256 | Grepping the built JS for either finds nothing |
| **The digests in the bundle** | **Present, and offline-crackable.** | This is why the gate is a demo curtain, not a boundary |
| **Session** | `sessionStorage`, 12 hours, dies with the tab, deliberately outside the `call-indigo:v1:` namespace | `src/admin/auth.ts` |
| **Dashboard data** | `localStorage`. Per-browser, not shared, not a database | `src/lib/data/backend.ts` |
| **The contact form** | Writes to the same `localStorage`. **The business never receives it** | `src/lib/data/api.ts` → `createInquiry` |
| **Captcha** | **Local arithmetic.** Not a bot defence | `src/marketing/Captcha.tsx` |
| **Cookies set** | **None** | A client requirement |
| **Analytics / trackers** | **None** | A client requirement |
| **Third-party scripts** | **None at runtime** | No `<script src="https://…">` in the tree |
| **Secrets in the repo** | **None required.** No `.env` is read, no `VITE_*` variable exists | [`environments.md` §4](./environments.md#4-environment-variables) |
| **Dependencies** | Watched by Dependabot | `.github/dependabot.yml` |
| **Deploy gate** | The Vercel **author gate**, not a token | [`deployment.md` §3](./deployment.md#3-the-author-gate) |
| **CI** | Four gates on push to `main` and on every PR | `.github/workflows/ci.yml` |

## 2. The one thing that must never be implied

> **The `/admin` gate is not access control, and nothing in this repository may imply
> that it is.**

There is no server, so there is nowhere for a secret to hide from the browser. **Anyone
who can open devtools can set the session flag by hand.** What the gate buys is that the
dashboard is off the public internet while the client is showing it around.

**Four in-app surfaces state this on screen**, and `tests/auth.mjs` fails if any of them
reverts. The full threat model, rotation procedure and risk register:
[`../60-reference/admin-gate.md`](../60-reference/admin-gate.md).

**A server-issued session is PRD §16.2 F1** and lands before this dashboard is pointed
at anything real.

## 3. Where raw HTML enters the DOM — two seams

**3.1 The marketing chrome.** `src/marketing/chrome.ts` composes the shared chrome out of
`chrome-markup.ts` using string `.replace()` calls, and the three marketing pages inject
their markup with `dangerouslySetInnerHTML`.

**3.2 The documentation mirror.** `src/admin/DocsPage.tsx` renders each document under
`docs/` with `dangerouslySetInnerHTML`, after `marked` converts it from markdown.

**The content is all first-party** — no user input is rendered as HTML. Note the precise
form of that claim, because it is narrower than "no URL reaches the DOM": the mirror reads
`?doc=…` from the query string, and in its not-found branch that value *is* rendered. It is
rendered as an **escaped React text child**, never as HTML, and everywhere else it is only
a **lookup key** into the fixed document set. It cannot reach `dangerouslySetInnerHTML`,
which receives `marked`'s output for a first-party file and nothing else. So there is no XSS
path *today*.

**The risk is that these are the seams where a future change could create one.** If a value
ever reaches `BODY_HTML`, a `.replace()` needle, or the mirror's `__html` from user input or
from a URL, that is an XSS. The suite's `stripComments()` / `stripJsComments()` helpers exist
because the first seam has already produced false results in both directions.

**The mirror is the wider seam**, because its input is a *directory* rather than a fixed
string: any `.md` added under `docs/` is rendered, so a document can introduce markup without
anyone editing a component. Two things bound it:

- **`marked` does not sanitise**, deliberately. The input is first-party and already
  published to the public wiki, so the mirror inherits whatever the documents contain.
- **`tests/docs-mirror.mjs` asserts the whole library renders with no `<script`, no inline
  `on…=` handler, no `javascript:` URL and no `<iframe>`** — negative-controlled by adding a
  document containing a `<script>` tag and confirming the suite fails.

A document that must not be public does not belong under `docs/`: the repository is public
and `docs/` is mirrored to the wiki, so the mirror adds no exposure the wiki does not already
have. That is a property of the *current* content, not a guarantee.

## 4. The gaps, ranked

| # | Gap | Consequence | Tracked as |
|---|---|---|---|
| 1 | **No server-issued session.** The gate is bypassable by design. | The dashboard is not safe to point at real data | PRD §16.2 **F1** |
| 2 | **No backend.** The contact form tells the business nothing, and no submission is authenticated or rate-limited | A visitor's submission is lost to them alone | PRD §16.2 **F2** |
| 3 | **The captcha is local arithmetic.** | It stops no bot | Accepted — the form writes to the visitor's own browser, so there is nothing to spam |
| 4 | **No dependency-vulnerability gate in CI.** Dependabot opens PRs; nothing fails a build on an advisory. | A known-vulnerable dependency can ship | Not yet tracked |
| 5 | **No secret scanning in CI.** | A committed secret is caught by review only | Not yet tracked |
| 6 | **The repository is public.** | The source, including the `localStorage` shape, is readable by anyone | A decision made 2026-09-27, recorded in [`../60-reference/third-party-assets.md`](../60-reference/third-party-assets.md) |

> ⚠️ **Gap 6 is the one with a licensing consequence, not a security one.** The
> repository was made public while it contains template-derived assets. That exposure is
> measured and recorded — see
> [`../60-reference/third-party-assets.md`](../60-reference/third-party-assets.md).

## 5. Reporting a problem

See [`../../SECURITY.md`](../../SECURITY.md). **Do not open a public issue** — the
repository is public, so an issue is a disclosure.

---

**Last verified:** 2026-09-27 at `2f009a2`
