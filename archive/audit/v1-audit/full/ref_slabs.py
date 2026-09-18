from PIL import Image
im = Image.open(r"C:/tmp/indigo/01_Home.jpg").convert("RGB")
W,H = im.size
px = im.load()

def is_white(p, t=246):
    return p[0]>=t and p[1]>=t and p[2]>=t

def edges(y):
    L=None
    for x in range(0, W):
        if not is_white(px[x,y]): L=x; break
    R=None
    for x in range(W-1, -1, -1):
        if not is_white(px[x,y]): R=x; break
    return L,R

print("row | L  R  | slabW | colour@(L+3)")
prev=None; start=0; cur=None
segs=[]
for y in range(H):
    L,R = edges(y)
    key = (None if L is None else (L//4*4, R//4*4))
    if key != prev:
        if prev is not None: segs.append((start,y-1,prev))
        prev=key; start=y
segs.append((start,H-1,prev))

# merge tiny segments into neighbours for readability
print(f"{len(segs)} raw segments; showing those >=12 rows")
for a,b,k in segs:
    if b-a+1 >= 12:
        L,R = k if k else (None,None)
        col = px[L+3, (a+b)//2] if L is not None else None
        print(f"  y {a:6d}..{b:6d} h={b-a+1:6d} | L={L} R={R} | w={None if L is None else R-L+1} | #{col[0]:02x}{col[1]:02x}{col[2]:02x}" if col else f"  y {a:6d}..{b:6d} h={b-a+1:6d} | none")
