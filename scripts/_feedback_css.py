#!/usr/bin/env python3
"""
The 2026-09-25 client-feedback stylesheet changes, in one asserted pass.

Same discipline as `_feedback_pages.py`: exact needles, every count asserted, and
the write aborts on any mismatch. Edits to `src/index.css` go through here rather
than through parallel `Edit` calls because concurrent writes to one file race and
the last writer wins silently.

Usage:  python scripts/_feedback_css.py [--write]
"""
import re
import sys

WRITE = "--write" in sys.argv
PATH = "src/index.css"

EDITS = [
    # ── F3/F4: the arch is centred between the text column and the card ───────
    (
        "  .banner-img1 img { width: 406px; }   "
        "/* natural 376 content + 12px pad + 3px border */\n",
        """  .banner-img1 img { width: 406px; }   /* natural 376 content + 12px pad + 3px border */

  /* --------------------------------------------------------------------------
     CLIENT 2026-09-25 — the hero image column is a centred flex row.

     Measured before the change (`scripts/_probe_client_feedback.cjs`): the arch
     sat on the column's LEFT edge at every width, its centre 210px left of the
     column's centre at 1920, 130px at 1440, 99px at 1199 and 34px at 390. The
     cause is that the arch IMG carries Tailwind's `block`, so the template's
     `text-align: center` / `text-align: right` on the figure never applied to it
     — those rules had been dead for the life of the port. The navy box was
     absolutely placed at the far right, so the two never read as a pair.

     Now the figure takes the slack and centres its own image inside it, and the
     card is a flow item, so the arch is centred *between* the text column and the
     Emergency card. `min-width: 0` is load-bearing: without it the figure refuses
     to shrink below its content and the row overflows a narrow column.
     -------------------------------------------------------------------------- */
  .banner-img-con { display: flex; align-items: center; gap: 24px; }
  .banner-img1 {
    flex: 1 1 auto;
    min-width: 0;
    display: flex;
    justify-content: center;
    align-items: center;
  }
""",
        1,
    ),
    # ── F5: the smaller round frame is gone, so its rules go too ─────────────
    (
        """  /* `.banner-content-con .banner-img2 img { padding:12px; border:3px solid
     var(--secondary--color) }` (style.css:1134) and NO width rule anywhere above
     1199 — so the oval is the image's natural 236x346 CONTENT box plus 30px of
     padding+border => a 266x376 border-box. The FIGURE stretches to the row
     height (the template's `.banner-bottom` is a plain d-flex, so align-items is
     `stretch`), which is why the real template renders the figure 266x387.
     Our replacement photo is 745x669 (landscape) and cannot supply the tall
     236x346 intrinsic ratio, so we pin the ratio explicitly instead. */
  .banner-img2     { flex: 0 1 auto; width: 266px; }
  .banner-img2 img { width: 100%; aspect-ratio: 266 / 376; height: auto; }
""",
        """  /* CLIENT 2026-09-25: the `.banner-img2` oval is deleted, so its rules are
     gone too — the base 266x376 border-box, the ≤1199 140px step, the ≤991
     `display:none !important` and the ≤767 `display:none`. `repair-img2.jpg` is
     now unreferenced. The template sized the oval's IMG at its natural 236x346
     content box with a 12px white ring and a 3px white border. */
""",
        1,
    ),
    # ── F3: stop shrinking the arch to 350 on a 1440 laptop ─────────────────
    (
        """  /* The first responsive step for the hero photos: 350 / 440. */
  @media (max-width: 1440px) {
    .banner-img1 img { width: 350px; }
    .plumber-img     { width: 440px; }
  }
""",
        """  /* The first responsive step for the hero photos: 350 / 440.
     CLIENT 2026-09-25: the arch keeps its natural 406 here. The column measures
     610px at 1440, so the template's shrink to 350 was never necessary — it was
     one of the reasons the hero read as small on a laptop. The ≤1199 step still
     comes down, and `max-width: 100%` clamps whatever the flex row leaves. */
  @media (max-width: 1440px) {
    .banner-img1 img { width: 406px; }
    .plumber-img     { width: 440px; }
  }
""",
        1,
    ),
    # ── F1/F2: the Emergency card is a flow item, and it is bigger ───────────
    (
        """  /* `.banner-con .navy-box { right:50px; top:126px; padding:19px 25px }` base;
     responsive.css:495 => right:0 / top:39px / 13px 20px at ≤1440,
     :513 => right:0 / top:28px / 10px 15px at ≤1199. */
  .navy-box { right: 50px; top: 126px; padding: 19px 25px; }
  @media (max-width: 1440px) { .navy-box { right: 0;    top: 39px; padding: 13px 20px; } }
  @media (max-width: 1199px) { .navy-box { right: 0;    top: 28px; padding: 10px 15px; } }
""",
        """  /* `.banner-con .navy-box { right:50px; top:126px; padding:19px 25px }` base;
     responsive.css:495 => right:0 / top:39px / 13px 20px at ≤1440,
     :513 => right:0 / top:28px / 10px 15px at ≤1199.

     CLIENT 2026-09-25: the card is a FLOW item now (see `.banner-img-con`), so
     every `right`/`top` offset is gone — they only ever applied to
     `position: absolute`. `flex: 0 0 auto` holds it at its content width while
     the arch takes the slack; `align-self: center` centres it vertically in the
     row and horizontally in the stacked column. The padding is larger so the
     card reads as the emergency action rather than as a caption. */
  .navy-box { flex: 0 0 auto; align-self: center; min-width: 190px; padding: 22px 28px; }
  @media (max-width: 1440px) { .navy-box { min-width: 178px; padding: 18px 22px; } }
  @media (max-width: 1199px) { .navy-box { min-width: 160px; padding: 15px 18px; } }
""",
        1,
    ),
    # ── ≤1199: the oval is gone; the arch stops at 380 ──────────────────────
    (
        """    .banner-img1 img { width: 320px; }
    .plumber-img     { width: 390px; }
    /* responsive.css:1507/1511 — the figure gets `flex-shrink: 0` and the IMG
       becomes a fixed 140px. Both sizes live on the img, not the figure. */
    .banner-img2     { flex: 0 0 auto; width: 140px; }
    .banner-img2 img { width: 100%; aspect-ratio: 140 / 191; }
    .dot-img img, img.dot-img { width: 34px; height: auto; }
""",
        """    .banner-img1 img { width: 380px; }
    .plumber-img     { width: 390px; }
    /* CLIENT 2026-09-25: 320 -> 380. The flex row clamps this to whatever the
       column leaves once the card has its width, so the value is a ceiling. */
    .dot-img img, img.dot-img { width: 34px; height: auto; }
""",
        1,
    ),
    # ── ≤991: the block-level comment still claimed the card is hidden ───────
    (
        """     the Emergency card and the dots on screen through the whole 768-991 range.
     -------------------------------------------------------------------------- */
""",
        """     the Emergency card and the dots on screen through the whole 768-991 range.

     CLIENT 2026-09-25 — TWO of those template hides are deliberately not applied
     any more: the oval is deleted outright, and the navy box is a normal flow
     item, so neither has anything left to hide. The dots and the scroll cue are
     still hidden exactly as the template does.
     -------------------------------------------------------------------------- */
""",
        1,
    ),
    # ── ≤991: the card renders here now instead of being hidden ─────────────
    (
        """    /* `!important` is REQUIRED on these two: the markup carries `md:block` on
       the oval and `flex` on the navy box, and Tailwind emits generated
       utilities in a later cascade layer than bare rules written in this same
       <style type="text/tailwindcss"> block. Without it the oval stayed visible
       from 768-991 and the Emergency card overflowed the viewport (docW 773 vs
       winW 768 at 768px). */
    .banner-img2  { display: none !important; }
    .navy-box     { display: none !important; }
    .scrol-outer  { display: none; }
    .dot-img      { display: none; }
    .banner-img1     { text-align: right; }
    .banner-img1 img { width: 330px; }
""",
        """    /* CLIENT 2026-09-25 — `.navy-box { display: none !important }` used to sit
       here, with a comment explaining that the `!important` was required because
       the markup carried `flex` on the navy box. That rule is why the client's
       previous "the Emergency button must exist on mobile" request never landed:
       the markup was given `max-md:static` while this block still hid the card,
       and CSS won. The card is in normal flow now, so there is nothing to fight
       and nothing to hide.

       The columns stack at ≤767, but 768-991 is still two-up, so the card cannot
       sit beside the arch here — the row becomes a centred column and the card
       drops under the arch. Measured after the change: no width in 320-1920
       overflows its viewport. */
    .banner-img-con  { flex-direction: column; gap: 20px; align-items: stretch; }
    .banner-img1     { flex: 0 0 auto; width: 100%; }
    .banner-img1 img { width: 406px; }
    .scrol-outer  { display: none; }
    .dot-img      { display: none; }
""",
        1,
    ),
    # ── ≤767: a bigger arch on phones, and no oval rules ────────────────────
    (
        """    .banner-img2 { display: none; }
    .statistics-wrapper { margin-left: 0; margin-bottom: 25px; justify-content: center; }
""",
        """    .statistics-wrapper { margin-left: 0; margin-bottom: 25px; justify-content: center; }
""",
        1,
    ),
    (
        """    .banner-img1 { display: block; width: auto; text-align: center; }
    .banner-img1 img { width: 260px; }
""",
        """    /* CLIENT 2026-09-25: 260 -> 300. The centring that used to be asked for
       here via `text-align: center` never worked — the IMG is a `block`, so
       text-align had nothing to centre. `.banner-img1` is a centring flex box
       from the base branch now, so the img is genuinely centred at every width. */
    .banner-img1 img { width: 300px; }
""",
        1,
    ),
    (
        """    .dot-img { display: none; }
    .scrol-outer { display: none; }
    .banner-img-con { text-align: center; }
""",
        """    .dot-img { display: none; }
    .scrol-outer { display: none; }
""",
        1,
    ),
]


