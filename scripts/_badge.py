#!/usr/bin/env python3
"""
Replace the template's example logo watermark (`logo-vector.png`, the cyan glyph
that reads as a "P") with the client's official round phone-receiver badge.

WHY
`logo-vector.png` is the template's demo logo. It was never the client's mark, and
on all three CTA bands it renders as a large cyan "P" overlapping the photo. The
official lockup already exists in this repo and is used on 12 other surfaces: a
`rounded-full` disc carrying the lucide `phone` glyph at the client's 20-in-p-2
ratio (glyph = 20/36 = 0.5556 of the disc diameter).

WHICH VARIANT
The badge sits ~75% over the CTA photo and ~25% over the dark band. Brand rule for
dark surfaces (drawer `bg-ink`, footer `bg-ink-2`) is a WHITE disc with a `#1e1b4b`
glyph; light surfaces take the inverse. Both are built here so the choice can be
made by looking rather than by arguing.

Sizing: the template drew its watermark at 110px, so the disc stays 110px and the
glyph follows the lockup ratio -> 110 * (20/36) = 61.11 -> `size-[61px]`.

Assertions are per-file and abort that file's write on a count mismatch, so a
needle that stops matching fails loudly instead of silently skipping.
"""

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

PHONE_PATH = (
    "M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 "
    "2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 "
    "1.233 14 14 0 0 0 6.392 6.384"
)

NEEDLE = (
    '<img src="/assets/images/logo-vector.png" alt="" aria-hidden="true" '
    'class="absolute -right-7 top-1/2 hidden w-[110px] -translate-y-1/2 lg:block">'
)


def badge(disc_bg: str, glyph_color: str) -> str:
    return (
        f'<span class="absolute -right-7 top-1/2 hidden size-[110px] -translate-y-1/2 '
        f'items-center justify-center rounded-full {disc_bg} lg:flex">'
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" '
        f'stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" '
        f'class="size-[61px] {glyph_color}" aria-hidden="true">'
        f'<path d="{PHONE_PATH}"/></svg></span>'
    )


VARIANTS = {
    # Mirrors the header lockup (navy disc, white glyph) - reads against the photo.
    "navy": badge("bg-[#1e1b4b]", "text-white"),
    # Mirrors the drawer/footer lockup (white disc, navy glyph) - the documented
    # dark-surface inversion.
    "white": badge("bg-white", "text-[#1e1b4b]"),
}

# HomePage also carries a comment describing the watermark it used to draw.
# NOTE the `\`` escapes: these comments live inside a JS template literal, so the
# backticks in the source are backslash-escaped. A plain-backtick needle matches
# nothing and the per-file assertion below is what caught that.
COMMENT_OLD = (
    "a \\`br-40\\` card with a circular \\`logo-vector\\` overlapping its right\n       edge"
)
COMMENT_NEW = (
    "a \\`br-40\\` card with a circular badge overlapping its\n"
    "       right edge. The badge is the client's official lockup (lucide \\`phone\\` in a\n"
    "       \\`rounded-full\\` disc), not the template's demo \\`logo-vector.png\\` - that\n"
    "       asset drew a large cyan glyph that read as a \"P\" over the photo."
)

TARGETS = [
    "src/marketing/pages/HomePage.tsx",
    "src/marketing/pages/ResidentialPage.tsx",
    "src/marketing/pages/CommercialPage.tsx",
]


def main() -> int:
    variant = sys.argv[1] if len(sys.argv) > 1 else "navy"
    if variant not in VARIANTS:
        print(f"unknown variant {variant!r}; expected one of {sorted(VARIANTS)}")
        return 2
    replacement = VARIANTS[variant]

    failed = 0
    for rel in TARGETS:
        path = ROOT / rel
        text = path.read_text(encoding="utf-8")

        # Per-file failure tracking. A list shared across files would let page 1's
        # miss silently short-circuit page 2's write.
        problems = []
        if text.count(NEEDLE) != 1:
            problems.append(f"needle x{text.count(NEEDLE)} (expected 1)")
        if rel.endswith("HomePage.tsx") and text.count(COMMENT_OLD) != 1:
            problems.append(f"comment x{text.count(COMMENT_OLD)} (expected 1)")

        if problems:
            print(f"  SKIP  {rel}: " + "; ".join(problems))
            failed += 1
            continue

        text = text.replace(NEEDLE, replacement)
        if rel.endswith("HomePage.tsx"):
            text = text.replace(COMMENT_OLD, COMMENT_NEW)
        # newline="\n" is load-bearing: the default translates \n to os.linesep,
        # which flips the whole file LF -> CRLF and .gitattributes hides it.
        path.write_text(text, encoding="utf-8", newline="\n")
        print(f"  ok    {rel}  ({variant} disc)")

    print(f"\n{len(TARGETS) - failed}/{len(TARGETS)} files rewritten")
    return 1 if failed else 0


if __name__ == "__main__":
    raise SystemExit(main())
