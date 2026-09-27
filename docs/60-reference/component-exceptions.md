# Component Exceptions (PRD §7.5)

**Kind:** dated · **Last verified:** 2026-09-27 at `2f009a2`

## EXCEPTION-1: ColourSwatch (DesignSystemPage)

1. REGISTRY SEARCH
   Registries searched : official (ui.shadcn.com), community directory
   Queries run         : "colour swatch", "color picker", "token display", "design token"

2. CLOSEST CANDIDATES (minimum three, with the reason each fails)
   - Card — fails: a card is a container, not a swatch grid; it carries no colour semantics.
   - Table — fails: renders rows of text, cannot present a colour as a visual field.
   - Item — fails: composes a title/description/actions row; no colour field.
   - Chart — fails: it is a data-visualisation wrapper over Recharts.

3. UNIQUE REQUIREMENT
   This component presents a colour as a first-class visual field with its token name, hex value,
   role description, and one-click copy-to-clipboard. No registry component does that.

4. COST
   LOC: ~35   New a11y surface: no — it is a `<ul>` of `<li>`s with text labels and a button.
   The copy interaction uses the registry `Button` primitive. Ongoing maintenance owner: n/a (rc1 mockup).

5. SIGN-OFF
   Approved by: PRD §7.5 worked example   Date: 2026-09-18
