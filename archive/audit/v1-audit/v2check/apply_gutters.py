"""Apply the v2 gutter-system patch to index.html.

Every replacement asserts that its anchor text occurs EXACTLY once, so a
silently-failed `str.replace` (which is how this kind of edit goes wrong) turns
into a hard error instead of a half-applied stylesheet.

Run:  python apply_gutters.py [--dry]
"""
import sys

PATH = "C:/tmp/indigo/valvoro-prototype/index.html"

REPS = []


def rep(tag, old, new):
    REPS.append((tag, old, new))


# ---------------------------------------------------------------- CSS tokens
rep(
    "base/gutter-tokens",
    """/* ---- Base ---- */
@layer base {
  html { scroll-behavior: smooth; }""",
    """/* ---- Base ---- */
@layer base {
  /* ==========================================================================
     GUTTER SYSTEM — v2, 2026-09-18.

     Three nested layers, each with exactly one job, each driven by one token:

       viewport
        └── .pad-rl   -> --gut     viewport edge  -> card edge
             └── .mbox -> --inset  card edge      -> section text
                  └── .shell -> --col  the max text column (>=1200 only)

     WHY THIS REPLACED THE TEMPLATE'S NUMBERS. The template paid the outer
     gutter at `50px` (or `2%` at <=1870) and the inner inset at `1%`, so the
     two moved together and BOTH collapsed on small screens. Measured on the
     build this replaces (_audit/v2check/diag.py, "BEFORE"):

       viewport  card edge -> text      note
       1440      13.8px                  a 16px-radius card, text 13.8px in
       1024       9.8px
        768       7.4px
        390       3.7px                  text effectively on the rounded corner

     and the card-less bands paid only the inner inset, so their text sat at
     14.4px at 1440 and at 0px at 1920 — i.e. hard against the page edge.

     The ladder below is monotonic and bottoms out at --gut: 0 at <=767, where
     the outer gutter is dropped ON PURPOSE: the cards go full-bleed so no
     viewport width is spent on margin, and the text keeps a 16px inset of its
     own. That is the "on mobile the side padding IS exactly butted up" rule.

       breakpoint     --gut   --inset
       >= 1871         50      50
       <= 1870         40      40
       <= 1439         32      32
       <= 1199         24      28
       <=  991         16      24
       <=  767          0      16
     ========================================================================== */
  :root {
    --gut:   50px;   /* viewport edge -> card edge    */
    --inset: 50px;   /* card edge     -> section text */
    --col:   1417px; /* the template's .main-container */
  }
  @media (max-width: 1870px) { :root { --gut: 40px; --inset: 40px; } }
  @media (max-width: 1439px) { :root { --gut: 32px; --inset: 32px; } }
  @media (max-width: 1199px) { :root { --gut: 24px; --inset: 28px; } }
  @media (max-width: 991px)  { :root { --gut: 16px; --inset: 24px; } }
  @media (max-width: 767px)  { :root { --gut: 0px;  --inset: 16px; } }

  html { scroll-behavior: smooth; }""",
)

# ------------------------------------------------------- .pad-rl / .mbox
rep(
    "components/pad-rl+mbox",
    """  .pad-rl { padding-left: 50px; padding-right: 50px; }
  /* Below 1870 the template applies `padding: 0 1% !important` to BOTH
     `.padding-rl` and `.main-box` — and `.main-box` appears on TWO nested
     wrappers there (`.home-outer-wrapper` AND `.banner-con`), so the slab is
     inset by 1% + 1% + 1% = 3%, not 2%. Verified at 1440 against the real
     template's ancestor chain: .padding-rl pl 14.39 -> .home-outer-wrapper pl
     14.11 -> .banner-con pl 13.83, giving a 1383px slab with a 1355px content
     box. This build has only two nesting levels, so 2% + 1% reproduces the same
     3% total. */
  @media (max-width: 1870px) {
    .pad-rl { padding-left: 2%; padding-right: 2%; }
    .mbox   { padding-left: 1%; padding-right: 1%; }
  }""",
    """  .pad-rl { padding-left: var(--gut);   padding-right: var(--gut); }
  .mbox   { padding-left: var(--inset); padding-right: var(--inset); }
  /* v2 DIVERGES FROM THE TEMPLATE HERE, on purpose.
     The template's `.padding-rl` was `50px` above 1870 and `2%` at or below it,
     with `.main-box` adding a further `1%`. Both insets therefore moved
     together and both collapsed on small screens, and the card-less bands —
     which carry `.main-box` with no `.padding-rl` wrapper — paid only the 1%.
     The two are now independent named tokens with their own ladders, so the
     card edge and the text line can be controlled separately. See the token
     block in @layer base for the values and the measurements that motivated
     them. */""",
)

