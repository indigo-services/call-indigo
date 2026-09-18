from PIL import Image
import numpy as np

REF = r"C:/tmp/indigo/01_Home.jpg"
im = Image.open(REF).convert("RGB")
a = np.asarray(im).astype(np.int16)
H, W, _ = a.shape
print("reference", W, "x", H)

def whiteish(px):
    r, g, b = px
    return r > 225 and g > 225 and b > 225

def row_white_frac(y, x0, x1):
    row = a[y, x0:x1]
    m = (row[:, 0] > 225) & (row[:, 1] > 225) & (row[:, 2] > 225)
    return m.mean()

print("\n--- WHITE CTA PILL in left column (x 300..640) ---")
runs = []
inside = False
for y in range(600, 1000):
    f = row_white_frac(y, 300, 640)
    d = f > 0.55
    if d and not inside:
        inside = True; s = y
    elif not d and inside:
        inside = False
        if y - s > 8: runs.append((s, y - 1, y - s))
print("  white runs:", runs)

print("\n--- 'Scroll Down' label: white text near x 900..1020, y 850..1000 ---")
best = []
for y in range(820, 1010):
    f = row_white_frac(y, 880, 1040)
    if f > 0.01:
        best.append((y, round(f, 3)))
if best:
    print(f"  first white row {best[0]}, last {best[-1]}")
    # cluster
    cl = []
    s = prev = best[0][0]
    for y, _ in best[1:]:
        if y - prev > 4:
            cl.append((s, prev)); s = y
        prev = y
    cl.append((s, prev))
    print("  clusters:", cl)

print("\n--- statistics numbers: white text x 300..780, y 780..1000 ---")
best2 = []
for y in range(760, 1010):
    f = row_white_frac(y, 300, 790)
    if f > 0.02:
        best2.append(y)
if best2:
    cl = []
    s = prev = best2[0]
    for y in best2[1:]:
        if y - prev > 5:
            cl.append((s, prev)); s = y
        prev = y
    cl.append((s, prev))
    print("  clusters:", cl)

print("\n--- hero slab bottom edge, scanned at several x ---")
def is_blue(px):
    r, g, b = px
    return b > 60 and b > r + 20 and b > g + 10 and r < 160
for x in (300, 700, 960, 1300, 1600):
    y = 1300
    while y > 200 and is_blue(a[y, x]):
        y -= 1
    print(f"  x={x}: last blue row = {y}")
