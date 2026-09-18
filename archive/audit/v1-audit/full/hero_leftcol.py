from PIL import Image, ImageDraw
import pathlib

OUT = pathlib.Path(r"C:/tmp/indigo/_audit/full")
proto = Image.open(OUT / "v2_full1920.png").convert("RGB")
ref = Image.open(r"C:/tmp/indigo/01_Home.jpg").convert("RGB")

BOX = (100, 180, 820, 1120)   # left column, hero only
W = BOX[2] - BOX[0]
H = BOX[3] - BOX[1]

rc = ref.crop(BOX)
pc = proto.crop(BOX)

# side by side with a 2px divider and 10px rulers every 50px
canvas = Image.new("RGB", (W * 2 + 40, H), "white")
canvas.paste(rc, (0, 0))
canvas.paste(pc, (W + 40, 0))
d = ImageDraw.Draw(canvas)
for y in range(0, H, 50):
    yy = BOX[1] + y
    d.line([(0, y), (10, y)], fill="red", width=1)
    d.line([(W + 30, y), (W + 40, y)], fill="red", width=1)
    if yy % 100 == 0:
        d.text((W + 12, y + 1), str(yy), fill="red")
canvas.save(OUT / "v2_leftcol.png")
print("wrote v2_leftcol.png", canvas.size)

# horizontal landmark profile: fraction of NON-blue (content) pixels per row, x 250..780
def content_profile(img, x0, x1, y0, y1):
    out = []
    for y in range(y0, y1):
        n = 0
        for x in range(x0, x1, 2):
            r, g, b = img.getpixel((x, y))
            if not (b > 60 and b > r + 20 and b > g + 10 and r < 160):
                n += 1
        out.append((y, n / ((x1 - x0) // 2)))
    return out

print("\n=== content rows (frac > 0.25) x 250..780 ===")
for label, img in (("REF  ", ref), ("PROTO", proto)):
    prof = content_profile(img, 250, 780, 560, 1100)
    rows = [y for y, f in prof if f > 0.25]
    cl, s, prev = [], rows[0], rows[0]
    for y in rows[1:]:
        if y - prev > 3:
            cl.append((s, prev)); s = y
        prev = y
    cl.append((s, prev))
    print(f" {label}: {[(a, b, b - a + 1) for a, b in cl]}")
