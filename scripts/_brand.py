"""Swap every marketing brand lockup for the client's new icon + wordmark.

STATUS: applied 2026-09-20. The patterns below no longer match, so this script
is a one-shot migration record, not a re-runnable task. Re-running it is a
no-op that reports 0 replacements.

The lockup appears twelve times — header / drawer / footer, each in
`chrome-markup.ts` (which serves `/contact`) and inline on the three mirror
pages. So each pattern matches exactly ONCE PER FILE (1 × 4 = 4 repo-wide);
the expectation is per-file, which is what `expect` below encodes.

Design notes:
  · The client's snippet carried `lucide lucide-phone` on the svg. Those are
    Lucide's marker classes, not Tailwind utilities, and the stylesheet-coverage
    check rejects any class the compiled CSS does not emit — so they are dropped.
  · `width`/`height` attributes size the icon; no `size-*` utility is needed.
  · On the dark drawer and footer, `#1e1b4b` on `bg-ink` / `bg-ink-2` is
    invisible, so the lockup inverts: white disc, navy glyph, white wordmark.
  · The header badge shrinks on mobile, because the header row now also carries
    the phone number and the burger.
"""
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
TARGETS = [
    ROOT / "src" / "marketing" / "chrome-markup.ts",
    ROOT / "src" / "marketing" / "pages" / "HomePage.tsx",
    ROOT / "src" / "marketing" / "pages" / "ResidentialPage.tsx",
    ROOT / "src" / "marketing" / "pages" / "CommercialPage.tsx",
]

PHONE_PATH = (
    "M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 "
    "2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 "
    "1.233 14 14 0 0 0 6.392 6.384"
)


def icon(extra_class):
    return (
        '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" '
        'stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" '
        'class="' + extra_class + '" aria-hidden="true">'
        '<path d="' + PHONE_PATH + '"></path></svg>'
    )


def badge(bg, glyph, pad):
    return '<div class="shrink-0 rounded-full ' + bg + " " + pad + '">' + icon(glyph) + "</div>"


# Header — light background. The badge steps down on mobile.
HEADER = (
    badge("bg-[#1e1b4b]", "text-white max-md:size-[18px]", "p-2 max-md:p-1.5")
    + r"\1"
    + '<span class="font-sans text-[22px] font-bold leading-none tracking-[-0.06em] '
    'text-[#1e1b4b] max-md:text-[19px] xl:text-[24px]">Call Indigo</span>'
)

# Drawer — dark `bg-ink`. Inverted lockup.
DRAWER = (
    badge("bg-white", "text-[#1e1b4b]", "p-2")
    + r"\1"
    + '<span class="font-sans text-[22px] font-bold leading-none tracking-[-0.06em] text-white">'
    "Call Indigo</span>"
)

# Footer — dark `bg-ink-2`. Same inversion, one step larger.
FOOTER = (
    badge("bg-white", "text-[#1e1b4b]", "p-2")
    + r"\1"
    + '<span class="font-sans text-[23px] font-bold leading-none tracking-[-0.06em] text-white">'
    "Call Indigo</span>"
)

PATTERNS = [
    (
        "header lockup",
        re.compile(
            r'<img src="/assets/images/call-indigo-mark\.svg" alt="Call Indigo logo"[^>]*>'
            r"(\s*)<span class=\"[^\"]*\">Call Indigo</span>"
        ),
        HEADER,
        1,
    ),
    (
        "drawer lockup",
        re.compile(
            r'<img src="/assets/images/call-indigo-mark-dark\.svg" alt="Call Indigo logo" '
            r'class="size-11 w-auto">(\s*)<span class="[^"]*">Call Indigo</span>'
        ),
        DRAWER,
        1,
    ),
    (
        "footer lockup",
        re.compile(
            r'<img src="/assets/images/call-indigo-mark-dark\.svg" alt="Call Indigo logo" '
            r'class="size-12 w-auto">(\s*)<span class="[^"]*">Call Indigo</span>'
        ),
        FOOTER,
        1,
    ),
]

failures = []
for path in TARGETS:
    src = path.read_text(encoding="utf-8")
    total = 0
    for name, pattern, repl, expect in PATTERNS:
        src, n = pattern.subn(repl, src)
        if n != expect:
            failures.append("%s: %s — expected %d, found %d" % (path.name, name, expect, n))
        total += n
    # `newline="\n"` is load-bearing. Without it, `write_text` translates every
    # `\n` to `os.linesep` on Windows, so the whole file flips LF -> CRLF and a
    # 6-line change shows up as a whole-file rewrite to anything that is not
    # honouring `.gitattributes`. Measured on the first run: 4 files, 2892 lines.
    path.write_text(src, encoding="utf-8", newline="\n")
    print("%-24s %d lockups replaced" % (path.name, total))

for f in failures:
    print("  FAIL " + f)
sys.exit(1 if failures else 0)
