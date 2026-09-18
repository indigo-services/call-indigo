# Keeps css/tw.css in sync with the design system that actually ships.
#
# WHY THIS EXISTS. `css/tw.css` is documented in index.html as "the same tokens for
# CLI/Vite builds", but it had drifted into being WRONG rather than merely stale:
# its `.shell` was `w-[94%] max-w-[1220px]` while index.html ships the token-driven
# `--col: 1417px` model, its palette was the first-pass sampling
# (#4a5ea3 / #7ec1e9 / #0b1228) rather than the template-derived one, and the whole
# frame model plus the legal-modal CSS were absent. A mirror that disagrees with the
# thing it mirrors is worse than no mirror, because it is trusted.
#
# Two hand-maintained copies is the actual defect, so tw.css is now GENERATED from
# index.html's inline <style type="text/tailwindcss"> block — the one the browser
# build actually renders — and `--check` fails loudly on any drift.
#
#   python sync_tw.py            regenerate css/tw.css
#   python sync_tw.py --check    assert it matches; exit 1 and diff if not
#
# verify.py calls `--check` so drift fails the gate instead of being discovered later.
#
# TO PROVE THE MIRROR ACTUALLY COMPILES (needs network for the first install):
#   mkdir -p _audit/v2check/twtest && cd _audit/v2check/twtest
#   npm init -y && npm i tailwindcss@4 @tailwindcss/cli@4
#   cp ../../valvoro-prototype/css/tw.css .
#   ./node_modules/.bin/tailwindcss -i tw.css -o out.css \
#       --content "../../valvoro-prototype/index.html"
#
# Verified 2026-09-18 against tailwindcss v4.3.3: "Done in 87ms", 325 rules, no
# warnings, and .shell / .pad-rl / .mbox / .band / .slab / .pill-topbar / .spacer /
# .legal-sheet / .legal-bar / .legal-x / .legal-close / .legal-link all emitted with
# --gut and --col resolved. Remove node_modules afterwards; it is a throwaway.
import pathlib, re, sys, difflib

BASE = pathlib.Path("C:/tmp/indigo/valvoro-prototype")
SRC = BASE / "index.html"
TW = BASE / "css" / "tw.css"
PAGES = ["index.html", "residential.html", "commercial.html"]

STYLE_OPEN = '<style type="text/tailwindcss">'

HEADER = '''/* ============================================================================
   GENERATED FILE — DO NOT EDIT BY HAND.

   Source of truth: the inline `<style type="text/tailwindcss">` block in
   index.html, which is what the Tailwind browser build actually renders.
   residential.html and commercial.html carry a byte-identical copy of that
   block, produced by gen_pages.py, so index.html is the only file to edit.

     regenerate:  python _audit/v2check/sync_tw.py
     check:       python _audit/v2check/sync_tw.py --check

   The browser build injects Tailwind itself, so the `@import` below exists only
   for CLI / Vite builds. It must stay at the top of the file.
   ============================================================================ */
'''


def inline_block(path):
    """The raw contents of the page's inline Tailwind style block."""
    text = path.read_text(encoding="utf-8")
    i = text.index(STYLE_OPEN) + len(STYLE_OPEN)
    j = text.index("</style>", i)
    return text[i:j]


def build():
    raw = inline_block(SRC)
    # Drop the leading banner comment — the generated header replaces it.
    body = re.sub(r"^\s*/\*.*?\*/", "", raw, count=1, flags=re.S).strip("\n")
    assert body.startswith("@theme {"), "unexpected inline block start: %r" % body[:60]
    return HEADER + '\n@import "tailwindcss";\n\n' + body.rstrip() + "\n"


def main():
    # --- the three pages must already agree, or index.html is not the source ---
    blocks = {p: inline_block(BASE / p) for p in PAGES}
    ref = blocks["index.html"]
    for p in PAGES[1:]:
        if blocks[p] != ref:
            print("FATAL: %s's inline style block differs from index.html's." % p)
            print("       Run gen_pages.py first — it is what keeps them identical.")
            return 1
    print("inline block identical across all 3 pages (%d bytes)" % len(ref.encode()))

    want = build()
    have = TW.read_text(encoding="utf-8") if TW.exists() else None

    if "--check" in sys.argv:
        if have == want:
            print("css/tw.css IN SYNC with index.html (%d bytes)" % len(want.encode()))
            return 0
        print("css/tw.css HAS DRIFTED from index.html")
        if have is None:
            print("  (file does not exist)")
        else:
            diff = list(difflib.unified_diff(have.splitlines(), want.splitlines(),
                                             "css/tw.css (on disk)", "css/tw.css (expected)",
                                             lineterm="", n=1))
            print("  %d diff lines; first 40:" % len(diff))
            for line in diff[:40]:
                print("   ", line)
        return 1

    TW.parent.mkdir(parents=True, exist_ok=True)
    TW.write_text(want, encoding="utf-8", newline="\n")
    print("wrote css/tw.css  %d -> %d bytes"
          % (len(have.encode()) if have else 0, len(want.encode())))
    print("  .shell           : %s" % ("token-driven --col" if "--col" in want else "STILL WRONG"))
    print("  frame model      : %s"
          % ("present" if ".pad-rl" in want and ".band" in want else "MISSING"))
    print("  legal modals     : %s" % ("present" if ".legal-sheet" in want else "MISSING"))
    print("  template palette : %s" % ("yes" if "#2a5aa2" in want else "NO"))
    return 0


if __name__ == "__main__":
    sys.exit(main())
