from PIL import Image
im = Image.open(r"C:/tmp/indigo/01_Home.jpg").convert("RGB")
px=im.load()
# hero card spans x 50..1869. H1 is white text on indigo. Find rows with many near-white pixels.
print("rows y=150..700 with count of near-white pixels in x 200..1200")
for y in range(150, 700, 1):
    cnt=sum(1 for x in range(200,1200) if sum(px[x,y])>700)
    if cnt>5:
        print(f"  y={y:4d} white={cnt:4d}")
