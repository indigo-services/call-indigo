from playwright.sync_api import sync_playwright
import json

WIDTHS = [2560, 1920, 1600, 1440, 1280, 1024, 900, 768, 560, 390]

JS = """() => {
  const r = (el) => { if (!el) return null; const b = el.getBoundingClientRect();
    return {l: +b.left.toFixed(1), r: +b.right.toFixed(1), w: +b.width.toFixed(1)}; };
  const q = (s) => document.querySelector(s);
  const ribbonBar = q('.pill-topbar');
  const ribbonInner = ribbonBar ? ribbonBar.firstElementChild : null;
  const ribbonLast = ribbonBar ? ribbonBar.lastElementChild : null;
  const headerCard = q('.header-card');
  const brand = q('header a[href="#top"], header a[href="index.html"]');
  const hero = q('.slab');
  const heroShell = hero ? hero.querySelector(".hero-wrap") : null;
  const h1 = q('h1');
  return {
    ribbonBar: r(ribbonBar),
    ribbonFirstItem: r(ribbonInner),
    ribbonLastItem: r(ribbonLast),
    headerCard: r(headerCard),
    brand: r(brand),
    heroSlab: r(hero),
    heroShell: r(heroShell),
    h1: r(h1),
    padRl: getComputedStyle(q('.pad-rl')).paddingLeft,
    mbox: getComputedStyle(q('.mbox')).paddingLeft,
    shellW: getComputedStyle(q('.shell')).maxWidth,
  };
}"""

with sync_playwright() as p:
    b = p.chromium.launch()
    for w in WIDTHS:
        pg = b.new_page(viewport={"width": w, "height": 900})
        pg.goto("file:///C:/tmp/indigo/valvoro-prototype/index.html", wait_until="load", timeout=60000)
        pg.wait_for_timeout(2600)
        d = pg.evaluate(JS)
        rb, hs = d["ribbonBar"], d["heroSlab"]
        print("=== viewport %d === pad-rl=%s mbox=%s shell=%s" % (w, d["padRl"], d["mbox"], d["shellW"]))
        print("   ribbon bar   l=%-7s r=%-8s w=%s" % (rb["l"], rb["r"], rb["w"]))
        print("   ribbon text  l=%-7s (first item)   last=%s" % (d["ribbonFirstItem"]["l"], d["ribbonLastItem"]["r"]))
        print("   header card  l=%-7s r=%-8s w=%s" % (d["headerCard"]["l"], d["headerCard"]["r"], d["headerCard"]["w"]))
        print("   brand logo   l=%-7s" % d["brand"]["l"])
        print("   hero slab    l=%-7s r=%-8s w=%s" % (hs["l"], hs["r"], hs["w"]))
        print("   hero shell   l=%-7s r=%-8s w=%s" % (d["heroShell"]["l"], d["heroShell"]["r"], d["heroShell"]["w"]))
        print("   h1 text      l=%-7s" % d["h1"]["l"])
        print("   DELTA ribbon-bar vs slab: %.1f left, %.1f right" % (rb["l"] - hs["l"], hs["r"] - rb["r"]))
        print("   DELTA h1 vs slab edge  : %.1f" % (d["h1"]["l"] - hs["l"]))
        pg.close()
    b.close()
