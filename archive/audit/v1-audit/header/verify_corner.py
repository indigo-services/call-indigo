from playwright.sync_api import sync_playwright
from PIL import Image
import pathlib, math

url = pathlib.Path(r"C:/tmp/indigo/valvoro-prototype/index.html").as_uri()
OUT = r"C:/tmp/indigo/_audit/header"

with sync_playwright() as p:
    br = p.chromium.launch()
    pg = br.new_page(viewport={"width":1440,"height":900}, device_scale_factor=1)
    pg.goto(url); pg.wait_for_timeout(900)
    pg.screenshot(path=OUT+r"\after_1440_top.png", clip={"x":0,"y":0,"width":1440,"height":170})
    pg.close()
    br.close()

im = Image.open(OUT+r"\after_1440_top.png").convert("RGB")
px = im.load(); W,H = im.size
def isbar(p):
    r,g,b = p
    return r<70 and g<80 and b<115 and b>=g
rows = [y for y in range(H) if sum(1 for x in range(0,W,4) if isbar(px[x,y])) > W*0.05]
top, bot = min(rows), max(rows)
print(f"rendered bar: y {top}..{bot}  height {bot-top+1}")

def left_edge(y):
    prev=None
    for x in range(0, 200):
        r,g,b = px[x,y]; lum = 0.299*r+0.587*g+0.114*b
        if lum < 128:
            if prev is None: return float(x)
            return prev + (128-prev_lum)/(lum-prev_lum)
        prev = x; prev_lum = lum
    return None

pts=[(y,left_edge(y)) for y in range(top,bot+1)]
print("left edge per row:", [(y,round(e,1)) for y,e in pts])

# top-corner squareness: is the edge constant over the first rows?
x0 = min(e for _,e in pts if e)
print(f"\nmin left edge x0 = {x0}")
sq = [y for y,e in pts if e is not None and abs(e-x0) < 0.6]
print(f"rows with edge within 0.6px of x0: {sq[0]}..{sq[-1]}  ({len(sq)} rows)")
print("=> top-left corner is SQUARE" if sq[0]==top else "=> top-left corner is ROUNDED")

# fit bottom radius
bot_edge = bot
best=None
for R10 in range(100,600):
    R=R10/10.0; cx=x0+R; cy=(bot+1)-R; err=0.0; n=0
    for y,e in pts:
        if e is None: continue
        yy=y+0.5
        if yy<cy or yy-cy>R: continue
        pred=cx-math.sqrt(max(R*R-(yy-cy)**2,0)); err+=(pred-e)**2; n+=1
    if n>6:
        err/=n
        if best is None or err<best[0]: best=(err,R,n)
print(f"\nbottom-left radius fit: R={best[1]:.1f}px  rmse={math.sqrt(best[0]):.2f}px  (reference: R=39.4)")
