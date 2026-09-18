from playwright.sync_api import sync_playwright
from PIL import Image
import pathlib

URL = pathlib.Path(r"C:/tmp/indigo/valvoro-prototype/index.html").as_uri()
OUT = pathlib.Path(r"C:/tmp/indigo/_audit/full")

PROBE = """
() => {
  const r = el => { if(!el) return null; const b = el.getBoundingClientRect();
    return [Math.round(b.x), Math.round(b.y), Math.round(b.width), Math.round(b.height)]; };
  const q = s => document.querySelector(s);
  const hero = q('.scrim-hero');
  const hb = hero.getBoundingClientRect();
  const res = {
    heroTop: Math.round(hb.top), heroBottom: Math.round(hb.bottom), heroH: Math.round(hb.height),
    docH: document.documentElement.scrollHeight,
    docW: document.documentElement.scrollWidth,
    winW: window.innerWidth,
  };
  res.contentCon = r(q('.banner-content-con'));
  res.bannerTop  = r(q('.banner-top'));
  res.h1         = r(q('.hero-h1'));
  res.bannerBottom = r(q('.banner-bottom'));
  res.img2       = r(q('.banner-img2'));
  res.innerWrap  = r(q('.inner-wrap'));
  res.lead       = r(q('.banner-lead'));
  res.cta        = r(q('.hero-cta'));
  res.stats      = r(q('.statistics-wrapper'));
  res.statBox1   = r(q('.statistics-box'));
  res.archImg    = r(q('.banner-img1 img'));
  res.plumber    = r(q('.plumber-img'));
  res.navyBox    = r(q('.navy-box'));
  res.dotImg     = r(q('.dot-img'));
  res.scrol      = r(q('.scrol-outer'));
  res.ring       = r(q('.scroll-down-arrow .grid'));
  // line count of the lead
  const p = q('.banner-lead');
  if (p) {
    const rg = document.createRange(); rg.selectNodeContents(p);
    res.leadLineTops = [...new Set([...rg.getClientRects()].map(x => Math.round(x.top)))];
  }
  res.overflow = [...document.querySelectorAll('body *')]
    .filter(e => { const b = e.getBoundingClientRect();
                   return b.right > window.innerWidth + 1.5 && b.width < window.innerWidth; })
    .slice(0,6).map(e => String(e.className||'').slice(0,50));
  return res;
}
"""

with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={"width": 1920, "height": 1200})
    errs = []
    pg.on("console", lambda m: errs.append(m.text) if m.type == "error" else None)
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.goto(URL, wait_until="load")
    pg.wait_for_timeout(1800)
    pg.evaluate("()=>{document.querySelectorAll('.reveal').forEach(e=>e.classList.add('visible'));}")
    pg.wait_for_timeout(300)
    m = pg.evaluate(PROBE)
    pg.screenshot(path=str(OUT / "v3_full1920.png"), full_page=True)
    b.close()

print("=========== PROTOTYPE v3 @1920 ===========")
print(f"  hero y {m['heroTop']}..{m['heroBottom']}  h={m['heroH']}      [reference: 149..1074  h=926]")
print(f"  docH {m['docH']}   docW {m['docW']} winW {m['winW']}   [reference docH 10652]")
print()
TARGET = {
  'contentCon':   (120, 204, 826, 805),
  'bannerTop':    (120, 254, 826, 321),
  'h1':           (180, 337, 766, 238),
  'bannerBottom': (120, 603, 826, 387),
  'img2':         (120, 603, 266, 387),
  'innerWrap':    (417, 603, 529, 387),
  'lead':         (417, 615, 514, 58),
  'cta':          (473, 708, 260, 65),
  'stats':        (439, 916, 496, 70),
  'archImg':      (975, 204, 406, 586),
  'plumber':      (1145, 204, 671, 880),
  'navyBox':      (1606, 330, 159, 179),
  'dotImg':       (975, 788, 54, 52),
  'scrol':        (105, 927, 1711, 32),
  'ring':         (1165, 949, 80, 80),
}
for k, tgt in TARGET.items():
    v = m.get(k)
    print(f"  {k:13s} {str(v):28s} target~{tgt}")
print()
print("  leadLineTops:", m.get('leadLineTops'), " (2 entries = two lines)")
if m['overflow']: print("  overflow:", m['overflow'])
if errs: print("  CONSOLE:", errs[:5])
else: print("  console: clean")

proto = Image.open(OUT / "v3_full1920.png").convert("RGB")
ref = Image.open(r"C:/tmp/indigo/01_Home.jpg").convert("RGB")
def is_blue(px):
    r,g,b=px; return b>60 and b>r+20 and b>g+10 and r<160
def is_cyan(px):
    r,g,b=px; return b>200 and g>150 and r<140 and g>r+40
def bbox(img,y0,y1,x0,x1,pred):
    xs=[];ys=[]
    for y in range(y0,y1):
        for x in range(x0,x1):
            if pred(img.getpixel((x,y))): xs.append(x);ys.append(y)
    return (min(xs),min(ys),max(xs),max(ys),max(xs)-min(xs)+1,max(ys)-min(ys)+1) if xs else None
print("\n=========== pixel checks ===========")
print("  CTA pill cyan  ref:", bbox(ref,660,860,250,800,is_cyan), " proto:", bbox(proto,660,860,250,800,is_cyan))
for label,img in (('REF  ',ref),('PROTO',proto)):
    rows=[]; inside=False; s=0
    for y in range(0,1400):
        d=is_blue(img.getpixel((120,y)))
        if d and not inside: inside,s=True,y
        elif not d and inside:
            inside=False
            if y-s>40: rows.append((s,y-1,y-s))
    if inside: rows.append((s,1399,1400-s))
    print(f"  {label} hero blue run at x=120: {rows}")
