# Polish pass on the footer + legal modals. Three hunks, all asserted.
# Sequential single-writer script rather than parallel Edits: parallel edits to one
# file race on the write and silently drop earlier changes.
import pathlib, sys

P = pathlib.Path("C:/tmp/indigo/valvoro-prototype/index.html")
src = P.read_text(encoding="utf-8")
before = len(src)
DRY = "--dry" in sys.argv

HUNKS = [
    # 1. The uppercase + letter-spacing on `.legal-meta` made "Effective September 18,
    #    2026 · Last updated September 18, 2026" wrap onto two ragged lines at 390.
    #    Sentence case at the same size reads better and fits.
    ("legal-meta",
     """  .legal-meta {
    font-size: 12.5px; font-weight: 600; letter-spacing: .02em;
    text-transform: uppercase; color: var(--color-body);
  }""",
     """  .legal-meta {
    font-size: 12.5px; font-weight: 600; letter-spacing: .01em;
    color: var(--color-body);
  }"""),

    # 2. Footer vertical rhythm. `pt-[80px] pb-[74px]` are v1's DESKTOP numbers
    #    (`.footer { padding: 4rem 0 2rem }` = 64/32, `.middle_portion` adds the
    #    rest). Paying 80px of air above a stacked single-column footer at 390 is
    #    just wasted scroll, so the desktop values now start at md.
    ("footer padding",
     '<div class="shell grid gap-10 pb-[74px] pt-[80px] md:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1.5fr] lg:gap-[54px]">',
     '<div class="shell grid gap-8 pb-[46px] pt-[52px] md:grid-cols-2 md:gap-10 md:pb-[74px] md:pt-[80px] lg:grid-cols-[2fr_1fr_1fr_1.5fr] lg:gap-[54px]">'),

    # 3. Bottom bar. `flex-wrap` split "Terms of Service" from "Privacy Policy" onto
    #    two ragged lines at 390 — the worst possible pair to separate. Stacking the
    #    group on small screens keeps each label whole; the row layout starts at md
    #    for the group and at lg for the bar itself, because at 768 the © line and
    #    the three right-hand items do not both fit on one row.
    ("bottom bar",
     '<div class="flex flex-col items-center gap-3 border-t border-white/10 py-5 text-center text-[13px] md:flex-row md:justify-between md:text-left">',
     '<div class="flex flex-col items-center gap-3 border-t border-white/10 py-5 text-center text-[13px] lg:flex-row lg:justify-between lg:text-left">'),

    ("bottom bar group",
     '<div class="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">',
     '<div class="flex flex-col items-center gap-2.5 md:flex-row md:flex-wrap md:justify-center md:gap-x-5 md:gap-y-2">'),
]

for tag, old, new in HUNKS:
    n = src.count(old)
    assert n == 1, "anchor %r matched %d times (want 1)" % (tag, n)
    src = src.replace(old, new)
    print("  ok  %-18s %d -> %d bytes" % (tag, len(old), len(new)))

print("index.html %d -> %d bytes (%+d)" % (before, len(src), len(src) - before))
if DRY:
    print("DRY RUN — nothing written")
else:
    P.write_text(src, encoding="utf-8", newline="\n")
    print("WRITTEN")
