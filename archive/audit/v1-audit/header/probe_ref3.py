from PIL import Image
im = Image.open(r"C:/tmp/indigo/01_Home.jpg").convert("RGB")
W,H = im.size
px = im.load()

def is_bar(p):
    # topbar #152040-ish dark navy
    r,g,b = p
    return r<70 and g<80 and b<110 and b>=g

print("=== REFERENCE top bar rows 0..60: left/right extent of dark navy ===")
for y in range(0, 62):
    xs=[x for x in range(W) if is_bar(px[x,y])]
    if not xs:
        print(f"{y:4d} | none"); continue
    print(f"{y:4d} | L={xs[0]:5d} R={xs[-1]:5d} w={xs[-1]-xs[0]+1:5d}  insetL={xs[0]:4d} insetR={W-1-xs[-1]:4d}")
