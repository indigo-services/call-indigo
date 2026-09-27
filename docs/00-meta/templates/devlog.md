# <YYYY-MM-DD> — <one-line title of the session>

**Kind:** dated · **Commit range:** `<first-sha>`…`<last-sha>` ·
**Agent/session:** <who or what ran it>

---

## What was asked

<The request, in the words it arrived in, plus any clarification that changed it. If
the request was ambiguous and the ambiguity mattered, record how it was resolved and
why.>

## What was measured

<The evidence, before any change. Every number carries its command. If nothing was
measured, say so — a session that changed code without measuring anything is a fact
worth recording.>

```
<command>  →  <result>
```

## What changed

| File | Change |
|---|---|
| `<path>` | <what and why, one line> |

## What was tried and abandoned

> **This is the section that earns the devlog its place.** The `CHANGELOG.md` records
> what shipped; the git log records what was committed. Neither records the approach
> that was built and thrown away, which is the expensive thing to rediscover.

- **<Approach>** — abandoned because <the measurement or constraint that killed it>.

## What is still open

<Named, with a recommendation, or explicitly deferred with a reason.>

## What is next

<The next concrete action, so a future session can start without re-deriving the
state.>
