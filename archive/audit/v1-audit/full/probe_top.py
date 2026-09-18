from PIL import Image
im = Image.open(r"C:/tmp/indigo/01_Home.jpg").convert("RGB")
W, H = im.size
px = im.load()

def run(y, x0, x1, step=1):
    out = []
    prev = None
    for x in range(x0, x1, step):
        p = px[x, y]
        k = (p[0] // 16, p[1] // 16, p[2] // 16)
        if k != prev:
            out.append((x, "#%02x%02x%02x" % p))
            prev = k
    return out

print("--- horizontal colour transitions, y = 0..60 ---")
for y in (0, 2, 5, 10, 20, 30, 40, 44, 50, 60, 80, 100, 120, 140, 160, 180):
    print(f"y={y:4d} " + "  ".join(f"{x}:{c}" for x, c in run(y, 0, W))[:230])

print("\n--- vertical scan at x=100 and x=960 and x=1820 ---")
for x in (100, 960, 1820):
    prev = None
    print(f"x={x}")
    for y in range(0, 260):
        p = px[x, y]
        k = (p[0] // 16, p[1] // 16, p[2] // 16)
        if k != prev:
            print(f"   y={y:4d} #{p[0]:02x}{p[1]:02x}{p[2]:02x}")
            prev = k
