from playwright.sync_api import sync_playwright
from PIL import Image
import pathlib

URL = pathlib.Path(r"C:/tmp/indigo/valvoro-prototype/index.html").as_uri()
OUT = r"C:/tmp/indigo/_audit/full/"

with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={"width": 1920, "height": 1200})
    pg.goto(URL, wait_until="load")
    pg.wait_for_timeout(1800)
    pg.evaluate("()=>{document.querySelectorAll('.reveal').forEach(e=>e.classList.add('visible'));}")
    pg.wait_for_timeout(400)
    pg.screenshot(path=OUT + "after_1920_full.png", full_page=True)
    b.close()

im = Image.open(OUT + "after_1920_full.png").convert("RGB")
print("after render:", im.size)
im.crop((0, 0, 1920, 320)).save(OUT + "a_top.png")
# locate the about slab by scanning for the mist fill at x=940
px = im.load()
def ismist(p): return abs(p[0] - 244) < 8 and abs(p[1] - 248) < 8 and abs(p[2] - 254) < 8
runs = []
prev = False
for y in range(im.size[1]):
    cur = ismist(px[940, y])
    if cur and not prev:
        start = y
    if not cur and prev and y - start > 60:
        runs.append((start, y - 1))
    prev = cur
print("mist bands at x=940:", runs[:6])
if runs:
    a, b2 = runs[0]
    im.crop((0, max(0, a - 20), 1920, min(im.size[1], b2 + 20))).resize((1440, int((b2 - a + 40) * 0.75))).save(OUT + "a_about.png")
