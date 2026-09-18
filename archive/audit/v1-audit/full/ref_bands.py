from PIL import Image
from collections import Counter
im = Image.open(r"C:/tmp/indigo/01_Home.jpg").convert("RGB")
W,H = im.size
px = im.load()
print("reference", W, H)

def modal(y):
    c = Counter()
    for x in range(0, W, 6):
        c[px[x,y]] += 1
    return c.most_common(1)[0][0]

bands=[]
prev=None; start=0
for y in range(H):
    m = modal(y)
    # quantise to reduce jpeg noise
    q = tuple(v//8*8 for v in m)
    if q != prev:
        if prev is not None:
            bands.append((start, y-1, prev))
        prev=q; start=y
bands.append((start, H-1, prev))

print(f"\n{len(bands)} colour bands (quantised, >=8 rows):")
for a,b,c in bands:
    if b-a+1 >= 8:
        print(f"  y {a:6d}..{b:6d}  h={b-a+1:6d}  modal={c}  hex=#{c[0]:02x}{c[1]:02x}{c[2]:02x}")
