from PIL import Image
im = Image.open(r"C:/tmp/indigo/01_Home.jpg").convert("RGB")
W,H=im.size; px=im.load()
X=20   # inside the page gutter, outside the 48px slab inset
Y=960
print("page gutter colour samples (x=20):", [px[20,y] for y in (300,2000,4000,8000,10400)])
print("outside shell (x=20) vs inside slab (x=60) at a few rows:")
for y in (300, 1200, 2000, 3000, 3800, 5600, 7000, 7900, 8500, 9800, 10300):
    print(f"  y={y:6d}  x20={px[20,y]}  x60={px[60,y]}  x960={px[960,y]}")

print("\n--- runs at x=960 (centre column), colour changes only ---")
def q(p): return tuple(v//6*6 for v in p)
prev=None; start=0; runs=[]
for y in range(H):
    c=q(px[960,y])
    if c!=prev:
        if prev is not None: runs.append((start,y-1,prev))
        prev=c; start=y
runs.append((start,H-1,prev))
merged=[]
for a,b,c in runs:
    if merged and merged[-1][2]==c and a-merged[-1][1]<=3:
        merged[-1]=(merged[-1][0],b,c)
    else: merged.append((a,b,c))
for a,b,c in merged:
    if b-a+1>=6:
        print(f"  y {a:6d}..{b:6d} h={b-a+1:6d} #{c[0]:02x}{c[1]:02x}{c[2]:02x}")
