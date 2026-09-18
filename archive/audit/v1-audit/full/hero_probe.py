from playwright.sync_api import sync_playwright
from PIL import Image
import pathlib

URL = pathlib.Path(r"C:/tmp/indigo/valvoro-prototype/index.html").as_uri()
REF = r"C:/tmp/indigo/01_Home.jpg"

# ---- 1. prototype hero internals -------------------------------------------
PROBE = """
() => {
  const r = el => { if(!el) return null; const b = el.getBoundingClientRect();
    return {x:Math.round(b.x), y:Math.round(b.y), w:Math.round(b.width), h:Math.round(b.height),
            bottom:Math.round(b.bottom)}; };
  const cs = el => el ? getComputedStyle(el) : null;
  const out = {};
  const hero = document.querySelector('.slab-photo.scrim-hero') || document.querySelector('.hero-card');
  out.hero = r(hero);
  out.heroPad = hero ? cs(hero).paddingTop + ' / ' + cs(hero).paddingBottom : null;
  const topbar = document.querySelector('.pill-topbar');
  out.topbar = r(topbar);
  const header = document.querySelector('header');
  out.header = r(header);
  out.headerSticky = header ? cs(header).position : null;
  const h1 = hero && hero.querySelector('h1');
  out.h1 = r(h1);
  if (h1) out.h1font = cs(h1).fontSize + '/' + cs(h1).lineHeight;
  const lead = hero && hero.querySelector('.banner-lead');
  out.lead = r(lead);
  if (lead) out.leadfont = cs(lead).fontSize + '/' + cs(lead).lineHeight;
  const cta = hero && hero.querySelector('.hero-cta');
  out.cta = r(cta);
  if (cta) out.ctaStyle = cs(cta).marginLeft + ' ml / ' + cs(cta).marginBottom + ' mb';
  const rating = hero && hero.querySelector('.banner-top');
  out.bannerTop = r(rating);
  if (rating) out.bannerTopPad = cs(rating).paddingLeft;
  // right column image
  const rimg = hero && hero.querySelector('img[src*="banner"]');
  out.heroImg = r(rimg);
  if (rimg) { const s = cs(rimg); out.heroImgFit = s.objectFit + ' ' + s.objectPosition; }
  out.docH = document.documentElement.scrollHeight;
  return out;
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

print("=========== PROTOTYPE @1920 ===========")
for k in ("topbar", "header", "hero", "heroPad", "bannerTop", "bannerTopPad",
          "h1", "h1font", "lead", "leadfont", "cta", "ctaStyle", "heroImg", "heroImgFit", "docH"):
    print(f"  {k:14s} {m.get(k)}")

# ---- 2. reference slab boundaries ------------------------------------------
im = Image.open(REF).convert("RGB")
W, H = im.size
px = im.load()

# scan a column clear of content: x=80 (inside slab, left of text)
def is_dark_blue(c):
    r, g, bl = c
    return bl > 60 and bl > r + 20 and bl > g + 10 and r < 160

def slab_edges(x, y0, y1):
    runs = []
    inside = False
    start = 0
    for y in range(y0, y1):
        d = is_dark_blue(px[x, y])
        if d and not inside:
            inside = True; start = y
        elif not d and inside:
            inside = False
            if y - start > 40:
                runs.append((start, y - 1, y - start))
    if inside:
        runs.append((start, y1 - 1, y1 - start))
    return runs

print("\n=========== REFERENCE 01_Home.jpg (1920x%d) ===========" % H)
for x in (80, 120, 1840):
    runs = slab_edges(x, 0, 3000)
    print(f"  column x={x}: {runs}")

# hero slab: find the topmost long dark run at x=80
runs = slab_edges(80, 0, 3000)
if runs:
    top, bot, hgt = runs[0]
    print(f"\n  REF hero slab: top={top} bottom={bot} height={hgt}")
    print(f"  (prototype hero y={m['hero']['y']} h={m['hero']['h']})")
