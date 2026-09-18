from PIL import Image
import pathlib

OUT = pathlib.Path(r"C:/tmp/indigo/_audit/full")
proto = Image.open(OUT / "v2_full1920.png").convert("RGB")
ref = Image.open(r"C:/tmp/indigo/01_Home.jpg").convert("RGB")

def is_blue(px):
    r, g, b = px
    return b > 60 and b > r + 20 and b > g + 10 and r < 160

def is_whiteish(px):
    r, g, b = px
    return r > 200 and g > 200 and b > 200

def row_extent(img, y, x0, x1, pred):
    xs = [x for x in range(x0, x1) if pred(img.getpixel((x, y)))]
    return (xs[0], xs[-1], len(xs)) if xs else None

print("=== LEAD REGION: per-row ink extent, x 150..900 ===")
for label, img in (("REF  ", ref), ("PROTO", proto)):
    print(f"\n {label}")
    for y in range(600, 720, 2):
        e = row_extent(img, y, 150, 900, lambda p: not is_blue(p))
        if e and e[2] > 6:
            print(f"   y={y:4d}  x {e[0]:4d}..{e[1]:4d}  n={e[2]:3d}")

print("\n=== LEAD vertical: rows with ANY ink, x 150..900, y 595..730 ===")
for label, img in (("REF  ", ref), ("PROTO", proto)):
    rows = []
    for y in range(595, 735):
        e = row_extent(img, y, 150, 900, lambda p: not is_blue(p))
        if e and e[2] > 6:
            rows.append(y)
    cl, s, prev = [], rows[0], rows[0]
    for y in rows[1:]:
        if y - prev > 3:
            cl.append((s, prev)); s = y
        prev = y
    cl.append((s, prev))
    print(f" {label}: {[(a, b, b - a + 1) for a, b in cl]}")

print("\n=== WHITE CTA PILL: rows where >30% of x 340..640 is near-white ===")
for label, img in (("REF  ", ref), ("PROTO", proto)):
    rows = []
    for y in range(690, 840):
        n = sum(1 for x in range(340, 640, 2) if is_whiteish(img.getpixel((x, y))))
        if n / 150 > 0.30:
            rows.append(y)
    if rows:
        cl, s, prev = [], rows[0], rows[0]
        for y in rows[1:]:
            if y - prev > 3:
                cl.append((s, prev)); s = y
            prev = y
        cl.append((s, prev))
        print(f" {label}: {[(a, b, b - a + 1) for a, b in cl]}")
    else:
        print(f" {label}: none")

print("\n=== PILL horizontal extent at its vertical middle ===")
for label, img, yy in (("REF  ", ref, 745), ("PROTO", proto, 785)):
    e = row_extent(img, yy, 200, 900, is_whiteish)
    print(f" {label} y={yy}: {e}")
