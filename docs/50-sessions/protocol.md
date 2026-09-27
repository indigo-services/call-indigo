# Session protocol

**Kind:** living · **Owner:** the repo · **Asserted by:** `tests/docs.mjs` (the devlog
directory exists and every entry is well-formed)

---

## 1. Before you change anything

| Step | Why |
|---|---|
| **Read [`../00-meta/conventions.md`](../00-meta/conventions.md).** | The evidence rule, the document kinds, and *a number carries its producer* govern everything else. |
| **Read [`../20-development/patterns.md`](../20-development/patterns.md).** | Ten patterns, each of which the repo has already paid for. It is the cheapest 5 minutes in this project. |
| **Measure before you change.** | *Arithmetic is permission to render, never a decision.* A claim measured after the change is not evidence about the change. |
| **Check the working tree.** | `git status`, and confirm you are not about to edit a file another session is holding. |

## 2. While you work

| Rule | Why |
|---|---|
| **Edit one file sequentially.** | Parallel edits to the same file race on the write; the last writer wins and every call reports success. |
| **Negative-control every new check.** | A check that has only ever seen the correct input is a claim, not a guard. |
| **Name a collision; do not route around it.** | If the request conflicts with a decision the repo already made, say so. That is more useful than silently complying or silently refusing. |
| **Record what you abandon, as you abandon it.** | It is unrecoverable later. This is the section of the devlog that earns its place. |

## 3. Before you finish — the two mandatory outputs

### 3.1 A devlog entry

Append to `docs/50-sessions/devlog/YYYY-MM-DD.md`. Use
[`../00-meta/templates/devlog.md`](../00-meta/templates/devlog.md).

**Six sections, and the fourth is the one that matters:**

| Section | Content |
|---|---|
| **What was asked** | The request, in the words it arrived in, plus any clarification that changed it |
| **What was measured** | The evidence, **before** any change. Every number with its command |
| **What changed** | A file → change table |
| **What was tried and abandoned** | **The section that earns the devlog its place.** Each approach, and the measurement or constraint that killed it |
| **What is still open** | Named, with a recommendation, or deferred with a reason |
| **What is next** | The next concrete action, so a future session starts without re-deriving the state |

### 3.2 A task state

Update [`../40-project/tasks.md`](../40-project/tasks.md):

- Move anything finished out of the open list.
- **Add anything you found.** A defect discovered while doing something else is a task,
  not a footnote — `tasks.md` §3 is where the ones this refactor found are recorded.

## 4. If you changed the repository, the paperwork is two commits

1. **The change commit** — `feat(…)`, `fix(…)`, `docs(…)`. **It must not touch
   `CHANGELOG.md`.**
2. **A separate `docs(changelog)` commit** recording it and **citing the first commit's
   SHA.**

Full convention: [`../20-development/standards.md` §3](../20-development/standards.md#3-commit-conventions).

> **Commit messages go in `.git/COMMIT_MSG.txt`** and are committed with `git commit
> -F`. A heredoc mangles `\[` and `${}` in a message. **And if another session may be
> active, write the file and commit it in the *same* call** — the path is shared.

## 5. If you changed `docs/`, three more things

| | |
|---|---|
| **Update the index.** | [`../README.md`](../README.md) — every document appears in it exactly once. `tests/docs.mjs` fails if a document is unlisted. |
| **Re-point the citations.** | A moved file invalidates every link to it. `tests/docs.mjs` checks the links; it does not check a *prose* reference. |
| **Re-sync the wiki.** | `node scripts/_wiki_sync.cjs` — the wiki is derived, so it is stale the moment `docs/` changes. |

## 6. The definition of a session well done

A future reader, with no access to this conversation, can answer:

- **What changed, and why** — from the devlog.
- **What was ruled out, and by what measurement** — from the devlog's fourth section.
- **What state the project is in** — from `tasks.md` and `CHANGELOG.md`.
- **Whether any claim in the docs is now false** — because the changed claims were
  re-measured, not assumed.

If any of those requires opening a chat transcript, the session did not finish.
