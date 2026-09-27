# Agent I/O — the contract

**Kind:** living · **Owner:** the repo · **Last verified:** 2026-09-27 at `2f009a2`

This project is worked on by humans **and** agents. The contract below exists so the
handover is mechanical rather than conversational: an agent should be able to pick up
from the files alone, and a human should be able to audit what an agent did without
reading a transcript.

---

## 1. Inputs — what an agent is given

| Input | Where | Required? |
|---|---|---|
| **The task** | The request itself | Yes |
| **The rules** | [`../00-meta/conventions.md`](../00-meta/conventions.md), [`../20-development/standards.md`](../20-development/standards.md) | Yes — read first |
| **The patterns** | [`../20-development/patterns.md`](../20-development/patterns.md) | Yes — ten traps already paid for |
| **The live work** | [`../40-project/tasks.md`](../40-project/tasks.md) | Yes |
| **Prior sessions** | [`devlog/`](./devlog/) | When the task touches existing work |
| **The project memory** | `.workbuddy-ai/memory/` — the thin index, plus `RULES-FULL.md` for detail | When the task touches known traps |

**The memory file is an index, not an answer.** It is deliberately thin (injection
truncates around 7 KB) and carries one line per rule, with the evidence in
`RULES-FULL.md`. An agent that reads only the index knows a rule exists; it does not know
whether it applies.

## 2. Outputs — what an agent must leave

| Output | Path | Mandatory when |
|---|---|---|
| **The change** | `src/**`, `docs/**`, config | The task changed something |
| **The devlog entry** | `docs/50-sessions/devlog/YYYY-MM-DD.md` | The session was substantive |
| **The task state** | `docs/40-project/tasks.md` | Anything finished, or anything found |
| **The changelog entry** | `CHANGELOG.md`, in a **separate commit** | The change is user-visible |
| **The wiki re-sync** | `node scripts/_wiki_sync.cjs` | `docs/` changed |

**A session that produces only the change is incomplete.** See
[`protocol.md` §3](./protocol.md#3-before-you-finish--the-two-mandatory-outputs).

## 3. Artifact paths — the convention

Generated output goes to **`.preview/`** (gitignored). The only exception is a generated
thing that is itself a document, which goes to `docs/` and carries a `derived`
front-matter line. Full reasoning:
[`../40-project/artifacts.md` §6](../40-project/artifacts.md#6-where-new-generated-things-should-go).

| Kind | Path |
|---|---|
| A verification sheet, a crop, a probe output | `.preview/` |
| A generated document a reader needs | `docs/60-reference/` |
| A report the user should see | `.preview/`, then presented |

## 4. The four rules an agent gets wrong most often

| # | Rule | The failure it prevents |
|---|---|---|
| **1** | **Never batch parallel edits to the same file.** | The write races; the last writer wins and every call reports success. Edit sequentially, then re-grep. |
| **2** | **Never `taskkill /PID $!` in Git Bash.** | `$!` is an **MSYS** pid, not a Windows pid — the kill addresses an unrelated process, and with `/T` it kills the calling shell. Sweep the real pid from `netstat -ano`. |
| **3** | **`npm test` can trip a bulk-delete guard** (`vite build` empties `dist/`, ~98 files). | Use `npm run test:only` against the existing build, or `mv dist` aside first. |
| **4** | **`renderToStaticMarkup` sees neither CSS nor effects.** | Every `useApiData` page renders as **skeletons**, so no data-driven admin UI is checkable from the suite. Verify those in a browser. |

## 5. What an agent must not do

| Not | Because |
|---|---|
| **Add a cookie, analytics, or a third-party captcha** | Reverses a recorded client decision — see [`../30-operations/observability.md` §3](../30-operations/observability.md#3-why-there-is-no-analytics) |
| **Raise the lint ceiling to make a build pass** | A gate disabled to unblock is worse than no gate, because the documentation still claims enforcement |
| **Imply the `/admin` gate is access control** | Four on-screen surfaces and a test exist to prevent exactly this |
| **Hand-edit a generated file** | `chrome-markup.ts` is generated; a needle that stops matching fails **silently** |
| **Write a number without its producer** | It cannot expire |
| **Quietly drop a settled decision** | Name the collision instead |
| **Delete `.workbuddy-ai/`** | It is project data, not a cache |

## 6. Handover checklist

Before a session ends, confirm each is true:

- [ ] Every changed claim in the docs was **re-measured**, not assumed.
- [ ] Every new check was **negative-controlled**.
- [ ] The devlog entry exists, **including what was abandoned**.
- [ ] `tasks.md` reflects the new state, including anything found.
- [ ] The four gates pass (`typecheck`, `lint`, `build`, `test`).
- [ ] `docs/` changes → the index is updated, the citations re-pointed, the wiki
      re-synced.
- [ ] The paperwork is **two commits**, and the changelog commit cites the change
      commit's SHA.
