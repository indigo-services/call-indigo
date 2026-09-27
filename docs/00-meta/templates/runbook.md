# Runbook — <the situation>

**Kind:** dated · **Trigger:** <what tells you to open this page> ·
**Time to resolve:** <target> · **Last verified:** <YYYY-MM-DD at <sha>>

> A runbook is written for a person under pressure. Short sentences, exact commands,
> no explanation of *why* unless the why changes what they type. The explanation
> belongs in the reference document this links to.

---

## 1. Trigger

<How you know this is happening. The exact symptom, and how it differs from the
symptoms that look similar but need a different runbook.>

## 2. Preconditions

<What must be true before you start. Access you need, and where to get it. If a step
requires a credential or a role the reader may not have, say so here, not in the
middle of the steps.>

## 3. Diagnose

```bash
# <What this tells you>
<command>
```

**Read the result like this:** <the two or three outcomes and what each one means.>

## 4. Resolve

```bash
# <Step 1 — what it does>
<command>
```

**Verify step 1 worked before continuing:** <the check>

```bash
# <Step 2>
<command>
```

## 5. Verify

<How you know it is fixed, from the outside. Not "the command succeeded" — the
observable that a user would notice.>

## 6. Roll back

<If the resolution makes it worse. The exact commands, and the point of no return
after which rollback is not available.>

## 7. Tell people

<Who needs to know, and what to tell them. Include the client-facing wording if there
is one — a runbook that leaves the message to improvisation gets improvised badly.>

## 8. After

<What to record, and where. A runbook that is not updated after its first real use is
a runbook that will be wrong the second time.>
