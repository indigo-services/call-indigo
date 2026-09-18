from PIL import Image
im = Image.open(r"C:/tmp/indigo/01_Home.jpg").convert("RGB")
W,H = im.size
px = im.load()

print("row | first non-white x (L) | last non-white x (R)   [ref 1920 wide]")
for y in range(0, 48):
    xs=[x for x in range(0, 700) if sum(px[x,y]) < 720]
    xs2=[x for x in range(W-1, W-700, -1) if sum(px[x,y]) < 720]
    L = xs[0] if xs else None
    R = xs2[0] if xs2 else None
    print(f"{y:4d} | L={L}  R={R}")

print()
print("exact pixel colours along row y=0, x=240..270:")
print("  ", [ (x, px[x,0]) for x in range(240, 272, 4) ])
print("exact pixel colours along row y=41, x=270..300:")
print("  ", [ (x, px[x,41]) for x in range(270, 302, 4) ])
