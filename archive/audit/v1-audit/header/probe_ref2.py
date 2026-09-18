from PIL import Image
im = Image.open(r"C:/tmp/indigo/01_Home.jpg").convert("RGB")
W,H = im.size
px = im.load()
print("scan first 400 rows: dark-pixel count per row")
for y in range(0, 400, 2):
    cnt = sum(1 for x in range(0, W, 8) if sum(px[x,y]) < 300)
    if cnt: print(f"  y={y:4d} dark={cnt:4d}")
