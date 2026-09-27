# ADR <NNNN> — <the decision, as a sentence>

**Kind:** dated · **Status:** proposed | accepted | superseded by ADR <NNNN> ·
**Date:** <YYYY-MM-DD> · **Deciders:** <who>

> An ADR records a decision that is **expensive to reverse**. If reversing it is a
> one-line change, it does not need an ADR — it needs a code comment.

---

## Context

<What forced a decision. The constraints that are not negotiable: the client's
requirements, the stack, the absence of a server, a deadline. Be specific about which
constraints are real and which are inherited habit.>

## Decision

**<The decision, in one sentence, in the active voice.>**

<Then the detail: what this means in practice, and what it looks like in the tree.>

## Consequences

**What this buys**

- <…>

**What this costs**

- <Every decision costs something. An ADR with no costs is an advertisement, not a
  record.>

**What it forecloses**

- <The doors this closes. This is the part that makes it an ADR.>

## Alternatives rejected

| Alternative | Why not |
|---|---|
| <…> | <The real reason. "Too complex" is not a reason; "it would require a server, and the client's requirement rules out a server" is.> |

## Reversibility

**How hard is this to undo?** <Cheap | Moderate | Expensive>

<What reversing it would require, concretely. If the answer is "a rewrite", say so —
that is what makes the decision worth recording.>
