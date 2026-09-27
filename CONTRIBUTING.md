# Contributing

**This file points; it does not restate.** The working conventions live in
[`docs/20-development/standards.md`](./docs/20-development/standards.md) — one copy, so
there is one thing to be wrong.

---

## Start here

| | |
|---|---|
| **New to the repo** | [`docs/10-onboarding/README.md`](./docs/10-onboarding/README.md) — ten-minute orientation |
| **Setting up** | [`docs/10-onboarding/setup.md`](./docs/10-onboarding/setup.md) |
| **The rules** | [`docs/20-development/standards.md`](./docs/20-development/standards.md) |
| **Every document** | [`docs/README.md`](./docs/README.md) — the index, also rendered as a [wiki](https://github.com/indigo-services/call-indigo/wiki) |

---

## The short version

1. **Read the evidence rule.** Every claim in a document must be checkable, and where
   the repo and a document disagree, **the repo wins and the document is the bug**.
2. **Branch from `main`**, one scope per branch.
3. **Run the gates before opening a PR**: `typecheck`, `lint`, `build`, `test`. CI runs
   the same four and will block the merge.
4. **Commit in the repo's shape** — the change first, then a separate
   `docs(changelog)` commit citing the first one's SHA.
5. **Leave the repo more honest than you found it.** If you find a document asserting
   something the tree contradicts, fix it or file it.

---

## The four things most likely to trip you up

| | |
|---|---|
| **A number in a document carries the command that produced it.** | *"127 checks — `npm run test:only`"*, never a bare `127`. Two documents here stated `67` for 60 checks' worth of releases because the number had no producer. |
| **A guard that cannot see its target passes forever.** | This has happened three times. Any check you add must be **negative-controlled** — run it against a fixture containing the defect and confirm it fails. |
| **The chrome is not shared.** | The three marketing pages carry their own copy of the top bar, header, drawer, footer and legal modals. A change in `chrome.ts` reaches **one page of four**. |
| **Never batch parallel edits to one file.** | They race on the write; the last writer wins and every call reports success. |

---

## What we will not merge

- A file under `src/components/ui/` that was not produced by the shadcn CLI (PRD §7).
- A `src/admin/**` file importing from `src/marketing/**`, or the reverse (PRD §7.4.2).
- A page importing `@/lib/data/backend` directly instead of going through
  `@/lib/data/api` (PRD §16.2 F2).
- A raise to the lint ceiling in `.github/workflows/ci.yml` to make a build pass.
- A document that states a number nobody measured.
- Anything that adds a cookie, analytics, or a third-party captcha — the client's
  requirements rule these out.

---

## Licensing

By contributing you confirm you have the right to do so, and you assign copyright in
your contribution to the project owner. See [`LICENSE`](./LICENSE) and
[`THIRD-PARTY-NOTICES.md`](./THIRD-PARTY-NOTICES.md).

**Do not commit third-party assets** — templates, stock imagery, fonts — without
recording them in `THIRD-PARTY-NOTICES.md` first. The repository is public, and an
unregistered asset is an unlicensed redistribution.
