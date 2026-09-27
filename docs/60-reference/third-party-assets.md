# Third-party assets and rights

**What this repository carries that belongs to someone else, how it got here, what is
open, and what must never be committed.**

Public attribution register: [`THIRD-PARTY-NOTICES.md`](../../THIRD-PARTY-NOTICES.md) at
the repo root. This document is the working record behind it — the measurements, the
decisions, and the licence evidence.

| | |
|---|---|
| **Kind** | **dated** |
| **Last verified** | 2026-09-27 at `2f009a2` |
| **Why it exists** | The repository became **public** on 2026-09-27, exposing third-party material that had been private |

---

## 1. Why this is urgent now, and was not before

While the repository was private, the template's files were visible only to people with
access to a client repository. **A public repository redistributes them to anyone.**

The distinction that governs everything below:

| | |
|---|---|
| **Use** | The client's website renders the template's design and images. A ThemeForest licence covers this — it is what the licence is for. |
| **Redistribution** | The template's source files and asset library are downloadable from a public repository. The licence does **not** cover this. |

The website is *use*. The repository is *redistribution*. They are not the same act, and
the second is the one that changed on 2026-09-27.

---

## 2. The measured inventory

Every number is `[M]` — read from the tree on 2026-09-27.

### 2.1 The template

**Valvoro — Plumbing Services HTML Template**, ThemeForest item **62644376**
[M: `https://themeforest.net/item/valvoro-plumbing-services-html-template/62644376`,
read from `archive/reference-sites/valvoro-template-preview.html`].

| Location | Files | Notes |
|---|---:|---|
| `archive/audit/v1-audit/vlv/` | **20** | The template's own demo: `<title>Valvoro — plumbing HTML Template \| Live Demo</title>` + `style.css`, `responsive.css`, `carousel.js`, `counter.js`, `video-section.js`, and bundled Bootstrap 4.6.2 / jQuery 3.7.1 / Owl Carousel 2.3.4 / Popper / animate.css / WOW.js |
| `valvoro-prototype/` | **87** | The v2 static prototype (the PRD §13 parity baseline); 79 of the 87 are images |
| `public/assets/images/` | **59** | Images byte-identical to the template library, **served by the live site today** |
| **Template-derived tracked files** | **119** | |

### 2.2 What is ours and what is not

The distinction matters, because the answer is not uniform:

| Layer | Verdict | Evidence |
|---|---|---|
| **Markup** | **Ours** | Template demo has **246** unique classes; the prototype has **488**; only **29 shared** (~12%) |
| **CSS** | **Ours** | The template ships Bootstrap 4 + Owl Carousel. `valvoro-prototype/css/tw.css` is a **generated Tailwind** file (48 KB) — a different stack, re-implemented, not copied |
| **Images** | **The template's** | **59 of 95** files in `public/assets/images/` are **byte-identical** (`cmp -s`) to the template library; 10 share a filename but differ (client replacements) |
| **Template source** | **The template's** | 20 files, 915 KB, tracked verbatim |

So the claim *"we only took inspiration and evolved the design"* is **true of the code
and false of the images**. Both halves of that sentence matter.

---

## 3. The MIT notice gap — a real, small, fixable defect

The bundled libraries in `archive/audit/v1-audit/vlv/assets/` are MIT. MIT requires the
copyright and permission notice be retained in all copies. Two files have had theirs
**stripped** [M: no licence marker in the first 300 bytes]:

```
archive/audit/v1-audit/vlv/assets/css/bootstrap.min.css    ⚠️ no notice
archive/audit/v1-audit/vlv/assets/js/wow.js                ⚠️ no notice
```

Everything else keeps its banner — jQuery 3.7.1, Bootstrap JS 4.6.2, Popper, Owl
Carousel 2.3.4 (both files), jQuery Validation 1.9.0, animate.css.

**Fix:** prepend each file with the upstream banner and the MIT permission text. This is
a one-line change per file and it is **not** blocked on any decision — it is simply
owed. Tracked in `THIRD-PARTY-NOTICES.md` §6.

---

## 4. The open decision — the 20 tracked template source files

`archive/audit/v1-audit/vlv/` is the material exposure: it is the template's own source,
and unlike the images it is **not public anywhere else**. The images are already served
by `call-indigo.com`, so publishing them adds little; publishing the source adds a lot.

Three options, with honest costs:

| Option | Effect | Cost |
|---|---|---|
| **Leave as-is** | 20 template source files remain public | Redistribution of a commercial template, in the client's name |
| **Delete in a new commit** | Gone from the tree, **still in history** | Removes the current exposure only; `git log` still serves them |
| **Purge from history** | Genuinely gone | `git filter-repo` + force-push across all 32 commits. **Every SHA changes**, so every SHA cited in `CHANGELOG.md` and `docs/` becomes invalid, and this repo's two-commit paperwork convention (`docs/20-development/standards.md` §3) is built on citing real SHAs |

**Recommendation: decide with the client before choosing.** The licence is theirs, so
the risk is theirs to accept. If the answer is "remove it", the cheapest correct
sequence is to wait until `valvoro-prototype/` is retired under **PRD §16.2 F10** — at
which point the template is no longer needed for parity — and purge once, rather than
purging now and again later.

---

## 5. The licence record — what to keep, and where

**This is the part that must not be got wrong.** Two distinct things exist, and only one
of them belongs in the repository.

### 5.1 Never commit the purchase code

