#!/usr/bin/env python3
"""Re-theme the two service pages and strip their hero pill rows.

WHY A SCRIPT RATHER THAN EDITS
The marketing pages are raw-HTML template literals, and the shared chrome is
duplicated per page rather than genuinely shared (see MEMORY.md). So every
change here has to land in more than one place, and a replacement whose needle
stops matching fails SILENTLY. This script asserts an exact match count for
every edit before it writes anything, so a miss aborts instead of half-applying.

`newline="\\n"` is load-bearing: without it `write_text` translates every `\\n`
to `os.linesep`, flipping the whole file LF -> CRLF on Windows. That is
invisible in a diff (`.gitattributes` normalises it) and shows up only as a
byte-count change. Verify afterwards by counting BYTES:
    tr -cd '\\r' < file | wc -c
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PAGES = ROOT / "src" / "marketing" / "pages"

# (page, label, exact old text, exact new text, expected occurrences)
EXACT = [
    # ── Residential ──────────────────────────────────────────────────────────
    ("ResidentialPage.tsx", "root gets the theme scope",
     'className="min-h-screen bg-white"',
     'className="min-h-screen bg-white page-residential"', 1),
    ("ResidentialPage.tsx", "hero slab -> residential primary",
     'scrim-hero relative bg-brand pad-140',
     'scrim-hero relative bg-residential pad-140', 1),
    ("ResidentialPage.tsx", "cta slab -> residential primary",
     'scrim-blue bg-img-cta pad-30 relative bg-brand',
     'scrim-blue bg-img-cta pad-30 relative bg-residential', 1),
    ("ResidentialPage.tsx", "header active pill -> residential primary",
     'rounded-[8px] bg-sky px-[15px]',
     'rounded-[8px] bg-residential px-[15px]', 1),
    # ── Commercial ───────────────────────────────────────────────────────────
    ("CommercialPage.tsx", "root gets the theme scope",
     'className="min-h-screen bg-white"',
     'className="min-h-screen bg-white page-commercial"', 1),
    ("CommercialPage.tsx", "hero slab -> commercial primary",
     'scrim-hero relative bg-brand pad-140',
     'scrim-hero relative bg-commercial pad-140', 1),
    ("CommercialPage.tsx", "cta slab -> commercial primary",
     'scrim-blue bg-img-cta pad-30 relative bg-brand',
     'scrim-blue bg-img-cta pad-30 relative bg-commercial', 1),
    ("CommercialPage.tsx", "header active pill -> commercial primary",
     'rounded-[8px] bg-sky px-[15px]',
     'rounded-[8px] bg-commercial px-[15px]', 1),
    ("CommercialPage.tsx", "hero kicker promoted",
     '<span class="eyebrow">Commercial &amp; facility services</span>',
     '<span class="hero-eyebrow">Commercial &amp; facility services</span>', 1),
]

# The hero proof-pill row: `<div class="mb-6 flex flex-wrap gap-2.5">` + one line
# of spans + `</div>`. Matched as a block because the span line is long and the
# pill text differs per page.
PILLS_RE = re.compile(
    r'[ \t]*<div class="mb-6 flex flex-wrap gap-2\.5">\n.*?\n[ \t]*</div>\n',
    re.S,
)

# page -> (replacement, expected match count)
PILL_EDITS = {
    "ResidentialPage.tsx": (
        '            <span class="hero-eyebrow">Residential &amp; home services</span>\n',
        1,
    ),
    "CommercialPage.tsx": (None, 1),  # removed outright; kicker carries the label
}


def main() -> int:
    failures: list[str] = []
    report: list[str] = []

    for page in sorted({e[0] for e in EXACT} | set(PILL_EDITS)):
        path = PAGES / page
        src = path.read_text(encoding="utf-8")
        original = src
        # Track failures PER PAGE: a miss on one file must not silently skip the
        # other, but it must also stop that file from being written half-edited.
        page_failures: list[str] = []
        page_report: list[str] = []

        for f_page, label, old, new, want in EXACT:
            if f_page != page:
                continue
            got = src.count(old)
            if got != want:
                page_failures.append(f"{page}: {label} — expected {want}, found {got}")
                continue
            src = src.replace(old, new)
            page_report.append(f"  {page:<22} {label}")

        repl, want = PILL_EDITS[page]
        matches = PILLS_RE.findall(src)
        if len(matches) != want:
            page_failures.append(
                f"{page}: hero pill row — expected {want} match(es), found {len(matches)}"
            )
        else:
            src = PILLS_RE.sub(repl if repl is not None else "", src, count=want)
            page_report.append(
                f"  {page:<22} hero pill row -> "
                + ("hero-eyebrow" if repl else "removed")
            )

        if page_failures:
            failures.extend(page_failures)
            continue
        if src == original:
            failures.append(f"{page}: no change produced")
            continue
        path.write_text(src, encoding="utf-8", newline="\n")
        report.extend(page_report)

    print("applied:")
    print("\n".join(report) if report else "  (nothing)")
    if failures:
        print("\nFAILURES (the affected file was NOT written):", file=sys.stderr)
        for f in failures:
            print("  " + f, file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
