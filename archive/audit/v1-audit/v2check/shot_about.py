"""Element screenshots of a selector at several widths.

Usage:  python shot_about.py "#about" 1440,1024 about
"""
import sys
from playwright.sync_api import sync_playwright

URL = "file:///C:/tmp/indigo/valvoro-prototype/index.html"


def main():
    sel = sys.argv[1]
    widths = [int(x) for x in sys.argv[2].split(",")]
    tag = sys.argv[3]
    with sync_playwright() as p:
        b = p.chromium.launch()
        for w in widths:
            pg = b.new_page(viewport={"width": w, "height": 1000})
            pg.goto(URL, wait_until="load", timeout=60000)
            pg.wait_for_timeout(2600)
            el = pg.query_selector(sel)
            if not el:
                print("no %s at %d" % (sel, w))
                continue
            path = "%s_%d.png" % (tag, w)
            el.screenshot(path=path)
            print("wrote", path)
            pg.close()
        b.close()


if __name__ == "__main__":
    main()