# ------------------------------------------------------------------ .shell
rep(
    "components/shell+band",
    """  /* The content container: the template's `.main-container`. */
  .shell { margin-inline: auto; }
  @media (min-width: 1200px) { .shell { max-width: 1417px; } }""",
    """  /* The content container: the template's `.main-container`. Every band's text
     lands on this one column, so the ribbon, the header brand, the section
     headings and the footer share a single left edge. */
  .shell { margin-inline: auto; }
  @media (min-width: 1200px) { .shell { max-width: var(--col); } }

  /* `.band` — a CARD-LESS section: a white band with no `.slab` background.
     Its text has to land on the same line as a card's text, and a card's text
     sits at (outer gutter + inner inset). A card-less band has no card edge to
     measure from, so it pays both at once. Below 1200 the inner `.shell` is
     inert and the two are on the same pixel; above it, both are capped by the
     same `.shell`, so they stay on the same pixel there too.
     Before this, `#services`, `#process` and `#reviews` carried `.mbox` alone:
     measured text at x=14.4 at 1440 and x=0 at 1920 against the cards' 42.6 and
     251.5. */
  .band {
    padding-left: calc(var(--gut) + var(--inset));
    padding-right: calc(var(--gut) + var(--inset));
  }""",
)

# ----------------------------------------------------------------- .spacer
rep(
    "components/spacer",
    """  /* .spacer (style.css:408) = 50px, 20px at <=1440. */
  .spacer { height: 50px; }
  @media (max-width: 1440px) { .spacer { height: 20px; } }""",
    """  /* .spacer (style.css:408) = 50px, 20px at <=1440. v2 keeps both endpoints
     but spreads the collapse over four steps, so the gap between two cards no
     longer halves at a single breakpoint while the section padding is still
     near its desktop size. */
  .spacer { height: 50px; }
  @media (max-width: 1439px) { .spacer { height: 40px; } }
  @media (max-width: 1199px) { .spacer { height: 32px; } }
  @media (max-width: 991px)  { .spacer { height: 24px; } }
  @media (max-width: 767px)  { .spacer { height: 20px; } }""",
)

# --------------------------------------------------- square corners <=767
rep(
    "components/full-bleed-radius",
    """  .slab-body { position: relative; z-index: 2; }""",
    """  .slab-body { position: relative; z-index: 2; }

  /* At <=767 the outer gutter is 0, so every card is full-bleed. A radius on a
     full-bleed card can only show as white notches at the screen corners, so
     the corner language is dropped there entirely — the same "less rounded
     corners" decision, taken to its limit. Declared AFTER the rules it
     overrides (`.slab`, `.slab-photo::before`, `.pill-topbar`) so it wins on
     source order inside the same layer. */
  @media (max-width: 767px) {
    .slab, .slab-photo::before, .outer-card, .header-card, .pill-topbar {
      border-radius: 0;
    }
  }""",
)

# --------------------------------------------------------------- .hero-wrap
rep(
    "components/hero-wrap",
    """  /* The hero's inner wrapper: `.wrapper1711 { max-width:1711px; margin:auto }`
     (responsive.css:9), with the template's own 30px/20px side padding in the
     1711-1870 and 1441-1710 bands. */
  .hero-wrap { margin-inline: auto; max-width: 1711px; }""",
    """  /* The hero's inner wrapper: the template's `.wrapper1711 { max-width:1711px;
     margin:auto }` (responsive.css:9).
     v2 DIVERGES: the 1711 cap is dropped in favour of `--col`, the same column
     every other band uses. Measured at 1920 (diag.py, "BEFORE"): the template's
     cap put the hero heading at x 104.5 while every section heading sat at
     x 251.5 — a 147px disagreement between the page's most prominent text and
     everything under it. */
  .hero-wrap { margin-inline: auto; max-width: var(--col); }""",
)

# ------------------------------------------------------------ TOPBAR markup
rep(
    "markup/topbar",
    """    <div class="mbox">
      <div class="shell">
        <div class="pill-topbar flex h-[43px] items-center justify-between gap-4 bg-topbar pl-[47px] pr-[43px] text-[13px] text-slate-200 max-md:h-auto max-md:flex-wrap max-md:gap-2.5 max-md:px-5 max-md:py-2.5 max-md:text-[12px]">
          <div class="flex flex-wrap items-center gap-4 max-md:gap-2.5">
            <span class="inline-flex items-center gap-2 font-semibold text-white">
              <svg class="size-4 text-sky" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>
              Residential &amp; commercial services
            </span>
            <span class="inline-flex items-center gap-2 font-semibold text-white">
              <svg class="size-4 text-sky" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 21s-7-5.5-7-11a7 7 0 1 1 14 0c0 5.5-7 11-7 11z"/><circle cx="12" cy="10" r="2.6"/></svg>
              Hays, Travis, and Williamson counties
            </span>
          </div>
          <div class="flex items-center gap-2.5 max-md:hidden">
            <span>Est. 2012 · Indigo Home &amp; Facility Services</span>
          </div>
        </div>
      </div>
    </div>""",
    """    <!-- The BAR is the background layer and spans the full card width, exactly
         like every `.slab` below it. The `.shell` inside is the text layer.
         Previously the bar sat inside the `.shell`, so the bar ITSELF was
         capped at 1417px: measured at 1920 the bar ran x 251.5..1668.5 while the
         hero slab ran x 50..1870 — 201.5px narrower per side, which is the
         defect this fixes. Its text was inset a further `pl-[47px] pr-[43px]`
         from its own edge, landing 47px right of the header brand.
         Now: bar edge = card edge, and `.mbox` puts the text on `--inset`, the
         same line as the brand and every section heading. -->
    <div class="pill-topbar mbox bg-topbar text-[13px] text-slate-200 max-md:text-[12px]">
      <div class="shell flex h-[43px] items-center justify-between gap-4 max-md:h-auto max-md:flex-wrap max-md:gap-2.5 max-md:py-2.5">
        <div class="flex flex-wrap items-center gap-4 max-md:gap-2.5">
          <span class="inline-flex items-center gap-2 font-semibold text-white">
            <svg class="size-4 text-sky" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>
            Residential &amp; commercial services
          </span>
          <span class="inline-flex items-center gap-2 font-semibold text-white">
            <svg class="size-4 text-sky" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 21s-7-5.5-7-11a7 7 0 1 1 14 0c0 5.5-7 11-7 11z"/><circle cx="12" cy="10" r="2.6"/></svg>
            Hays, Travis, and Williamson counties
          </span>
        </div>
        <div class="flex items-center gap-2.5 max-md:hidden">
          <span>Est. 2012 · Indigo Home &amp; Facility Services</span>
        </div>
      </div>
    </div>""",
)

