# Component Exceptions

Records every custom component used under `/admin` that is not a registry
component. A custom component may only be used if a registry search was
conducted and documented per PRD §7.5.

A missing field is a rejection, not a gap to fill later.

---

## EXCEPTION-1: Colour Swatch Grid

### 1. REGISTRY SEARCH

- **Registries searched:** official (ui.shadcn.com), community directory
- **Queries run:** `card`, `table`, `item`, `chart`, `badge`

### 2. CLOSEST CANDIDATES (minimum three, with the reason each fails)

- **`Card`** — fails: a card is a container, not a swatch grid; it carries no
  colour semantics. You could put swatches *inside* cards, but the card itself
  does not present a colour as a visual field.
- **`Table`** — fails: renders rows of text, cannot present a colour as a
  first-class visual field. A table cell could have a background colour, but
  the table component does not model colour-as-data.
- **`Item`** — fails: composes a title/description/actions row; no colour field.
- **`Chart`** — fails: it is a data-visualisation wrapper over Recharts, not
  a colour display primitive.

### 3. UNIQUE REQUIREMENT

The swatch grid presents a colour as a first-class visual field with its token
name, hex value, and role. No registry component does that — they all present
text or structured data, not colour-as-content.

### 4. COST

- **LOC:** ~60
- **New a11y surface:** No — it is a `<ul>` of `<li>`s with text labels. The
  only interactive element is the copy-to-clipboard button, which is the
  registry `Button` component.
- **Ongoing maintenance owner:** Jaden

### 5. SIGN-OFF

- **Approved by:** Jaden
- **Date:** 2026-09-18
