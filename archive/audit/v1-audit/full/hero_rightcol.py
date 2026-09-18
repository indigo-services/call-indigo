from PIL import Image, ImageDraw
import pathlib

OUT = pathlib.Path(r"C:/tmp/indigo/_audit/full")
proto = Image.open(OUT / "v2_full1920.png").convert("RGB")
ref = Image.open(r"C:/tmp/indigo/01_Home.jpg").convert("RGB")

BOX = (940, 180, 1880, 1120)
W = BOX[2] - BOX[0]
H = BOX[3] - BOX[1]
rc = ref.crop(BOX); pc = proto.crop(BOX)
canvas = Image.new("RGB", (W, H * 2 + 24), "white")
canvas.paste(rc, (0, 0))
canvas.paste(pc, (0, H + 24))
d = ImageDraw.Draw(canvas)
d.text((6, H + 6), "REF above  /  PROTO below", fill="red")
for y in range(0, H, 100):
    d.line([(0, y), (12, y)], fill="red")
    d.line([(0, H + 24 + y), (12, H + 24 + y)], fill="red")
canvas.save(OUT / "v2_rightcol.png")
print("wrote", canvas.size)

# navy box detection in reference: dark navy #091f41
def is_navy(px):
    r, g, b = px
    return r < 40 and g < 55 and b > 45 and b < 95
def bbox(img, y0, y1, x0, x1, pred):
    xs = []; ys = []
    for y in range(y0, y1):
        for x in range(x0, x1):
            if pred(img.getpixel((x, y))): xs.append(x); ys.append(y)
    return (min(xs), min(ys), max(xs), max(ys), max(xs)-min(xs)+1, max(ys)-min(ys)+1) if xs else None
print("REF  navy box:", bbox(ref, 260, 600, 1450, 1880, is_navy))
print("PROTO navy box:", bbox(proto, 200, 600, 1450, 1880, is_navy))
