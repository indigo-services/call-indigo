from playwright.sync_api import sync_playwright
import pathlib, json

URL = pathlib.Path(r"C:/tmp/indigo/valvoro-prototype/index.html").as_uri()

JS = """
() => {
  const bc = document.querySelector('.banner-col');
  const chain = [];
  let e = bc;
  while (e && e.tagName !== 'BODY') {
    const cs = getComputedStyle(e);
    const b = e.getBoundingClientRect();
    chain.push({
      tag: e.tagName.toLowerCase(),
      cls: String(e.className || '').slice(0, 70),
      display: cs.display,
      position: cs.position,
      gtc: cs.gridTemplateColumns.slice(0, 60),
      rect: [Math.round(b.x), Math.round(b.y), Math.round(b.width), Math.round(b.height)]
    });
    e = e.parentElement;
  }
  const ic = document.querySelector('.banner-content-con');
  const icb = ic.getBoundingClientRect();
  return {
    chain,
    innerContent: [Math.round(icb.x), Math.round(icb.y), Math.round(icb.width), Math.round(icb.height)],
    innerContentChildren: [...ic.children].map(c => c.tagName.toLowerCase() + '.' + String(c.className||'').slice(0,40)),
    bannerColParentCls: bc.parentElement.className,
    innerChildrenCount: ic.children.length,
  };
}
"""

with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={"width": 1920, "height": 900})
    pg.goto(URL, wait_until="load")
    pg.wait_for_timeout(1300)
    m = pg.evaluate(JS)
    b.close()

print("ANCESTOR CHAIN of .banner-col (innermost first):")
for i, n in enumerate(m["chain"]):
    print(f"  {'  '*i}{n['tag']:6s} .{n['cls'][:55]:55s} display={n['display']:12s} pos={n['position']:9s} rect={n['rect']}")
    if n['gtc'] and n['gtc'] != 'none':
        print(f"  {'  '*i}      grid-template-columns: {n['gtc']}")
print()
print("banner-col parent class:", m["bannerColParentCls"])
print("banner-content-con rect:", m["innerContent"])
print("banner-content-con children:", m["innerContentChildren"])
print("banner-content-con child count:", m["innerChildrenCount"])
