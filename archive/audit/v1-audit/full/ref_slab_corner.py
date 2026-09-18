from PIL import Image
import math
im = Image.open(r"C:/tmp/indigo/01_Home.jpg").convert("RGB"); px=im.load()
W,H=im.size

def ismist(p): return abs(p[0]-245)<8 and abs(p[1]-248)<8 and abs(p[2]-255)<8

def edge(y, lo=0, hi=300):
    for x in range(lo,hi):
        if ismist(px[x,y]): return x
    return None

print("ABOUT slab (mist) — left edge by row")
for y in list(range(1120,1180))+list(range(1820,1860)):
    print(f"  y={y:5d} edge={edge(y)}")

# fit top-left radius: assume straight edge at x0, bottom/top tangent
def fit(rows, x0, ytangent_lo, ytangent_hi, label):
    pts=[(y,edge(y)) for y in range(ytangent_lo, ytangent_hi) if edge(y) is not None]
    best=None
    for R10 in range(100, 900):
        R=R10/10.0
        # top-left corner: centre (x0+R, ytop+R); we fit over the arc rows
        err=0; n=0
        for y,e in pts:
            err+=(e-x0)**2; n+=1
        # skip - use proper circle fit below
    return pts

print("\nchecking straightness: min edge over rows 1125..1170 =", min(edge(y) for y in range(1125,1171) if edge(y)))
print("checking straightness: min edge over rows 1810..1850 =", min(edge(y) for y in range(1810,1851) if edge(y)))
