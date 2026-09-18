from PIL import Image

path = r"C:/tmp/indigo/01_Home.jpg"
im = Image.open(path).convert("RGB")
W,H = im.size
print("reference size", W, H)
px = im.load()
# sample the very top-left pixels and down the left edge
print("\ncol scan x=0..60 at y=0..80 (dark? mark D)")
for y in range(0, 80, 2):
    row=""
    for x in range(0, 60, 2):
        p = px[x,y]
        row += "D" if sum(p) < 260 else ("." if sum(p)>600 else "o")
    print(f"y={y:3d} {row}")
print("\nfirst pixel colours down the left edge:")
for y in range(0, 70, 4):
    print(f"  y={y:3d}", px[0,y], px[1,y], px[3,y], px[8,y], px[20,y])