An Envato **purchase code** is a secret. It verifies the licence, unlocks support, and
can be used to invalidate or abuse the client's purchase. **A public repository is the
worst possible place for it.**

```
❌  DO NOT COMMIT:  purchase code, Envato API keys, invoice PDFs,
                    account credentials, the client's Envato email
```

### 5.2 Do record the non-sensitive reference

What belongs in the repository is a *reference* — enough for a reviewer to see the
licence position exists and is accounted for, with nothing that can be misused:

| Field | Example | Sensitive? |
|---|---|---|
| Item name | Valvoro — Plumbing Services HTML Template | no |
| Item ID | `62644376` | no |
| Marketplace | ThemeForest (Envato) | no |
| Licence type | Regular or Extended — **to be confirmed** | no |
| Licensee | The client's legal entity | no |
| Purchase date | — | no |
| Order / invoice reference | — | no |
| **Purchase code** | — | **YES — private store only** |
| **Where the evidence lives** | e.g. *client's Envato account* | no |

### 5.3 Where the evidence lives

The purchase receipt, invoice and purchase code belong in a **private store the client
controls** — their Envato account, or a private document store. The repository records
the reference above and *points at* that store. It does not host it.

**A rights record to be completed by the client:**

```yaml
# docs/60-reference/rights-record.yml  — or a table in this file; either is fine.
# NOT YET FILLED IN. Every field below needs the client.
asset:        Valvoro — Plumbing Services HTML Template
item_id:      62644376
marketplace:  ThemeForest (Envato)
licence_type: <Regular | Extended>        # unknown — determines whether the end
                                          # product may be sold to end users
licensee:     <client legal entity>       # see §6 — the entity name is unresolved
purchased:    <YYYY-MM-DD>
order_ref:    <invoice or order id>
evidence_at:  <private location the client controls>
purchase_code: REDACTED — held privately, deliberately not in this repository
```

**Why `licence_type` matters.** A **Regular** licence permits one end product used by
end users free of charge; selling access to the product requires an **Extended**
licence. Which one the client holds determines whether the dashboard may ever be
commercialised — so it is worth confirming alongside the purchase code.

---

## 6. The copyright holder is unresolved — do not guess it

The tree states two names, and a copyright notice must name the **legal person**:

| Name | Occurrences | Where |
|---|---:|---|
| `Call Indigo LLC` | **105** | `README.md`, `CHANGELOG.md`, and `copyrightName` **in the running application** |
| `Indigo Home & Facility Services` | **26** | `PRD.md` — which identifies it explicitly as the **legal** name, with *Call Indigo* as the business name |

[`LICENSE`](../../LICENSE) uses the legal name and carries a comment explaining why. **If
that is wrong, it must be corrected in two places** — the `LICENSE` and the
application's `copyrightName`, because the site footer currently renders
*"© Call Indigo LLC"*.

This is a question for the client. Picking the more frequent string would be a guess
dressed as a measurement.

---

## 7. Should the WordPress files be added and published?

**No — and the reasoning is worth stating, because the question is reasonable.**

The client's previous site was WordPress, built on this template. The React/Vite build
in this repository replaced it. The question is whether to bring the WP files across and
publish them.

**Recommendation: do not.**

1. **Nothing depends on them.** The current build compiles, tests and deploys without
   them. They would be dead weight in a repository whose own standard is that the
   structure matches reality rather than aspiration.
2. **They would add to the redistribution surface**, not reduce it — more template-
   derived material, in public, for no functional gain.
3. **The design reference already exists.** `valvoro-prototype/` is the parity baseline
   and the record of the design language. The WP implementation adds nothing the
   prototype does not already carry.
4. **The licence record is a document, not files.** What needs preserving is *evidence
   of the purchase* (§5), which is a reference plus a private store — not a copy of the
   thing purchased.

**If the client wants the WP implementation retained**, it belongs in a **separate
private repository**, not alongside a public one. That keeps the record without making
the template public twice.

---

## 8. Attribution summary

| Component | Attribution required? | Action |
|---|---|---|
| Valvoro template | **No** — Envato does not require it, and it must not be claimed as ours | None; see §4 for the open decision |
| Bootstrap 4.6.2, jQuery 3.7.1, Popper, Owl Carousel 2.3.4, jQuery Validate 1.9.0, animate.css | **Yes** — MIT notice retention | Banners present ✅ |
| `bootstrap.min.css`, `wow.js` | **Yes** — MIT notice retention | ⚠️ **stripped — restore** (§3) |
| shadcn/ui components | **Yes** — MIT | Recorded in `THIRD-PARTY-NOTICES.md` §3 |
| npm dependencies | **Yes** — per package | Not redistributed; listed for completeness |
| Fonts | **None bundled** | Nothing to do |
| Client photography | Client's own | None |

---

## 9. Open items

| # | Item | Blocked on |
|---|---|---|
| 1 | Decide the 20 tracked template source files (§4) | **Client** — the licence is theirs |
| 2 | Restore the MIT notices on `bootstrap.min.css` and `wow.js` (§3) | Nothing — owed now |
| 3 | Confirm the copyright holder (§6) | **Client** |
| 4 | Confirm the licence type — Regular vs Extended (§5.3) | **Client** |
| 5 | Record the licence reference; keep the purchase code private (§5) | **Client** |
| 6 | Do not add the WP files (§7) | Decision made; recorded here |
