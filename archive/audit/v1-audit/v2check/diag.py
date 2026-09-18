"""Frame-model diagnostic.

Prints, per viewport:
  * the border box and the CONTENT box (border box +/- padding) of every
    structural landmark -- ribbon bar, header card, each section slab and its
    content column;
  * any element that spills past its SECTION's content box by more than 2px.
    That is how a real overflow hides behind `body { overflow-x: hidden }`:
    documentElement.scrollWidth stays at the viewport width, so a naive
    overflow check reports 0 while content is visibly sitting on top of a
    neighbouring column.

Usage:  python diag.py [label]
        W=1920,1440 python diag.py [label]
"""
import os
import sys
from playwright.sync_api import sync_playwright

PAGE = os.environ.get("PAGE", "index.html")
URL = "file:///C:/tmp/indigo/valvoro-prototype/" + PAGE
WIDTHS = [int(x) for x in os.environ.get(
    "W", "1920,1600,1440,1280,1024,768,390").split(",")]

JS = r"""() => {
  const q = (s) => document.querySelector(s);
  const gcs = (el) => getComputedStyle(el);
  const out = { rows: [], overflow: [] };

  const targets = [
    ['ribbonBar',  '.pill-topbar'],
    ['ribbonTxt',  '.pill-topbar .shell'],
    ['headerCard', '.header-card'],
    ['brand',      'header .header-card a[href="#top"]'],
    ['heroSlab',   'section.hero-card'],
    ['heroCol',    '.hero-wrap'],
    ['h1',         'h1'],
    ['services',   '#services'],
    ['svcCol',     '#services .shell'],
    ['band',       '.band'],
    ['bandCol',    '.band .shell'],
    ['about',      '#about'],
    ['aboutCol',   '#about > .grid'],
    ['aboutPhoto', '#about .grid > div:first-child'],
    ['aboutFig1',  '#about .grid figure'],
    ['aboutFig2',  '#about .grid > div:first-child > div'],
    ['aboutCol2',  '#about .grid > div:nth-child(2)'],
    ['faq',        '#faq'],
    ['faqCol',     '#faq .shell'],
    ['area',       '#area'],
    ['areaCol',    '#area .slab-body'],
    ['contact',    '#contact'],
    ['ctcCol',     '#contact .slab-body'],
    ['footer',     'footer.slab'],
    ['footCol',    'footer.slab .shell'],
  ];

  for (const [name, sel] of targets) {
    const el = q(sel);
    if (!el) { out.rows.push({ name, sel, missing: true }); continue; }
    const b = el.getBoundingClientRect();
    const c = gcs(el);
    const pl = parseFloat(c.paddingLeft) || 0;
    const pr = parseFloat(c.paddingRight) || 0;
    out.rows.push({
      name, sel,
      l: +b.left.toFixed(1), r: +b.right.toFixed(1), w: +b.width.toFixed(1),
      cl: +(b.left + pl).toFixed(1), cr: +(b.right - pr).toFixed(1),
      pl: +pl.toFixed(1), pr: +pr.toFixed(1), maxW: c.maxWidth,
    });
  }

  // --- real overflow: a descendant spilling past its section's content box ---
  const secs = [...document.querySelectorAll('section, footer.slab')];
  for (const sec of secs) {
    const sc = gcs(sec);
    const b = sec.getBoundingClientRect();
    const L = b.left + (parseFloat(sc.paddingLeft) || 0);
    const R = b.right - (parseFloat(sc.paddingRight) || 0);
    const hits = [];
    for (const el of sec.querySelectorAll('*')) {
      const ec = gcs(el);
      if (ec.position === 'absolute' || ec.position === 'fixed') continue;
      if (ec.display === 'none' || ec.visibility === 'hidden') continue;
      const eb = el.getBoundingClientRect();
      if (eb.width < 1) continue;
      const over = Math.max(eb.right - R, L - eb.left);
      if (over > 2) hits.push({ el, over, eb });
    }
    for (const h of hits) {
      let anc = h.el.parentElement, nested = false;
      while (anc && anc !== sec) {
        if (hits.some((x) => x.el === anc)) { nested = true; break; }
        anc = anc.parentElement;
      }
      if (nested) continue;
      out.overflow.push({
        sec: sec.id || sec.tagName.toLowerCase(),
        tag: h.el.tagName.toLowerCase(),
        cls: String(h.el.className || '').slice(0, 42),
        over: +h.over.toFixed(1),
        rect: [+h.eb.left.toFixed(1), +h.eb.right.toFixed(1)],
        limit: [+L.toFixed(1), +R.toFixed(1)],
      });
    }
  }
  return out;
}"""


def main():
    label = sys.argv[1] if len(sys.argv) > 1 else "run"
    with sync_playwright() as p:
        b = p.chromium.launch()
        for w in WIDTHS:
            pg = b.new_page(viewport={"width": w, "height": 1000})
            pg.goto(URL, wait_until="load", timeout=60000)
            pg.wait_for_timeout(2500)
            d = pg.evaluate(JS)
            print("=" * 104)
            print("[%s] VIEWPORT %d" % (label, w))
            for row in d["rows"]:
                if row.get("missing"):
                    print("  %-11s MISSING  %s" % (row["name"], row["sel"]))
                    continue
                print("  %-11s edge=[%7.1f,%7.1f] w=%7.1f | text=[%7.1f,%7.1f] "
                      "| pl=%-5.1f pr=%-5.1f maxW=%s" % (
                          row["name"], row["l"], row["r"], row["w"],
                          row["cl"], row["cr"], row["pl"], row["pr"], row["maxW"]))
            if d["overflow"]:
                print("  !! content spilling past the section content box:")
                for o in sorted(d["overflow"], key=lambda x: -x["over"])[:10]:
                    print("     #%-10s %-6s over=%-7.1f rect=[%7.1f,%7.1f] "
                          "limit=[%7.1f,%7.1f]  .%s" % (
                              o["sec"], o["tag"], o["over"], o["rect"][0], o["rect"][1],
                              o["limit"][0], o["limit"][1], o["cls"]))
            else:
                print("  -- no content spilling past a section content box --")
            pg.close()
        b.close()


if __name__ == "__main__":
    main()
