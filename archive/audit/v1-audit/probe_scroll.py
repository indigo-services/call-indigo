"""Measure the real Valvoro template: banner proportions + scroll-cue placement.

Ground truth for the prototype's hero. Run against the mirrored template at
_audit/vlv/index.html so nothing depends on network access.
"""
from playwright.sync_api import sync_playwright
import json, pathlib

CHROME = (r"C:\Users\jaden.black\AppData\Local\ms-playwright"
          r"\chromium-1243\chrome-win64\chrome.exe")
TEMPLATE = pathlib.Path(r"C:\tmp\indigo\_audit\vlv\index.html").resolve().as_uri()

JS = """() => {
  const q = s => document.querySelector(s);
  const R = e => {
    if (!e) return null;
    const r = e.getBoundingClientRect();
    return {x:+r.x.toFixed(1), y:+r.y.toFixed(1), w:+r.width.toFixed(1), h:+r.height.toFixed(1)};
  };
  const A = (e, base) => {           // rect relative to an ancestor
    if (!e) return null;
    const r = e.getBoundingClientRect(), b = base.getBoundingClientRect();
    return {x:+(r.x-b.x).toFixed(1), y:+(r.y-b.y).toFixed(1),
            w:+r.width.toFixed(1), h:+r.height.toFixed(1)};
  };
  const banner = q('.banner-con');
  const sc = q('.scrol-outer');
  return {
    banner:      R(banner),
    scrollAbs:   A(sc, banner),
    scrollArrow: R(q('.scroll-down-arrow')),
    scrollLabel: (q('.scrol-outer span') || {}).textContent,
    colLeft:     R(q('.banner-con .col-lg-6')),
    bannerContent: R(q('.banner-content-con')),
    bannerImgCon:  R(q('.banner-img-con')),
    bannerImg1:    R(q('.banner-img1')),
    bannerImg2:    R(q('.banner-img2')),
    plumberImg:    R(q('.plumber-img')),
    dotImg:        R(q('.dot-img')),
    navyBox:       R(q('.navy-box')),
    bannerBottom:  R(q('.banner-bottom')),
    innerWrap:     R(q('.inner-wrap')),
    ratingCon:     R(q('.rating-con')),
    h1:            R(q('h1')),
    navDisplay:    getComputedStyle(q('.navbar-collapse')).display,
    togglerDisplay:getComputedStyle(q('.navbar-toggler')).display,
  };
}"""

with sync_playwright() as pw:
    b = pw.chromium.launch(executable_path=CHROME,
                           args=["--no-sandbox", "--disable-dev-shm-usage"])
    for vw in (1440, 1200, 992, 960, 768):
        pg = b.new_page(viewport={"width": vw, "height": 1100},
                        device_scale_factor=1)
        pg.goto(TEMPLATE, wait_until="load")
        pg.wait_for_timeout(2200)
        d = pg.evaluate(JS)
        print(f"\n===== viewport {vw} =====")
        if d.get("banner"):
            bw, bh = d["banner"]["w"], d["banner"]["h"]
            print(f"  banner {bw} x {bh}   h/w = {bh/bw:.3f}")
            for k in ("colLeft", "bannerContent", "bannerImgCon", "bannerImg1",
                      "bannerImg2", "plumberImg", "dotImg", "navyBox",
                      "bannerBottom", "innerWrap", "h1", "ratingCon"):
                r = d.get(k)
                if r and r["w"]:
                    print(f"  {k:14s} {r['w']:7.1f} x {r['h']:6.1f}"
                          f"   w/banner={r['w']/bw:.3f}  aspect={r['w']/r['h']:.3f}"
                          f"   abs=({r['x']},{r['y']})")
            print(f"  scrollAbs={d['scrollAbs']} label={d['scrollLabel']!r}")
            print(f"  nav={d['navDisplay']}  toggler={d['togglerDisplay']}")
        pg.close()
    b.close()
