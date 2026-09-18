"""Render the prototype and the real template side by side for comparison.

Outputs:
  _audit/cmp_proto_<vw>.png   prototype
  _audit/cmp_real_<vw>.png    real template (hero crop)
plus a geometry dump for the prototype so drift is measurable, not eyeballed.
"""
from playwright.sync_api import sync_playwright
import json, pathlib, sys

CHROME = (r"C:\Users\jaden.black\AppData\Local\ms-playwright"
          r"\chromium-1243\chrome-win64\chrome.exe")
PROTO = pathlib.Path(r"C:\tmp\indigo\valvoro-prototype\index.html").resolve().as_uri()
REAL  = pathlib.Path(r"C:\tmp\indigo\_audit\vlv\index.html").resolve().as_uri()
OUT   = pathlib.Path(r"C:\tmp\indigo\_audit")

JS = """() => {
  const q = s => document.querySelector(s);
  const R = e => { if(!e) return null; const r = e.getBoundingClientRect();
    return {x:+r.x.toFixed(1), y:+r.y.toFixed(1), w:+r.width.toFixed(1), h:+r.height.toFixed(1)}; };
  const R2 = e => {                 // element box without transparent padding
    if(!e) return null; const r = e.getBoundingClientRect();
    const cs = getComputedStyle(e);
    const pl=parseFloat(cs.paddingLeft)||0, pr=parseFloat(cs.paddingRight)||0;
    const bl=parseFloat(cs.borderLeftWidth)||0, br=parseFloat(cs.borderRightWidth)||0;
    return {w:+(r.width-pl-pr-bl-br).toFixed(1)};
  };
  const hero = q('section') ;
  const card = q('.rounded-card') || q('.shell > div');
  return {
    card:      R(card),
    archImg:   R(q('.banner-img1 img')),
    plumber:   R(q('.plumber-img')),
    navyBox:   R(q('.navy-box') || q('[href^="tel:"]')),
    oval:      R(q('.banner-img2 img')),
    h1:        R(q('h1')),
    lead:      R(q('.banner-lead')),
    stats:     R(q('.statistics-wrapper') || q('.inner-wrap .flex.items-center')),
    scroll:    R(q('.scrol-outer')),
    dots:      R(q('.dot-img')),
    docW: document.documentElement.scrollWidth,
    winW: window.innerWidth,
  };
}"""


def shot(pw, url, vw, out, full=False):
    b = pw.chromium.launch(executable_path=CHROME,
                           args=["--no-sandbox", "--disable-dev-shm-usage"])
    pg = b.new_page(viewport={"width": vw, "height": 1100}, device_scale_factor=1)
    pg.goto(url, wait_until="load")
    pg.wait_for_timeout(2400)
    # freeze animations so screenshots are deterministic
    pg.add_style_tag(content="*{animation-play-state:paused !important;transition:none !important}")
    pg.wait_for_timeout(300)
    d = pg.evaluate(JS)
    pg.screenshot(path=str(out), full_page=full, clip=None if full else {"x":0,"y":0,"width":vw,"height":1100})
    b.close()
    return d


with sync_playwright() as pw:
    for vw in (int(a) for a in (sys.argv[1:] or ["1440"])):
        dp = shot(pw, PROTO, vw, OUT / f"cmp_proto_{vw}.png")
        dr = shot(pw, REAL,  vw, OUT / f"cmp_real_{vw}.png")
        print(f"\n===== viewport {vw} =====")
        print(f"{'element':12s} {'PROTOTYPE':>28s}   {'REAL TEMPLATE':>28s}")
        for k in ("card", "h1", "archImg", "plumber", "navyBox", "oval",
                  "lead", "stats", "scroll", "dots"):
            a, b_ = dp.get(k), dr.get(k)
            fa = f"{a['w']:.0f} x {a['h']:.0f} @({a['x']:.0f},{a['y']:.0f})" if a and a['w'] else "—"
            fb = f"{b_['w']:.0f} x {b_['h']:.0f} @({b_['x']:.0f},{b_['y']:.0f})" if b_ and b_['w'] else "—"
            flag = ""
            if a and b_ and a['w'] and b_['w']:
                ratio = a['w'] / b_['w']
                if ratio < 0.85 or ratio > 1.18:
                    flag = f"  <<< width off by {ratio:.2f}x"
            print(f"{k:12s} {fa:>28s}   {fb:>28s}{flag}")
        print(f"  docW proto={dp['docW']} winW={dp['winW']}"
              f"   |  docW real={dr['docW']} winW={dr['winW']}")
