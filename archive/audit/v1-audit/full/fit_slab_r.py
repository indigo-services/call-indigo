from PIL import Image
import math
im = Image.open(r"C:/tmp/indigo/01_Home.jpg").convert("RGB"); px=im.load()
def ismist(p): return abs(p[0]-245)<8 and abs(p[1]-248)<8 and abs(p[2]-255)<8
def edge(y):
    for x in range(0,300):
        if ismist(px[x,y]): return float(x)
    return None

top, bot, left = 1125, 1853, 50.0
pts=[(y,edge(y)) for y in range(top, top+70) if edge(y) is not None]
best=None
for R10 in range(150, 900):
    R=R10/10.0; cx=left+R; cy=top+R
    err=0.0; n=0
    for y,e in pts:
        yy=y+0.5
        if yy>cy: continue
        pred = cx - math.sqrt(max(R*R-(cy-yy)**2, 0))
        err += (pred-e)**2; n+=1
    if n>8:
        err/=n
        if best is None or err<best[0]: best=(err,R,n)
print(f"top-left corner circular fit: R={best[1]:.1f}px  rmse={math.sqrt(best[0]):.2f}px  n={best[2]}")

# also the indigo CTA slab (y ~9650..10136) for a second data point
def isind(p): return p[2]>p[0]+30 and p[2]>110 and p[0]<130
def edge2(y):
    for x in range(0,300):
        if isind(px[x,y]): return float(x)
    return None
print("\nindigo CTA slab left edge (probe):", [(y,edge2(y)) for y in range(9650,9700,6)])
