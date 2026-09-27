# 10 — Onboarding: day one to first merged change

**Read this domain in order.** It is deliberately short. Everything here is either a
step you run or a word you need; the depth lives in
[`../20-development/`](../20-development/).

| Document | Answers | Time |
|---|---|---|
| [`README.md`](./README.md) | What this is, what it is not, and how it is built | 5 min |
| [`setup.md`](./setup.md) | Clone → running dev server → all four gates green | 10 min |
| [`glossary.md`](./glossary.md) | The words, including the ones that are local to this repo | 5 min |

---

## The product in one paragraph

**Call Indigo** is a home & facility services company in Austin, TX — plumbing,
electrical, HVAC, carpentry, remodeling. Family owned, locally operated since 2012,
serving Hays, Travis and Williamson counties. This repository is their **marketing
website and an admin dashboard**, built as a React single-page app and deployed to
Vercel at `call-indigo.com`.

## What this is not

Four things a new reader assumes, and should not:

| Assumption | Reality |
|---|---|
| "The dashboard stores data somewhere." | It stores data in **`localStorage`**, behind an async API seam designed to be swapped for a real backend. It is a working demonstration of the workflow, not a shipped backend. |
| "The `/admin` sign-in protects the data." | It is **client-side and it is not access control.** There is no server, so there is nowhere for a secret to hide. It keeps `/admin` off the public internet during a demo. See [`../60-reference/admin-gate.md`](../60-reference/admin-gate.md). |
| "The design was built from scratch." | The marketing pages were **ported from a purchased HTML template** — the static prototype in `valvoro-prototype/` — and re-implemented in React and Tailwind. Some images are byte-identical to the template's. See [`../60-reference/parity.md`](../60-reference/parity.md) and [`../60-reference/third-party-assets.md`](../60-reference/third-party-assets.md). |
| "CI has always run the gates." | CI is **new** (Phase 2). Before it, the suite ran when a human typed `npm test`, while `tests/README.md` claimed it ran in CI. That claim was false and is one of the findings the documentation refactor closed. |

## The four gates

Every change passes four gates. CI runs the same four on every pull request
([`.github/workflows/ci.yml`](../../.github/workflows/ci.yml)).

| Gate | Command | What it proves |
|---|---|---|
| **G1** Type check | `npm run typecheck` | The types hold |
| **G2** Lint | `npm run lint` | The house rules hold, with a **pinned ceiling of 4 warnings** |
| **G3** Build | `npm run build` | It compiles and bundles |
| **G4** Verification | `npm run test:only` | The rendered output is what it should be |

> **The lint ceiling is a floor to tighten, never a budget to spend.** Raising it to
> make a build pass is the exact failure the gate exists to prevent — a gate disabled
> to unblock is worse than no gate, because the documentation still claims
> enforcement.

## Your first change

1. Read [`../20-development/standards.md` §1](../20-development/standards.md#1-evidence-based-development).
   It is one page and it governs everything else.
2. Branch from `main`, one scope per branch.
3. Make the change. **If you touched `src/index.css` or a marketing page, read
   [`../20-development/patterns.md`](../20-development/patterns.md) first** — the
   chrome is duplicated across four pages and a change reaches one of them.
4. Run the four gates.
5. Commit in the repo's shape: the change first, then a separate `docs(changelog)`
   commit citing the first one's SHA.

## Where to go next

| You want to… | Go to |
|---|---|
| Set up and get green | [`setup.md`](./setup.md) |
| Learn the words | [`glossary.md`](./glossary.md) |
| Know the rules | [`../20-development/standards.md`](../20-development/standards.md) |
| Understand the seams | [`../20-development/architecture.md`](../20-development/architecture.md) |
| See every document | [`../README.md`](../README.md) |
