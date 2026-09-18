from playwright.sync_api import sync_playwright
from PIL import Image, ImageDraw
import pathlib

OUT = r"C:/tmp/indigo/_audit/full/"
URL = pathlib.Path(r"C:/tmp/indigo/valvoro-prototype/index.html").as_uri()

with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={"width": 1920, "height": 1200})
    pg.goto(URL, wait_until="load")
    pg.wait_for_timeout(1800)
    pg.evaluate("()=>{document.querySelectorAll('.reveal').forEach(e=>e.classList.add('visible'));}")
    pg.wait_for_timeout(400)
    pg.screenshot(path=OUT + "after_1920_full.png", full_page=True)
    b.close()

after = Image.open(OUT + "after_1920_full.png").convert("RGB")
ref = Image.open(r"C:/tmp/indigo/01_Home.jpg").convert("RGB")
print("reference:", ref.size, " prototype:", after.size)

# side-by-side of the top region (header frame is the thing that changed most)
H = 300
band_ref = ref.crop((0, 0, 1920, H))
band_aft = after.crop((0, 0, 1920, H))
canvas = Image.new("RGB", (1920, H * 2 + 60), "#ffffff")
d = ImageDraw.Draw(canvas)
d.text((12, 8), "REFERENCE  01_Home.jpg  (top bar x 252-1666 = 1417px)", fill="#c0392b")
canvas.paste(band_ref, (0, 24))
d.text((12, H + 36), "PROTOTYPE  index.html  (top bar x 251.5 w 1417)", fill="#1a7f37")
canvas.paste(band_aft, (0, H + 52))
canvas.save(OUT + "cmp_top.png")

# about band
band_ref = ref.crop((0, 1100, 1920, 1880))
band_aft = after.crop((0, 905, 1920, 1685))
canvas = Image.new("RGB", (1920, 780 * 2 + 60), "#ffffff")
d = ImageDraw.Draw(canvas)
d.text((12, 8), "REFERENCE  #about slab  y 1125-1853  = 729px", fill="#c0392b")
canvas.paste(band_ref, (0, 24))
d.text((12, 780 + 36), "PROTOTYPE  #about slab  y 927-1655  = 729px", fill="#1a7f37")
canvas.paste(band_aft, (0, 780 + 52))
canvas.save(OUT + "cmp_about.png")
print("wrote cmp_top.png / cmp_about.png")
