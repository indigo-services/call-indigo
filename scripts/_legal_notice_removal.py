#!/usr/bin/env python3
"""Remove the "Sample language" notice from both legal dialogs.

CLIENT REQUEST (2026-09-22): drop the top "Sample Language" text box from the
Terms of Service and Privacy Policy dialogs.

WHY THIS NEEDS A SCRIPT RATHER THAN FOUR HAND EDITS

The legal copy is duplicated four times - `chrome-markup.ts` (which serves
/contact through the `chrome.ts` seam) plus an inline copy on each of the three
mirror pages - and `tests/verify.mjs` asserts the four copies are BYTE-IDENTICAL.
"Corrected one copy, missed the others" is the expected failure mode, so every
removal is counted per file and the script aborts if the count is not what was
declared. Same discipline as `_legal.py`, which did the earlier pass on this text.

NOTE FOR THE RECORD - this reverses a decision that was made deliberately.
`CHANGELOG.md` and `_legal.py` both record that the warning was KEPT on the
argument that "removing the warning would make unreviewed text look reviewed",
because the body of the policy is still placeholder copy the client could not
replace. The removal is the client's call and is applied as asked; the text
underneath is unchanged and is still unreviewed. Revisit when real legal copy
arrives.

`newline="\\n"` is required: without it `write_text` translates every `\\n` to
the platform separator and the whole file reads as a line-ending regression.
"""
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

# path -> how many notices must be found. Two per file: one in #legal-terms,
# one in #legal-privacy.
TARGETS = {
    "src/marketing/chrome-markup.ts": 2,
    "src/marketing/pages/HomePage.tsx": 2,
    "src/marketing/pages/ResidentialPage.tsx": 2,
    "src/marketing/pages/CommercialPage.tsx": 2,
}

# The whole <p class="legal-note">...</p>, which wraps across three lines. The
# leading newline is consumed so the blank line that separates it from the first
# <h3> survives; without that the dialogs lose their paragraph spacing.
NOTICE = re.compile(r'\n[ \t]*<p class="legal-note">.*?</p>', re.DOTALL)


def main() -> int:
    apply = "--apply" in sys.argv
    total = 0

    for rel, expected in TARGETS.items():
        path = ROOT / rel
        if not path.exists():
            print(f"FAIL {rel}: missing")
            return 1

        text = path.read_text(encoding="utf-8")
        found = len(NOTICE.findall(text))

        if found != expected:
            print(f"FAIL {rel}: found {found} notice(s), expected {expected}")
            return 1

        stripped = NOTICE.sub("", text)
        removed_lines = len(text.split("\n")) - len(stripped.split("\n"))
        total += found

        if apply:
            path.write_text(stripped, encoding="utf-8", newline="\n")
            print(f"ok   {rel}: removed {found} ({removed_lines} lines)")
        else:
            print(f"dry  {rel}: would remove {found} ({removed_lines} lines)")

    print(f"\n{'removed' if apply else 'would remove'} {total} notices across {len(TARGETS)} files")
    if not apply:
        print("re-run with --apply to write")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
