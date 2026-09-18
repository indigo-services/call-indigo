from PIL import Image
im = Image.open(r"C:/tmp/indigo/01_Home.jpg").convert("RGB")
W, H = im.size
px = im.load()

# The ABOUT slab measured y 1163..1815 on a #f4f7fe field. Its right column holds
# the eyebrow ("About Us"), the h2, a paragraph, a list and a button.
BAND = (1163, 1815)

def is_cyan(p):
    return p[2] > 170 and p[1] > 140 and p[0] < 150 and p[2] - p[0] > 70

def is_ink(p):
    return p[0] < 120 and p[1] < 120 and p[2] < 140

print("--- cyan (eyebrow) pixels inside the about slab ---")
rows = {}
for y in range(*BAND):
    xs = [x for x in range(600, 1900) if is_cyan(px[x, y])]
    if xs:
        rows[y] = (min(xs), max(xs), len(xs))
if rows:
    ys = sorted(rows)
    # contiguous groups
    groups = []
    a = ys[0]; prev = ys[0]
    for y in ys[1:]:
        if y - prev > 3:
            groups.append((a, prev)); a = y
        prev = y
    groups.append((a, prev))
    for a, b in groups:
        grp = [rows[y] for y in range(a, b + 1) if y in rows]
        c = px[grp[0][0] + 2, a]
        print(f"  y {a:5d}..{b:5d} h={b-a+1:3d}  x {min(g[0] for g in grp)}..{max(g[1] for g in grp)}"
              f"  sample #{c[0]:02x}{c[1]:02x}{c[2]:02x}")
else:
    print("  none found")

print("\n--- dark-ink row profile inside the about slab (right column only) ---")
prof = []
for y in range(*BAND):
    n = sum(1 for x in range(950, 1880) if is_ink(px[x, y]))
    prof.append((y, n))
# print runs of "texty" rows
run = None
for y, n in prof:
    if n >= 4 and run is None:
        run = y
    elif n < 4 and run is not None:
        print(f"  text rows {run:5d}..{y-1:5d}  h={y-run:3d}")
        run = None

print("\n--- left edge of the right column (first ink pixel per row) ---")
for y in range(1200, 1300, 4):
    xs = [x for x in range(900, 1900) if is_ink(px[x, y])]
    print(f"  y={y}: first={xs[0] if xs else None} last={xs[-1] if xs else None}")
