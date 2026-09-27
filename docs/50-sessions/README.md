# 50 — Sessions: the human/agent I/O protocol

**Kind:** index · **Owner:** the repo

This domain exists because **the expensive thing to rediscover is what was tried and
abandoned.**

`CHANGELOG.md` records what shipped. The git log records what was committed. **Neither
records the approach that was built and thrown away** — and that is the part a future
session pays for twice.

| Document | Kind | Answers |
|---|---|---|
| [`protocol.md`](./protocol.md) | living | How a session starts, and **what it must leave behind** |
| [`agent-io.md`](./agent-io.md) | living | The contract: inputs, outputs, artifact paths |
| [`devlog/`](./devlog/) | dated | One entry per substantive session |

---

## The rule

> **A session that changes the repository leaves two things: a devlog entry, and an
> updated task state.**

Not a summary, not a chat transcript — a file. The reasons are in
[`protocol.md`](./protocol.md); the short version is that a session's context is the
most perishable thing in this project, and the devlog is the only artifact that survives
it.

## What this is not

| Not this | Because |
|---|---|
| **A chat transcript** | It contains the reasoning *and* forty dead ends, with no way to tell them apart. A devlog names which was which. |
| **A replacement for `CHANGELOG.md`** | The changelog is client-facing and describes shipped behaviour. The devlog is internal and describes the *process*, including what did not ship. |
| **A replacement for the git log** | The git log records commits. A devlog records the work that produced no commit. |
| **`overview.md`** | A session artifact at the repo root, gitignored, regenerated each session, **stale the moment it is written**. The devlog is the durable version. See [`../40-project/artifacts.md` §5](../40-project/artifacts.md#5-session-state). |

## The devlog, at a glance

```
docs/50-sessions/devlog/
  2026-09-27.md     ← the documentation milestone
  YYYY-MM-DD.md     ← one per substantive session, appended to if the day repeats
```

**One file per day**, appended to if a second session happens that day. Not one file per
session — a day's work is one narrative, and splitting it makes the *abandoned* parts
harder to find, which is the opposite of the point.
