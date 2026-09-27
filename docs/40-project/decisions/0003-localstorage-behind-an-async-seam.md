# ADR 0003 — `localStorage` behind an async API seam

**Kind:** dated · **Status:** accepted · **Date:** 2026-09-27 (formalised; the seam
shipped earlier) · **Last verified:** 2026-09-27 at `2f009a2` · **Deciders:** the repo

---

## Context

The dashboard needed to *do* something — save settings, list inquiries, move one through
a status pipeline — before there was any backend to do it with. PRD §9.1 said rc1 has
**no persistence**; the build went further and the client approved it
([`../../60-reference/dashboard-scope.md`](../../60-reference/dashboard-scope.md)).

The real question was never *"how do we store a settings object"*. It was: **how do we
build a working dashboard now without writing code that has to be thrown away when the
backend arrives?** PRD §16.2 **F2** is that backend, and it is the roadmap's critical
path.

## Decision

**Every page reads and writes through `src/lib/data/api.ts`, which is `async` even
though the local backend is synchronous. `backend.ts` is the only file that knows where
data physically lives.**

```
pages  →  api.ts  →  backend.ts  →  localStorage
            ↑
   the only seam; async on purpose
```

| File | Owns |
|---|---|
| `types.ts` | Domain types, storage-agnostic |
| `seed.ts` | First-run fixtures |
| `backend.ts` | **The only file that knows it is `localStorage`.** Synchronous and dumb on purpose |
| `api.ts` | **The seam.** Every method `async`, with 140 ms simulated latency |
| `hooks.ts` | `useApiData` — the single read path |

**Mutations bump a version counter** that `useApiData` subscribes to via
`useSyncExternalStore`.

## Consequences

**What this buys**

- **Replacing `localStorage` with `fetch` is a change to `api.ts` alone.** Every call
  site is already written for the world where this returns a network promise.
- **The loading and in-flight states are exercised.** The 140 ms latency exists so a
  reviewer actually sees them; a UI that only ever renders its loaded state is a UI whose
  loading state is untested.
- **Cross-page reactivity without a store.** Submitting on `/contact` repaints the
  dashboard inbox without either page knowing the other exists — one integer and a
  `Set` of listeners, no context, no prop drilling, no Redux.
- **`useApiData(key, load)` takes an explicit `key`** rather than a dependency array,
  which keeps the effect lint-checkable.

**What this costs**

- **`localStorage` is not a database.** Data is per-browser, is not shared between users
  or devices, and is cleared with site data. **The contact form tells the business
  nothing** — see [`../../30-operations/observability.md` §2](../../30-operations/observability.md#2-what-we-cannot-see).
- **A write can fail silently by design.** Corrupt JSON and a full quota both fall back
  rather than taking the page down.
- **`async` everywhere is ceremony today.** It reads as over-engineering until F2 lands,
  at which point it is the reason F2 is small.

**What it forecloses**

- **Server-side rendering of dashboard data.** There is no server, and the read path is
  a promise resolved in an effect.
- **Reading the data layer from anywhere but a page.** No page may import `backend.ts`.

## Alternatives rejected

| Alternative | Why not |
|---|---|
| **React state + prop drilling** | The `/contact` → inbox reactivity is the requirement that kills it. Two routes, no shared ancestor below the router. |
| **A global store (Redux, Zustand)** | A dependency for one integer and a listener `Set`. The seam is smaller and does the same job. |
| **Read `localStorage` synchronously in each page** | It puts the storage decision in every page, which is exactly what F2 has to undo. |
| **Build the real backend first** | It is the largest item in the project, and it depends on F1 (a server-issued session). Shipping nothing until then was the alternative, and the client asked for a working dashboard. |
| **An in-memory store with no persistence** | Loses the data on every reload, which makes the dashboard a slideshow. The point was to demonstrate a *workflow*. |

## Reversibility

**Moderate — and that is the decision's whole purpose.** The seam exists to make F2 a
one-file change. What is *not* cheap is the **data that has already been written** into
visitors' browsers: it is unreachable, unshared, and gone with site data. A real backend
starts empty, and no migration is possible.

That is acceptable here because there is nothing worth migrating — but it is worth
saying plainly, because it will not be true after the first real inquiry.
