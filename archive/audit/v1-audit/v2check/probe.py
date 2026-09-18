"""Print a selector's box and its children's boxes at one width.

Usage:  python probe.py "#area .text-center" 390
"""
import sys
from playwright.sync_api import sync_playwright

URL = "file:///C:/tmp/indigo/valvoro-prototype/index.html"

JS = r"""(sel) => {
  const el = document.querySelector(sel);
  if (!el) return null;
  const gcs = getComputedStyle;
  const box = (n) => {
    const b = n.getBoundingClientRect();
    const c = gcs(n);
    return {
      tag: n.tagName.toLowerCase(),
      cls: String(n.className || '').slice(0, 46),
      l: +b.left.toFixed(1), r: +b.right.toFixed(1), w: +b.width.toFixed(1),
      sw: n.scrollWidth, cw: n.clientWidth,
      minW: c.minWidth, padL: c.paddingLeft, padR: c.paddingRight,
    };
  };
  const self = box(el);
  const kids = [...el.children].map((k) => {
    const o = box(k);
    o.kids = [...k.children].map(box);
    return o;
  });
  return { self, kids };
}"""


def main():
    sel = sys.argv[1]
    w = int(sys.argv[2]) if len(sys.argv) > 2 else 390
    with sync_playwright() as p:
        b = p.chromium.launch()
        pg = b.new_page(viewport={"width": w, "height": 1000})
        pg.goto(URL, wait_until="load", timeout=60000)
        pg.wait_for_timeout(2600)
        d = pg.evaluate(JS, sel)
        if not d:
            print("no match for", sel)
            return
        s = d["self"]
        print("%-4s %-48s l=%-8.1f r=%-8.1f w=%-8.1f scrollW=%-6d clientW=%-6d minW=%s"
              % (s["tag"], "." + s["cls"], s["l"], s["r"], s["w"], s["sw"], s["cw"], s["minW"]))
        for k in d["kids"]:
            print("  %-4s %-46s l=%-8.1f r=%-8.1f w=%-8.1f scrollW=%-6d clientW=%-6d minW=%s"
                  % (k["tag"], "." + k["cls"], k["l"], k["r"], k["w"], k["sw"], k["cw"], k["minW"]))
            for g in k.get("kids", []):
                print("      %-4s %-42s l=%-8.1f r=%-8.1f w=%-8.1f minW=%s"
                      % (g["tag"], "." + g["cls"], g["l"], g["r"], g["w"], g["minW"]))
        pg.close()
        b.close()


if __name__ == "__main__":
    main()
