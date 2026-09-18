from playwright.sync_api import sync_playwright
from PIL import Image
import pathlib

URL = pathlib.Path(r"C:/tmp/indigo/valvoro-prototype/index.html").as_uri()

PROBE = """
() => {
  const r = el => { if(!el) return null; const b = el.getBoundingClientRect();
    return [Math.round(b.x), Math.round(b.y), Math.round(b.width), Math.round(b.height)]; };
  const q = s => document.querySelector(s);
  const hero = q('.scrim-hero');
  return {
    hero:        r(hero),
    heroWrap:    r(q('.hero-wrap')),
    relWrap:     r(q('.hero-wrap > .relative')),
    heroRow:     r(q('.hero-row')),
    heroInner:   r(q('.hero-inner')),
    contentCon:  r(q('.banner-content-con')),
    bannerTop:   r(q('.banner-top')),
    bannerBottom:r(q('.banner-bottom')),
    img2:        r(q('.banner-img2')),
    innerWrap:   r(q('.inner-wrap')),
    bannerCol:   r(q('.banner-col')),
    imgCon:      r(q('.banner-img-con')),
    arch:        r(q('.banner-img1')),
    archImg:     r(q('.banner-img1 img')),
    plumber:     r(q('.plumber-img')),
    plumberImg:  r(q('.plumber-img img')),
    navyBox:     r(q('.navy-box')),
    dotImg:      r(q('.dot-img')),
    scrolOuter:  r(q('.scrol-outer')),
    statWrap:    r(q('.statistics-wrapper')),
    docH:        document.documentElement.scrollHeight,
    // computed positioning of banner-col
    colPos:      q('.banner-col') ? getComputedStyle(q('.banner-col')).position : null,
    relPos:      q('.hero-wrap > .relative') ? getComputedStyle(q('.hero-wrap > .relative')).display : null,
  };
}
"""

with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={"width": 1920, "height": 900})
    pg.goto(URL, wait_until="load")
    pg.wait_for_timeout(1400)
    pg.evaluate("()=>{document.querySelectorAll('.reveal').forEach(e=>e.classList.add('visible'));}")
    pg.wait_for_timeout(250)
    m = pg.evaluate(PROBE)
    b.close()

print("=========== PROTOTYPE HERO GEOMETRY @1920  [x, y, w, h] ===========")
for k, v in m.items():
    print(f"  {k:14s} {v}")
