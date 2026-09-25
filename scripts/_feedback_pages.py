#!/usr/bin/env python3
"""
Apply the 2026-09-25 client-feedback edits to the three mirror marketing pages.

One pass per file, every needle count asserted, and the write is aborted if any
assertion fails. That is deliberate: `chrome-markup.ts` taught this repo that a
targeted replacement whose needle has drifted fails SILENTLY, and the parallel
`Edit` race taught it that a batch can report success while dropping changes.

Line-range edits are applied in DESCENDING order so the earlier indices stay
valid; the string edits run afterwards and do not depend on line numbers.

Usage:  python scripts/_feedback_pages.py [--write]
"""
import re
import sys

WRITE = "--write" in sys.argv
ROOT = "src/marketing/pages"

# ── the badge that hung off the CTA photo's right edge, on all three pages ────
BADGE_RE = re.compile(
    r'          <span class="absolute -right-7 top-1/2 hidden[\s\S]*?</span>\n'
)
BADGE_NOTE = (
    "          <!-- CLIENT 2026-09-25: the 110px navy disc that hung here is\n"
    "               deleted. It read as a stray phone logo floating between the\n"
    "               photograph and the text block rather than as part of either.\n"
    "               logo-vector.png - the template's demo mark it had replaced -\n"
    "               does NOT come back. -->\n"
)

# The CTA band's own comment still described the badge as present. Only the HOME
# page keeps the badge inside a long band comment; the two service pages carry a
# short comment of their own immediately above the span, so they get the combined
# comment+span removal below instead.
CTA_PARA_RE = re.compile(
    r"       The badge is the client's official lockup[\s\S]*?over a flat [^\n]*-->\n"
)
SERVICE_BADGE_RE = re.compile(
    r"          <!-- The client's official mark[\s\S]*?</span>\n"
)
CTA_PARA_NEW = (
    "       A 110px navy disc carrying the client's phone glyph used to hang off\n"
    "       the photo's right edge here. Deleted 2026-09-25 on client feedback: it\n"
    "       read as a stray phone logo floating between the photograph and the text\n"
    "       block rather than as part of either. logo-vector.png - the template's\n"
    "       demo mark it had replaced, which drew a cyan glyph that read as a \"P\"\n"
    "       over the photo - does NOT come back. This file previously ran a centred\n"
    "       text column with the image on the right over a flat bg-ink. -->\n"
)

# ── home-only edits ──────────────────────────────────────────────────────────
NUMERAL_OLD = 'class="absolute right-5 top-4 text-[34px] font-bold text-mist"'
NUMERAL_NEW = 'class="absolute right-5 top-4 text-[34px] font-bold text-brand"'

OVAL_NOTE = (
    "            <!-- CLIENT 2026-09-25: the smaller round frame that used to sit\n"
    "                 here - a 266x387 white-ringed oval immediately under the\n"
    "                 headline, next to the much larger arch - is deleted. Against\n"
    "                 the arch it read as a second, competing picture frame.\n"
    "                 repair-img2.jpg is now unreferenced. -->\n"
)

ARCH_BLOCK = '''          <figure class="banner-img1 relative m-0">
            <!-- id="hero-arch": useSiteChrome swaps this to the photograph for
                 whichever service #hero-rotate is naming, so the picture and the
                 headline agree. The static src is the FIRST rotation option, so a
                 no-JS or reduced-motion load shows a real photograph rather than
                 an empty frame. The five files are all 376x556 because this slot
                 is NATURAL SIZE - the file's own pixels ARE the rendered box - so
                 a differently-sized swap would move the hero. Built by
                 scripts/_hero_arch_build.cjs, which enforces that.

                 CLIENT 2026-09-25: the arch is no longer pinned to the column's
                 left edge. It is centred in the space left of the Emergency card
                 (see .banner-img-con in src/index.css). This wrapper is what keeps
                 the decorative dots glued to the arch rather than to the column. -->
            <span class="hero-arch-slot relative block">
              <img id="hero-arch" src="/assets/images/hero-arch-plumbing.jpg"
                alt="Call Indigo plumber working on the pipework under a sink"
                class="block h-auto max-w-full rounded-[258px] border-[3px] border-sky object-cover p-[12px]">
              <!-- dot-img - the template puts this at the image column's bottom-left
                   with a 54px width above 1440 and 34px at 1199. It lives inside
                   the arch wrapper now, so bottom-left means the arch's. -->
              <img src="/assets/images/dots.png" alt="" aria-hidden="true"
                class="dot-img pointer-events-none absolute left-0 opacity-90">
            </span>
          </figure>
'''

