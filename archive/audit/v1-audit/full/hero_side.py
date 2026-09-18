from playwright.sync_api import sync_playwright
from PIL import Image, ImageChops
import pathlib

URL = pathlib.Path(r"C:/tmp/indigo/valvoro-prototype/index.html").as_uri()
OUT = pathlib.Path(r"C:/tmp/indigo/_audit/full")

with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={"width": 1920, "height": 1200})
    pg.goto(URL, wait_until="load")
    pg.wait_for_timeout(1600)
    pg.evaluate("()=>{document.querySelectorAll('.reveal').forEach(e=>e.classList.add('visible'));}")
    pg.wait_for_timeout(300)
    pg.screenshot(path=str(OUT / "v2_full1920.png"), full_page=True)
    b.close()

proto = Image.open(OUT / "v2_full1920.png").convert("RGB")
ref = Image.open(r"C:/tmp/indigo/01_Home.jpg").convert("RGB")
print("proto", proto.size, " ref", ref.size)

H = 1150
pc = proto.crop((0, 0, 1920, H))
rc = ref.crop((0, 0, 1920, H))

# side by side, half scale
half = (960, H // 2)
side = Image.new("RGB", (1920, H // 2), "white")
side.paste(rc.resize(half, Image.LANCZOS), (0, 0))
side.paste(pc.resize(half, Image.LANCZOS), (960, 0))
side.save(OUT / "v2_hero_side.png")

# stacked full width
st = Image.new("RGB", (1920, H * 2 + 20), "white")
st.paste(rc, (0, 0))
st.paste(pc, (0, H + 20))
st.resize((760, int((H * 2 + 20) * 760 / 1920)), Image.LANCZOS).save(OUT / "v2_hero_stack.png")

# 50/50 blend to expose vertical shift
Image.blend(rc, pc, 0.5).save(OUT / "v2_hero_blend.png")

# column-scan the prototype for the hero bottom, correctly this time
def is_blue(px):
    r, g, bl = px
    return bl > 60 and bl > r + 20 and bl > g + 10 and r < 160

print("\n--- prototype: hero slab vertical extent per column ---")
for x in (120, 300, 960, 1600):
    runs, inside, s = [], False, 0
    for y in range(0, 1400):
        d = is_blue(proto.getpixel((x, y)))
        if d and not inside: inside, s = True, y
        elif not d and inside:
            inside = False
            if y - s > 40: runs.append((s, y - 1, y - s))
    if inside: runs.append((s, 1399, 1400 - s))
    print(f"  proto x={x}: {runs}")

print("\n--- reference: hero slab vertical extent per column ---")
for x in (120, 300, 960, 1600):
    runs, inside, s = [], False, 0
    for y in range(0, 1400):
        d = is_blue(ref.getpixel((x, y)))
        if d and not inside: inside, s = True, y
        elif not d and inside:
            inside = False
            if y - s > 40: runs.append((s, y - 1, y - s))
    if inside: runs.append((s, 1399, 1400 - s))
    print(f"  ref   x={x}: {runs}")