# ------------------------------------------------------------ HEADER markup
rep(
    "markup/header-open",
    """    <div class="mbox">
    <div class="shell">
      <div class="header-card mbox flex h-[56px] items-center max-md:h-[56px]">""",
    """    <!-- The header card is the background layer (full card width) and the
         `.shell` inside is the text layer, so the brand lands on the same line
         as the ribbon text and every section heading.
         The extra `.mbox` wrapper this replaces double-charged the inset: the
         chain was `.pad-rl > .mbox > .shell > .header-card.mbox`, i.e. the card
         edge at 42.6 while the hero slab's edge was at 28.8 (1440), and at 1920
         the brand sat at x 265.7 against the section text's 251.5. -->
    <div class="header-card mbox">
      <div class="shell flex h-[56px] items-center max-md:h-[56px]">""",
)
rep(
    "markup/header-close",
    """      </button>
      </div>
    </div>
    </div>
  </header>""",
    """      </button>
      </div>
    </div>
  </header>""",
)

# ---------------------------------------------------------- CARD-LESS BANDS
for sec in ("services", "process", "reviews"):
    rep(
        "markup/band-%s" % sec,
        '<section id="%s" class="mbox pad-140">' % sec,
        '<section id="%s" class="band pad-140">' % sec,
    )
rep(
    "markup/band-brands",
    '<section id="brands" class="py-14">',
    '<section id="brands" class="band py-14">',
)

# ------------------------------------------------------ ABOUT photo row fix
rep(
    "markup/about-photo-row",
    """        <figure class="m-0 w-[372px] shrink-0 max-lg:w-[280px] max-md:w-1/2 max-md:pr-[8px]">""",
    """        <!-- The photo row is FLUID up to the natural widths, not fixed at
             them. `45%` of the grid container is less than 372+30+347 for any
             container narrower than ~1664px, and the two figures were
             `shrink-0`, so they spilled out of their column and painted over
             the text. Measured at 1440: figure 2 ran to x 791.6 while the text
             column started at x 772.3 — a 19.3px overlap (195px at 1024) that
             `body { overflow-x: hidden }` hid from every overflow check, because
             the spill never reached the viewport edge. -->
        <figure class="m-0 min-w-0 flex-[372] max-w-[372px] max-lg:w-[280px] max-lg:flex-none max-lg:max-w-none max-md:w-1/2 max-md:pr-[8px]">""",
)
rep(
    "markup/about-photo-row-2",
    """        <div class="relative w-[347px] shrink-0 max-lg:w-[260px] max-md:w-1/2 max-md:pl-[8px]">""",
    """        <div class="relative min-w-0 flex-[347] max-w-[347px] max-lg:w-[260px] max-lg:flex-none max-lg:max-w-none max-md:w-1/2 max-md:pl-[8px]">""",
)


def main():
    dry = "--dry" in sys.argv
    src = open(PATH, encoding="utf-8").read()
    orig_len = len(src)

    for tag, old, new in REPS:
        n = src.count(old)
        if n != 1:
            raise SystemExit(
                "FAIL %-28s anchor found %d times (expected 1)\n--- anchor ---\n%s"
                % (tag, n, old[:400])
            )
        src = src.replace(old, new)
        print("  ok  %-28s %5d -> %5d bytes" % (tag, len(old), len(new)))

    if dry:
        print("\nDRY RUN — %d replacements validated, nothing written." % len(REPS))
        return

    open(PATH, "w", encoding="utf-8", newline="").write(src)
    print("\nWROTE %s  (%d -> %d bytes, %+d)" % (
        PATH, orig_len, len(src), len(src) - orig_len))


if __name__ == "__main__":
    main()