def main():
    src = open(PATH, encoding="utf-8").read()
    orig = src
    for i, (needle, repl, want) in enumerate(EDITS):
        n = src.count(needle)
        if n != want:
            print(f"ABORT: edit {i} matched {n} time(s), expected {want}")
            print("---- needle ----")
            print(needle[:400])
            sys.exit(1)
        src = src.replace(needle, repl, want)

    if src == orig:
        print("ABORT: nothing changed")
        sys.exit(1)
    if "\r" in src:
        print(f"ABORT: {src.count(chr(13))} CR bytes — line endings were mangled")
        sys.exit(1)

    # No RULE may target the deleted oval any more. A bare substring test would be
    # wrong: the template citations in the surrounding comments name it on purpose.
    for line in src.splitlines():
        if re.match(r"\s*\.banner-img2[\s,{]", line):
            print(f"ABORT: a .banner-img2 rule survives: {line.strip()!r}")
            sys.exit(1)
    if "navy-box     { display: none" in src:
        print("ABORT: the navy-box hide rule survives")
        sys.exit(1)

    if WRITE:
        with open(PATH, "w", encoding="utf-8", newline="\n") as fh:
            fh.write(src)
        print(f"wrote {PATH}  ({len(orig)} -> {len(src)} bytes)")
    else:
        print(f"would write {PATH}  ({len(orig)} -> {len(src)} bytes)")


main()
