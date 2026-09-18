from PIL import Image
im = Image.open(r"C:/tmp/indigo/01_Home.jpg").convert("RGB")
px=im.load()
print("row profile, about band y 1120..1500 (dark ink count in x 150..1770):")
for y in range(1120,1500):
    c=sum(1 for x in range(150,1770,2) if sum(px[x,y])<430)
    if c: print(f"  y={y:5d} {c:4d} {'#'*min(c//4,70)}")
