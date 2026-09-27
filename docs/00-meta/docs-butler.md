# Docs Butler — Visual Asset Agent

**Kind:** living · **Owner:** the repo · **Asserted by:** `tests/docs.mjs`

The docs butler is a persistent agent specification for maintaining and enhancing
documentation visuals. It runs continuously (or on-demand) to ensure the project's
documentation remains visually rich, accurate, and human-friendly.

---

## 1. Purpose

Documentation is read by humans. Humans process visual information faster than text.
The docs butler exists to:

- **Identify** documents that would benefit from visual enhancement
- **Generate** appropriate diagrams, flowcharts, and illustrations
- **Maintain** a registry of visual assets
- **Verify** that images render correctly and links remain valid
- **Evolve** the visual style as the project matures

## 2. When to run

| Trigger | Action |
|---|---|
| New document added to `docs/` | Assess for visual needs |
| Existing document significantly revised | Check if visuals need updating |
| Architecture or data flow changes | Regenerate affected diagrams |
| Quarterly review | Audit all visuals for staleness |
| New contributor onboarding | Ensure onboarding docs have clear visuals |

## 3. Visual asset conventions

### 3.1 Format

- **SVG preferred** for diagrams, flowcharts, and illustrations
  - Scales without loss
  - Dark-mode friendly (transparent background, theme-aware colors)
  - Editable as text
- **PNG acceptable** for screenshots and photographs
  - Store source in `archive/` if generated from a tool
- **Never GIF** — use SVG animation or static frames

### 3.2 Location

```
docs/assets/           # Visuals referenced by docs
├── <doc-name>.svg     # Named after the document they enhance
└── README.md          # Asset registry (this file maintains it)
```

### 3.3 Naming

```
<domain>-<topic>.svg
architecture-diagram.svg
data-layer-diagram.svg
deployment-flow.svg
admin-gate-flow.svg
onboarding-map.svg
```

### 3.4 Embedding

```markdown
![Alt text](../assets/filename.svg)

*Figure N — Descriptive caption explaining what the diagram shows.*
```

- Every image MUST have alt text
- Every image SHOULD have a caption
- Captions are italicized, prefixed with "Figure N"
- Reference the figure from the prose when it explains something non-obvious

### 3.5 Style

- **Flat design** — no gradients, shadows, or 3D effects
- **Color palette** — use the project's design tokens:
  - Teal (`#1D9E75`) for primary flow / success
  - Blue (`#378ADD`) for information / reference
  - Amber (`#BA7517`) for warnings / human actions
  - Red (`#E24B4A`) for errors / blocks
  - Purple (`#7F77DD`) for auth / security
  - Gray (`#888780`) for neutral / infrastructure
- **Typography** — sans-serif, 13px body, 14px headings
- **Dark mode** — assume the doc may be read in a dark IDE; use light text on dark fills

## 4. Asset registry

| Asset | Document | Type | Last Verified |
|---|---|---|---|
| `architecture-diagram.svg` | `docs/20-development/architecture.md` | Structural | 2026-09-27 |
| `data-layer-diagram.svg` | `docs/60-reference/data-layer.md` | Flowchart | 2026-09-27 |
| `deployment-flow.svg` | `docs/30-operations/deployment.md` | Flowchart | 2026-09-27 |
| `admin-gate-flow.svg` | `docs/60-reference/admin-gate.md` | Flowchart | 2026-09-27 |
| `onboarding-map.svg` | `docs/10-onboarding/README.md` | Flowchart | 2026-09-27 |

## 5. Generation checklist

Before generating a new visual:

- [ ] The document's content is stable (not in active revision)
- [ ] The visual explains something that text alone makes confusing
- [ ] The visual fits the style conventions (§3.5)
- [ ] The visual is referenced from the document with alt text and caption
- [ ] The visual is added to the asset registry (§4)
- [ ] The visual renders correctly in both light and dark contexts

## 6. Maintenance tasks

### Monthly

- Run `tests/docs.mjs` link check to catch broken image references
- Review `docs/assets/` for orphaned files (not referenced by any doc)

### Quarterly

- Audit each visual against its source document for drift
- Regenerate diagrams if the architecture or flow has changed
- Check for new documents that lack visuals

### On architecture change

- Identify all diagrams affected by the change
- Regenerate or update each affected diagram
- Update the `Last Verified` date in the asset registry

## 7. Handoff protocol

When passing the docs butler responsibility to another agent or human:

1. **State the current asset registry** — what exists, where, for which docs
2. **Note pending work** — documents identified as needing visuals but not yet done
3. **Share the style guide** — §3.5 above
4. **Point to examples** — the five diagrams in `docs/assets/` are the reference
5. **Document any custom tools** — if using a specific diagram generator, note it

---

*Generated 2026-09-27. The docs butler is a convention, not code. Any agent or human
following this specification is the docs butler.*
