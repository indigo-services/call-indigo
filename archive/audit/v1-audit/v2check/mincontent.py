"""Report the min-content width of a selector and each of its children.

Usage:  python mincontent.py "#area .text-center" 390
"""
import sys
from playwright.sync_api import sync_playwright

URL = "file:///C:/tmp/indigo/valvoro-prototype/index.html"

JS = r"""(sel) => {
  const el = document.querySelector(sel);
  if (!el) return null;
  const probe = (n) => {
    const s = n.style;
    const prev = { w: s.width, pos: s.position, d: s.display };
    s.position = 'absolute';
    s.width = 'min-content';
    const w = n.getBoundingClientRect().width;
    s.width = prev.w; s.position = prev.pos; s.display = prev.d;
    return +w.toFixed(1);
  };
  const out = [{ label: 'SELF', w: probe(el) }];
  [...el.children].forEach((k, i) => {
    out.push({
      label: i + ' <' + k.tagName.toLowerCase() + '> .' + String(k.className || '').slice(0, 34),
      w: probe(k),
      text: (k.textContent || '').trim().slice(0, 44),
    });
  });
  return out;
}"""


def main():
    sel = sys.argv[1]
    w = int(sys.argv[2]) if len(sys.argv) > 2 else 390
    with sync_playwright() as p:
        b = p.chromium.launch()
        pg = b.new_page(viewport={"width": w, "height": 1000})
        pg.goto(URL, wait_until="load", timeout=60000)
        pg.wait_for_timeout(2600)
        for row in pg.evaluate(JS, sel):
            print("  min-content %8.1f  %-48s %s" % (row["w"], row["label"], row.get("text", "")))
        pg.close()
        b.close()


if __name__ == "__main__":
    main()
