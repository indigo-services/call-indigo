from PIL import Image
import math
im = Image.open(r"C:/tmp/indigo/01_Home.jpg").convert("RGB")
px = im.load()

def left_edge(y):
    # subpixel: scan x 240..320, find first x where luminance < 0.5 of white
    prev = None
    for x in range(240, 330):
        r,g,b = px[x,y]
        lum = 0.299*r+0.587*g+0.114*b
        if lum < 128:
            if prev is None: return float(x)
            # linear interp between prev (light) and this (dark)
            return prev + (128-prev_lum)/(lum-prev_lum)
        prev = x; prev_lum = lum
    return None

# vertical extent of the bar: find last row with a dark pixel near x=300
rows = [y for y in range(0,60) if sum(px[300,y]) < 400]
bot = max(rows)
print("bar rows near x=300:", min(rows), "..", bot)
print("\nsubpixel left edge per row:")
pts=[]
for y in range(0, bot+1):
    e = left_edge(y)
    pts.append((y,e))
    print(f"  y={y:3d}  edge={e}")

# Fit: circle center (cx, cy) radius R, with cy = bot+1-R (tangent to bottom edge), cx = x0+R
x0 = 252.0
best=None
for R10 in range(150, 500):
    R = R10/10.0
    cx = x0 + R; cy = (bot+1) - R
    err=0.0; n=0
    for (y,e) in pts:
        if e is None: continue
        yy = y + 0.5
        if yy < cy: continue
        # predicted edge x
        d = yy - cy
        if d > R: continue
        pred = cx - math.sqrt(max(R*R - d*d, 0))
        err += (pred-e)**2; n+=1
    if n>6:
        err/=n
        if best is None or err<best[0]: best=(err,R,n)
print(f"\nbest circular fit: R={best[1]:.1f}  rmse={math.sqrt(best[0]):.2f}px  n={best[2]}")