NAVY_BLOCK = '''          <!-- navy-box.bg-accent.br-20 - the template's `.banner-con .navy-box`
               was `position:absolute; right:50px; top:126px`, measured 159x179,
               and hidden below 768 because that anchoring assumes the two-column
               hero.

               CLIENT 2026-09-25: "the red button is small on desktop, and on
               mobile it is not there". Both were true. The card is now a FLOW
               item in the hero image column (see `.banner-img-con` in
               src/index.css), which is what makes it render at every width: an
               earlier `max-md:static` attempt had been defeated by a
               `.navy-box { display:none !important }` in the <=991 block, so the
               card had never once appeared on a phone. The disc, the label and
               the padding are all larger so it reads as the emergency action
               rather than as a caption. -->
          <a href="tel:+15126084999"
             class="navy-box flex flex-col items-center justify-center rounded-[12px] bg-topbar text-center text-white shadow-[16px_2px_13px_rgb(0_0_0/11%)] transition hover:bg-[#1c2c4e]">
            <!-- CLIENT: a red round brand mark here, not the template's siren
                 raster. Same disc-and-glyph lockup as the header - a rounded-full
                 disc holding a lucide phone - recoloured red. Enlarged 2026-09-25
                 from p-1.5/20px to p-2.5/24px, i.e. a 44px disc: 10+24+10. White
                 on #d92d20 measures 4.83:1, over the 3:1 bar for a non-text mark;
                 the card's own text still says "Emergency". -->
            <div class="mb-[10px] shrink-0 rounded-full bg-[#d92d20] p-2.5" aria-hidden="true"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-white"><path d="M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384"></path></svg></div>
            <b class="mb-[6px] block text-[26px] font-bold leading-[30px]">Emergency</b>
            <span class="mb-1.5 block text-[15px] font-medium leading-[21px] text-white">Typical arrival<br>30\u201360 min</span>
            <span class="inline-block h-[28px] leading-[28px]"><img src="/assets/images/white-up-right-arrow.png" alt="" aria-hidden="true" class="inline h-[11px] w-[12px] align-middle object-contain"></span>
          </a>
'''

CRED_NOTE = '''  <!-- Moved 2026-09-25 (client feedback): "Accredited & Reviewed" now sits
       directly under the testimonials. As a trust signal it belongs beside the
       reviews, not underneath the FAQ. -->
'''

FAQ_LINE = "  <!-- ======================= FAQ ======================= -->"
CRED_LINE = "  <!-- ======================= CREDENTIALS ======================= -->"


def fail(msg):
    print("ABORT: " + msg)
    sys.exit(1)


def apply_home(lines):
    """Line-range edits, descending so earlier indices stay valid."""
    if lines[754].rstrip("\n") != CRED_LINE:
        fail(f"line 755 is {lines[754]!r}, not the CREDENTIALS comment")
    if lines[777].rstrip("\n") != "  </section>":
        fail(f"line 778 is {lines[777]!r}, not the end of the credentials section")
    # The credentials block is MOVED, not rewritten: capture it from the source so
    # the long explanatory comment cannot drift out of sync with a retyped copy.
    cred = lines[754:778]  # 755..778 inclusive

    edits = [
        (755, 781, CRED_LINE, None),                                       # remove in place
        (343, 364, "          <!-- navy-box.bg-accent.br-20", NAVY_BLOCK),
        (322, 341, '          <figure class="banner-img1', ARCH_BLOCK),
        (252, 264, "            <!-- NOT ", OVAL_NOTE),
    ]
    for start, end, prefix, repl in edits:
        got = lines[start - 1]
        if not got.startswith(prefix):
            fail(f"line {start} is {got!r}, expected it to start with {prefix!r}")
        lines[start - 1:end] = [] if repl is None else [repl]

    # Insert the credentials band between the testimonials and the FAQ.
    for i, ln in enumerate(lines):
        if ln.rstrip("\n") == FAQ_LINE:
            lines[i:i] = [CRED_NOTE] + cred + ["\n", '  <div class="spacer"></div>\n', "\n"]
            break
    else:
        fail("could not find the FAQ comment to insert the credentials band above")

    return lines


def process(path, home):
    src = open(path, encoding="utf-8").read()
    orig = src

    # 1. the floating CTA badge, on every page. The home page's badge sits inside
    #    a long band comment (rewritten in step 2); the service pages carry their
    #    own short comment directly above the span, so it goes with the span.
    re_badge = BADGE_RE if home else SERVICE_BADGE_RE
    n = len(re_badge.findall(src))
    if n != 1:
        fail(f"{path}: {n} CTA badge block(s), expected 1")
    src = re_badge.sub(BADGE_NOTE, src, count=1)

    if home:
        # 2. the CTA band comment that still described the badge as present
        n = len(CTA_PARA_RE.findall(src))
        if n != 1:
            fail(f"{path}: {n} CTA badge paragraphs, expected 1")
        src = CTA_PARA_RE.sub(CTA_PARA_NEW, src, count=1)

        # 3. the invisible step numerals
        n = src.count(NUMERAL_OLD)
        if n != 4:
            fail(f"{path}: {n} mist numerals, expected 4")
        src = src.replace(NUMERAL_OLD, NUMERAL_NEW)

        # 4-7. the hero: the oval, the arch, the Emergency card, the section order
        src = "".join(apply_home(src.splitlines(keepends=True)))

    if src == orig:
        fail(f"{path}: nothing changed")
    cr = src.count("\r")
    if cr:
        fail(f"{path}: {cr} CR bytes - line endings were mangled")
    if WRITE:
        with open(path, "w", encoding="utf-8", newline="\n") as fh:
            fh.write(src)
        print(f"wrote {path}  ({len(orig)} -> {len(src)} bytes)")
    else:
        print(f"would write {path}  ({len(orig)} -> {len(src)} bytes)")


def main():
    for name in ("HomePage.tsx", "ResidentialPage.tsx", "CommercialPage.tsx"):
        process(f"{ROOT}/{name}", home=(name == "HomePage.tsx"))


main()
