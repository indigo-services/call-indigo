from playwright.sync_api import sync_playwright
from PIL import Image
import pathlib

URL = pathlib.Path(r"C:/tmp/indigo/valvoro-prototype/index.html").as_uri()
OUT = pathlib.Path(r"C:/tmp/indigo/_audit/full")

with sync_playwright() as p:
    b = p.chromium.launch()
    shots = {}
    for W in (1440, 1280, 1024, 768, 390):
        pg = b.new_page(viewport={"width": W, "height": 1000})
        pg.goto(URL, wait_until="load")
        pg.wait_for_timeout(1600)
        pg.evaluate("()=>{document.querySelectorAll('.reveal').forEach(e=>e.classList.add('visible'));}")
        pg.wait_for_timeout(250)
        hero = pg.evaluate("""()=>{const h=document.querySelector('.scrim-hero');
            const b=h.getBoundingClientRect();
            return {top:Math.round(b.top),bottom:Math.round(b.bottom),h:Math.round(b.height)};}""")
        pg.screenshot(path=str(OUT / f"v3_hero_{W}.png"), clip={"x": 0, "y": 0, "width": W, "height": min(hero["bottom"] + 20, 1400)})
        shots[W] = hero
        print(f"  {W}: hero {hero}")
        pg.close()
    b.close()

# montage
imgs = []
for W in (1440, 1280, 1024, 768, 390):
    im = Image.open(OUT / f"v3_hero_{W}.png").convert("RGB")
    scale = 620 / im.width
    imgs.append((W, im.resize((620, int(im.height * scale)), Image.LANCZOS)))
total_h = sum(i.height + 26 for _, i in imgs)
c = Image.new("RGB", (620, total_h), "white")
y = 0
from PIL import ImageDraw
d = ImageDraw.Draw(c)
for W, im in imgs:
    d.text((6, y + 6), f"{W}px", fill="red")
    c.paste(im, (0, y + 22))
    y += im.height + 26
c.save(OUT / "v3_hero_responsive.png")
print("montage", c.size)
