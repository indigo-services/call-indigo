from PIL import Image
im = Image.open(r"C:/tmp/indigo/01_Home.jpg").convert("RGB")
W,H=im.size
px=im.load()

# Header band: find rows with dark ink (text) between y=60 and y=140
print("=== dark ink rows in header band (y 55..145), counting x 200..1750 ===")
for y in range(55,146):
    cnt=sum(1 for x in range(200,1750) if sum(px[x,y])<330)
    if cnt>3: print(f"  y={y:4d} ink={cnt:4d}")

print()
print("=== vertical ink profile of the wordmark region (x 380..640) ===")
for y in range(60,140):
    cnt=sum(1 for x in range(380,640) if sum(px[x,y])<330)
    print(f"  y={y:4d} {cnt:3d} {'#'*min(cnt,60)}")
