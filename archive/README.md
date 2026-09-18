# Archive — Past Work and Reference Material

This directory preserves all pre-git workspace content. Nothing here is part of
the active v2.0.rc1 project; it is reference material and historical record.

## Structure

```
archive/
  reference-sites/        Original template + live site captures
    valvoro-template-preview.html   The Valvoro HTML template preview page
    call-indigo-live.html          Snapshot of call-indigo.com (Next.js)
    call-indigo-live.css           CSS from the live site snapshot
    ci_*.js                        JS chunks from the live site snapshot
    01_Home_reference.jpg          Reference home page screenshot
    call-indigo-com/               Earlier static reconstruction of the live site
      index.html commercial.html css/ js/

  template-assets/        Original Valvoro template's full image library
    valvoro-images/                206 images from the original template
      assets/images/               Template stock photos, icons, favicons

  v1-prototype/            The v2 static-HTML prototype (pre-React)
    valvoro-prototype/
      index.html                   Home page (131KB, 13 sections)
      residential.html             Residential sub-page (97KB)
      commercial.html              Commercial sub-page (92KB)
      css/tw.css                    Stale as a build input (PRD §3.4.1); still the
                                    design-system reference ported to src/index.css
      css/_orphaned-style.css.bak  Orphaned backup
      js/main.js                    Drawer, legal modals, scroll reveal
      assets/images/                78 brand images, icons, logos, favicons
      GROUND_TRUTH-source-facts.txt  Verified site facts (PRD §10 source)
      GROUND_TRUTH-structure.md     Template structure documentation

  audit/                   Verification harness, screenshots, probe scripts
    v1-audit/
      v2check/                      Primary verification harness (PRD §13)
        gen_pages.py                  Sub-page generator (PRD §3.1, §12.3)
        verify.py                     Link/anchor/image assertions (PRD §13.1)
        diag.py                       Landmark box diagnostics
        mincontent.py                 Min-content spill checker
        shots.py                      Viewport-aware screenshots
        shots/                        Footer/modal screenshots
        twtest/                       Tailwind v4 build test sandbox
        *.png                         Comparison screenshots (1920/1440/390)
      header/                       Header parity investigation
      full/                          Full-page comparison screenshots
      tf/                            Top-frame investigation
      vlv/                           Original Valvoro template reference copy
      *.py                           Probe/measure/compare scripts
      *.png                          Diagnostic screenshots
```

## Why this is archived, not deleted

- **The v1 prototype** is the parity baseline for PRD §13. The React port must
  reproduce these pages exactly. The static HTML is the source of truth for
  visual parity.
- **The audit harness** contains the verification scripts the PRD references
  (`verify.py`, `diag.py`, `mincontent.py`, `shots.py`). These are intended to be
  adapted into the project's test harness — `tests/` currently holds only a plan.
- **Reference sites** document what the live site and original template look
  like, for design decisions that predate this repo.
- **Template assets** are the original Valvoro image library; only the subset
  in `valvoro-prototype/assets/images/` is used by the prototype.

## Relationship to the active project

- **The parity baseline is `valvoro-prototype/` at the repo root**, not the copy in
  here. The two are byte-identical for HTML, CSS, JS and the ground-truth docs, but
  `.gitignore` excludes images under `archive/**`, so this copy is missing the 79
  brand images. Compare against the root copy.
- `v1-audit/v2check/` scripts (`verify.py`, `diag.py`, `mincontent.py`, `shots.py`)
  are the intended source for the parity harness. That harness has **not been built
  yet** — `tests/` holds only a plan. See `tests/README.md`.
- `GROUND_TRUTH-source-facts.txt` is the source for the site's published facts in
  `src/lib/data/seed.ts` (`DEFAULT_SETTINGS`), which back both the dashboard's
  General settings and the marketing copy (PRD §10).
- `css/tw.css` is stale as a **build input** — the project ships a single token
  source in `src/index.css`. It is not stale as a **design reference**: it is the
  stylesheet the marketing design system was ported from.
- Nothing else in the archive is touched.
