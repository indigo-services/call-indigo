from PIL import Image
import sys

def analyze(path, label, crop_h=140, bg=(0x15,0x20,0x40), tol=26):
    im = Image.open(path).convert("RGB")
    W,H = im.size
    print(f"\n=== {label} === {W}x{H}")
    h = min(crop_h, H)
    px = im.load()
    def is_bg(p):
        return all(abs(p[i]-bg[i])<=tol for i in range(3))
    # find rows that contain bar pixels
    rows=[]
    for y in range(h):
        cnt = sum(1 for x in range(0,W,2) if is_bg(px[x,y]))
        rows.append(cnt)
    top = next((y for y,c in enumerate(rows) if c > W*0.05), None)
    bot = None
    for y in range(h-1,-1,-1):
        if rows[y] > W*0.05:
            bot = y; break
    print(f"bar rows: top={top} bottom={bot} height={None if top is None else bot-top+1}")
    if top is None: return
    # for a sample of rows, find left/right extent of bar
    print(" y   | left right width | left-inset")
    for y in range(top, min(bot+1, top+60)):
        xs = [x for x in range(W) if is_bg(px[x,y])]
        if not xs: 
            print(f"{y:4d} | none"); continue
        print(f"{y:4d} | {xs[0]:5d} {xs[-1]:5d} {xs[-1]-xs[0]+1:5d} | {xs[0]:4d}")

analyze(r"C:/Users/jaden.black/.workbuddy-ai/clipboard-images/clipboard-2026-09-18T02-39-38-955Z-dd5e06bf.png", "CURRENT RENDER (screenshot)")
