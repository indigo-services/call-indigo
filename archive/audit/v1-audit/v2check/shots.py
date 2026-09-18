"""Capture the top of the page and the full page at several widths.

Usage:  python shots.py after 1920,1440,390
"""
import os
import sys
from playwright.sync_api import sync_playwright

PAGE = os.environ.get("PAGE", "index.html")
URL = "file:///C:/tmp/indigo/valvoro-prototype/" + PAGE


def main():
    tag = sys.argv[1]
    widths = [int(x) for x in sys.argv[2].split(",")]
    with sync_playwright() as p:
        b = p.chromium.launch()
        for w in widths:
            pg = b.new_page(viewport={"width": w, "height": 900})
            pg.goto(URL, wait_until="load", timeout=60000)
            pg.wait_for_timeout(2800)
            top = "%s_%d_top.png" % (tag, w)
            pg.screenshot(path=top, clip={"x": 0, "y": 0, "width": w, "height": 760})
            print("wrote", top)
            full = "%s_%d_full.png" % (tag, w)
            pg.screenshot(path=full, full_page=True)
            print("wrote", full)
            pg.close()
        b.close()


if __name__ == "__main__":
    main()
