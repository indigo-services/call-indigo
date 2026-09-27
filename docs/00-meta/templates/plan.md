# <Title> — plan and evidence, <YYYY-MM-DD>

**Kind:** dated · **Status:** proposed | in progress | done | abandoned ·
**Release:** <version or "continuous"> · **Scope:** <what this touches>

<One paragraph: what problem this plan solves, and why now.>

**The instrument is the tree itself.** Every number below was read out of the
workspace on <YYYY-MM-DD> at `<sha>`, with the command or path given.

---

## 0. Evidence rule

- **[M]** — measured, read out of this workspace, path or command given.
- **[P]** — proposed by this document, no prior existence in the repo, carries an open
  question in the last section.

Where the repo and this document disagree, **the repo wins and this document is the
bug.**

---

## 1. What exists today — measured inventory

<Tables with [M: command] against every row. No adjectives — counts and paths.>

## 2. What is wrong — the findings

<One finding per defect. Each one: what a document claims, what the tree says, the
evidence for the contradiction, and the severity. Order by how badly it misleads a
reader who trusts it.>

### F1 — <the claim, in one line> **[High | Medium | Low]**

<The quoted claim, with `file:line`. Then the measurement that contradicts it.>

## 3. The target

<What it looks like when this is done. A tree, a table, or a diagram — concrete
enough that someone else could build it without asking.>

## 4. Patterns and protocols

<Only if the plan introduces a convention rather than a change. Name each pattern,
state the failure it prevents, and say where the failure has already occurred.>

## 5. Risks

| # | Risk | Impact | Mitigation |
|---|---|---|---|

## 6. Phases

<If the plan is more than one session. Each phase: title, release, what lands, and
what it deliberately does not do. Dates are [P] and relative — this repo's cadence is
measured in sessions, not sprints, and a fabricated calendar would be the first
dishonest number in the plan.>

## 7. What was verified for this plan, and what was not

**Verified** [M]: <bullets, each with the command>

**Not verified:** <bullets. Say why each one was not checked, and what would check
it. This section is the difference between a plan and a guess.>

## 8. Open questions

<Each one carries a recommendation, per this repo's convention. A question without a
recommendation is a decision being deferred onto the reader.>

**Q1 — <question>**

<The trade-off in two sentences.>

*Recommendation: <what to do, and what would change the answer.>*

## 9. Definition of done

- [ ] <Each item demonstrable, not aspirational. "A scan returns zero hits", not "the
      docs are accurate".>

## Appendix A — Evidence index

| Claim | Source |
|---|---|
