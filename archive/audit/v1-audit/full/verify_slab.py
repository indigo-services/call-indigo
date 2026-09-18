from PIL import Image
import math
im = Image.open(r"C:/tmp/indigo/01_Home.jpg").convert("RGB")
W, H = im.size
px = im.load()
print(f"reference {W} x {H}")

def page_white(p):
    # the page background is pure #ffffff; the mist slab is #f5f8ff (r=245) and
    # must NOT be treated as page background, so the gate is deliberately tight.
    return p[0] >= 250 and p[1] >= 250 and p[2] >= 250

def slab_row(y):
    L = None
    for x in range(0, W):
        if not page_white(px[x, y]):
            L = x; break
    R = None
    for x in range(W - 1, -1, -1):
        if not page_white(px[x, y]):
            R = x; break
    return L, R

# --- 1. slab bounds at a set of probe rows spread over the whole page --------
print("\n--- slab bounds at probe rows ---")
print("   y     L     R    width   ratio    fill")
probes = list(range(1100, 1900, 100)) + list(range(3000, 4200, 200)) + \
         list(range(5200, 6400, 200)) + list(range(9600, 10200, 150))
for y in probes:
    L, R = slab_row(y)
    if L is None:
        print(f"{y:6d}  none")
        continue
    w = R - L + 1
    c = px[L + 4, y]
    print(f"{y:6d} {L:5d} {R:5d} {w:6d}  {w/W:.5f}  #{c[0]:02x}{c[1]:02x}{c[2]:02x}")

# --- 2. modal slab box over a long run --------------------------------------
print("\n--- modal slab box per contiguous band ---")
prev = None; start = 0; segs = []
for y in range(H):
    L, R = slab_row(y)
    key = (None if L is None else (L // 2 * 2, R // 2 * 2))
    if key != prev:
        if prev is not None:
            segs.append((start, y - 1, prev))
        prev = key; start = y
segs.append((start, H - 1, prev))
for a, b, k in segs:
    if b - a + 1 < 20 or k is None:
        continue
    L, R = k
    print(f"  y {a:6d}..{b:6d} h={b-a+1:6d} | L={L:5d} R={R:5d} w={R-L+1:5d} "
          f"ratio={(R-L+1)/W:.5f}")

# --- 3. corner radius: least-squares circle through the top-left arc --------
def radius_fit(top, left, is_fill, rows=80, rmax=900):
    pts = []
    for y in range(top, top + rows):
        e = None
        for x in range(0, 300):
            if is_fill(px[x, y]):
                e = float(x); break
        if e is not None:
            pts.append((y, e))
    best = None
    for r10 in range(100, rmax):
        R = r10 / 10.0
        cx = left + R; cy = top + R
        err = 0.0; n = 0
        for y, e in pts:
            yy = y + 0.5
            if yy > cy:
                continue
            pred = cx - math.sqrt(max(R * R - (cy - yy) ** 2, 0.0))
            err += (pred - e) ** 2; n += 1
        if n > 10:
            err /= n
            if best is None or err < best[0]:
                best = (err, R, n)
    return (math.sqrt(best[0]), best[1], best[2]) if best else None

def is_mist(p):
    return abs(p[0] - 245) < 10 and abs(p[1] - 248) < 10 and abs(p[2] - 255) < 10

def is_indigo(p):
    return p[2] > p[0] + 25 and p[2] > 100 and p[0] < 140

print("\n--- top-left corner circular fits ---")
for label, top, is_fill in (("mist slab @1125", 1125, is_mist),
                            ("mist slab @3020", 3020, is_mist)):
    r = radius_fit(top, 50.0, is_fill)
    if r:
        print(f"  {label:20s} R={r[1]:6.1f}px  rmse={r[0]:.2f}px  n={r[2]}")
    else:
        print(f"  {label:20s} no fit")
