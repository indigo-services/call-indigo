# Parity (PRD §13)

**Kind:** dated · **Owner:** the repo · **Last verified:** 2026-09-27 at `2f009a2`

PRD §5.1 required the three public routes to be **exact textual duplicates** of the
static prototype, with §13 parity as the acceptance test. **They are not duplicates any
more.** This document records what changed, what still holds, and the one measurement
that is still owed.

---

## 1. What the requirement was

| Requirement | Source | State |
|---|---|---|
| The three public routes are exact textual duplicates | PRD §5.1 | **Superseded** — the copy was de-duplicated, at the client's request |
| Every landmark box within **±1px** at every viewport | PRD §13.2 | **Not re-measured** since the copy changed |
| Page height within **±0.5%** | PRD §13.2 | **Not re-measured** |
| ≤**0.5%** of pixels differing by more than **8/255** per channel | PRD §13.2 | **Not re-measured** |
| Hard zeros: console errors, broken images, dead anchors, horizontal overflow | PRD §13.2 | **Covered headlessly** |

**The two cannot both hold.** A request to remove duplicated and unnecessary copy
contradicts "stay textually identical". The copy was cleaned; §5.1's *behavioural*
requirements — route table, structure, class names, `id`s, the `BODY_HTML` rendering
model — are all intact, and the suite asserts them.

## 2. The baseline, and the copy that is not self-contained

**The baseline is `valvoro-prototype/` at the repo root** — the tracked copy, **87
files**, of which **79 are images**.

> ⚠️ **`archive/v1-prototype/valvoro-prototype/` holds a byte-identical copy of the
> HTML, CSS, JS and ground-truth docs — but `.gitignore` excludes images under
> `archive/**`, so the archived copy is NOT self-contained. Compare against the ROOT
> copy.**

## 3. What the prototype actually supplied

Measured, because the answer is not uniform and the uniform answers are both wrong:

| Layer | Verdict | Evidence |
|---|---|---|
| **Markup** | **Ours** | Template demo has **246** unique classes; the prototype has **488**; only **29 shared** (~12%) |
| **CSS** | **Ours** | The template ships Bootstrap 4 + Owl Carousel. `valvoro-prototype/css/tw.css` is a **generated Tailwind** file — a different stack, re-implemented, not copied |
| **Images** | **The template's** | **59 of 95** files in `public/assets/images/` are **byte-identical** (`cmp -s`) to the template library; 10 share a filename but differ |
| **Template source** | **The template's** | 20 files, 915 KB, tracked verbatim |

**So both of these statements are wrong, in opposite directions:**

- ✗ *"We rewrote it from scratch."* — 59 images are byte-identical, and they are served
  by the live site today.
- ✗ *"We copied the template."* — the markup was rewritten and the CSS was
  re-implemented in a different stack.

**The accurate statement: the design was used as inspiration and the markup and CSS were
re-implemented, while 59 images were carried over verbatim.** The full rights record is
[`third-party-assets.md`](./third-party-assets.md).

## 4. What the suite asserts instead

Because textual parity is no longer the acceptance test, the suite asserts the
properties the copy cleanup was *for*:

- no scaffolding or placeholder language reaches a visitor;
- no doubled words (`Call Call Indigo` was shipping);
- the service-area city list is identical everywhere it is stated;
- no sentence is repeated verbatim within one page;
- the county name stays under a noise ceiling (**8 occurrences per page** — headroom,
  not a target).

Plus the behavioural properties §5.1 was protecting: **links, ids, images, ARIA targets,
and stylesheet coverage.**

Full list: [`../20-development/testing.md` §3](../20-development/testing.md#3-the-copy-hygiene-suite).

## 5. The measurement that is still owed

> **The §13.2 pixel and landmark thresholds have not been re-run since the copy changed,
> and they are the only acceptance test PRD §13 ever specified.**

They need a **real browser** at **1920 / 1440 / 390**. The browser harness lives in
`archive/audit/v1-audit/v2check/` (`verify.py`, `diag.py`, `mincontent.py`, `shots.py`)
and **is still the only code that can measure them.**

### 5.1 Two known risks

1. **The absolutely-positioned boxes.** The hero's `.navy-box`, the
   `.years-experience-con` badge and the `.plumber-img` overlay sit against flow height.
   Removing a licence line from the footer and shortening sentences in the services and
   choose-us bands **changes that flow height**, which can move them.
2. **`/contact` shares the footer.** It uses the shared `SiteChrome` rather than the
   per-page chrome the three mirror pages carry. It is not a prototype mirror and is
   outside §13's scope — **but its footer is shared, so the footer copy edits reach it.**

### 5.2 What this blocks

**PRD §16.2 F10 — retiring `valvoro-prototype/` — is blocked on this.** The prototype
cannot be deleted until parity is re-measured and signed off.

Tracked as [`../40-project/tasks.md` E3](../40-project/tasks.md#3-engineering-tasks--ours-and-unblocked).

## 6. What is *not* verifiable headlessly

| | Why |
|---|---|
| Landmark box positions | Needs a layout engine. `renderToStaticMarkup` produces no layout. |
| Page height | Same. |
| Pixel differences | Same. |
| The scroll-reveal animation | `IntersectionObserver` never fires headlessly; 60 elements are gated behind `.reveal` (35 home, 16 residential, 9 commercial) |

> **A headless preview is not a browser.** Before reporting a reveal-gated element as
> broken, check the cascade directly — suppress the transition, add the state class,
> force a reflow, read the computed value. If it reaches the expected value, the
> animation clock is the problem, not the code. See
> [`../20-development/standards.md` §5](../20-development/standards.md#5-testing--verification).

---

**Last verified:** 2026-09-27 at `2f009a2`
