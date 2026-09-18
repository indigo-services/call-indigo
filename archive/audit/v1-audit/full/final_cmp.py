"""Final evidence render: fresh 1920 prototype capture vs the reference,
stacked at identical scale so vertical misalignment is directly visible."""
from playwright.sync_api import sync_playwright
from PIL import Image, ImageDraw, ImageFont
import pathlib

URL = pathlib.Path(r"C:/tmp/indigo/valvoro-prototype/index.html").as_uri()
OUT = pathlib.Path(r"C:/tmp/indigo/_audit/full")
REF = pathlib.Path(r"C:/tmp/indigo/01_Home.jpg")

HERO_H = 1000          # hero band + a little of the section below
LBL_H = 44


def font(sz):
    for p in (r"C:/Windows/Fonts/segoeuib.ttf", r"C:/Windows/Fonts/arialbd.ttf"):
        try:
            return ImageFont.truetype(p, sz)
        except Exception:
            pass
    return ImageFont.load_default()


# ---- 1. fresh capture -------------------------------------------------
with sync_playwright() as pw:
    b = pw.chromium.launch()
    pg = b.new_page(viewport={"width": 1920, "height": 1200})
    errs = []
    pg.on("console", lambda m: errs.append(m.text) if m.type == "error" else None)
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.goto(URL, wait_until="load")
    pg.wait_for_timeout(2000)
    pg.evaluate("()=>{document.querySelectorAll('.reveal,.wow').forEach(e=>"
                "e.classList.add('visible','animated'));}")
    pg.wait_for_timeout(400)
    pg.screenshot(path=str(OUT / "v4_full1920.png"), full_page=True)
    # measured hero band height, for the label
    hero_h = pg.evaluate("()=>{const e=document.querySelector('.scrim-hero');"
                         "return Math.round(e.getBoundingClientRect().height);}")
    doc_h = pg.evaluate("()=>document.documentElement.scrollHeight")
    b.close()

print("fresh render: docH", doc_h, "heroH", hero_h, "console errors:", errs or "none")

ref = Image.open(REF).convert("RGB")
pro = Image.open(OUT / "v4_full1920.png").convert("RGB")
print("ref", ref.size, "proto", pro.size)

# ---- 2. stacked hero comparison --------------------------------------
W = 1920
ref_c = ref.crop((0, 0, W, HERO_H))
pro_c = pro.crop((0, 0, W, HERO_H))

canvas = Image.new("RGB", (W, LBL_H + HERO_H + 8 + LBL_H + HERO_H), (14, 16, 20))
d = ImageDraw.Draw(canvas)
f = font(24)

def label(y, text, color):
    d.rectangle([0, y, W, y + LBL_H], fill=(14, 16, 20))
    d.text((18, y + 9), text, font=f, fill=color)

y = 0
label(y, "REFERENCE  —  01_Home.jpg  (1920 x 10652, hero band 926px)", (150, 200, 255))
canvas.paste(ref_c, (0, y + LBL_H))
y += LBL_H + HERO_H + 8
label(y, f"PROTOTYPE  —  fresh render  (1920 x {doc_h}, hero band {hero_h}px)", (150, 255, 190))
canvas.paste(pro_c, (0, y + LBL_H))
canvas.save(OUT / "v4_hero_stack.png")
print("wrote v4_hero_stack.png", canvas.size)

# ---- 3. full-page side-by-side, half scale ---------------------------
sc = 0.5
h = int(max(ref.size[1], pro.size[1]) * sc)
rw, ph = int(1920 * sc), int(1920 * sc)
side = Image.new("RGB", (rw * 2 + 12, LBL_H + h), (14, 16, 20))
d2 = ImageDraw.Draw(side)
d2.rectangle([0, 0, rw, LBL_H], fill=(14, 16, 20))
d2.text((14, 9), "REFERENCE", font=f, fill=(150, 200, 255))
d2.rectangle([rw + 12, 0, rw * 2 + 12, LBL_H], fill=(14, 16, 20))
d2.text((rw + 26, 9), "PROTOTYPE", font=f, fill=(150, 255, 190))
side.paste(ref.resize((rw, int(ref.size[1] * sc)), Image.LANCZOS), (0, LBL_H))
side.paste(pro.resize((ph, int(pro.size[1] * sc)), Image.LANCZOS), (rw + 12, LBL_H))
side.save(OUT / "v4_page_side.png")
print("wrote v4_page_side.png", side.size)
