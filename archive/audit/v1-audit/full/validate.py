from playwright.sync_api import sync_playwright
import json, pathlib

URL = pathlib.Path(r"C:/tmp/indigo/valvoro-prototype/index.html").as_uri()

MEASURE = """
() => {
  const out = {};
  const r = el => { const b = el.getBoundingClientRect();
                    return {x:Math.round(b.x*10)/10, y:Math.round(b.y*10)/10,
                            w:Math.round(b.width*10)/10, h:Math.round(b.height*10)/10}; };
  // every band
  out.bands = [...document.querySelectorAll('.slab')].map(el => {
    const cs = getComputedStyle(el);
    return { id: el.id || el.tagName.toLowerCase(),
             ...r(el), radius: cs.borderRadius, bg: cs.backgroundColor,
             bgimg: cs.backgroundImage.slice(0, 60) };
  });
  const tb = document.querySelector('.pill-topbar');
  out.topbar = tb ? r(tb) : null;
  const hc = document.querySelector('.header-card');
  out.headerCard = hc ? r(hc) : null;
  const shell = document.querySelector('#services .shell');
  out.servicesShell = shell ? r(shell) : null;
  const h2 = document.querySelector('#about h2');
  out.aboutH2 = h2 ? { ...r(h2), font: getComputedStyle(h2).fontSize + '/' + getComputedStyle(h2).lineHeight,
                       color: getComputedStyle(h2).color } : null;
  const eb = document.querySelector('#about .eyebrow');
  out.aboutEyebrow = eb ? { ...r(eb), font: getComputedStyle(eb).fontSize,
                            color: getComputedStyle(eb).color,
                            transform: getComputedStyle(eb).textTransform } : null;
  out.docW = document.documentElement.scrollWidth;
  out.winW = window.innerWidth;
  out.docH = document.documentElement.scrollHeight;
  out.overflow = [...document.querySelectorAll('body *')]
      .filter(e => e.getBoundingClientRect().right > window.innerWidth + 1.5)
      .slice(0, 12)
      .map(e => (e.tagName + '.' + (e.className && e.className.baseVal !== undefined
            ? e.className.baseVal : String(e.className || ''))).slice(0, 80)
            + ' @' + Math.round(e.getBoundingClientRect().right));
  out.imgs = [...document.images].filter(i => !i.complete || i.naturalWidth === 0)
      .map(i => i.getAttribute('src'));
  return out;
}
"""

with sync_playwright() as p:
    b = p.chromium.launch()
    for W in (1920, 1440, 1280, 1024, 768, 390):
        pg = b.new_page(viewport={"width": W, "height": 900})
        errs = []
        pg.on("console", lambda m: errs.append(m.type + ": " + m.text) if m.type == "error" else None)
        pg.on("pageerror", lambda e: errs.append("pageerror: " + str(e)))
        pg.goto(URL, wait_until="load")
        pg.wait_for_timeout(1400)
        pg.evaluate("()=>{document.querySelectorAll('.reveal').forEach(e=>e.classList.add('visible'));}")
        pg.wait_for_timeout(250)
        m = pg.evaluate(MEASURE)
        print(f"\n================ viewport {W} ================")
        print(f"docW {m['docW']} winW {m['winW']} docH {m['docH']}"
              f"  horizontal-overflow: {'YES' if m['docW'] > m['winW'] + 1 else 'no'}")
        if W == 1920:
            print(" topbar      ", m["topbar"])
            print(" headerCard  ", m["headerCard"])
            print(" servicesShell", m["servicesShell"])
            print(" aboutH2     ", m["aboutH2"])
            print(" aboutEyebrow", m["aboutEyebrow"])
            print(" bands:")
            for bd in m["bands"]:
                print(f"   {bd['id']:10s} x={bd['x']:7.1f} w={bd['w']:7.1f} h={bd['h']:7.1f} "
                      f"r={bd['radius']:10s} bg={bd['bg']:22s} {bd['bgimg']}")
        if m["overflow"]:
            print(" OVERFLOWING:", m["overflow"])
        if m["imgs"]:
            print(" BROKEN IMAGES:", m["imgs"])
        if errs:
            print(" CONSOLE:", errs[:6])
        else:
            print(" console: clean")
        pg.close()
    b.close()
