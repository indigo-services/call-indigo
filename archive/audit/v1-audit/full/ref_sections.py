from PIL import Image
im = Image.open(r"C:/tmp/indigo/01_Home.jpg").convert("RGB")
W,H=im.size; px=im.load()

def classify(p):
    r,g,b = p
    if r>=250 and g>=250 and b>=250: return "WHITE"
    if abs(r-245)<7 and abs(g-248)<7 and abs(b-255)<7: return "MIST"
    if b>r+30 and b>120 and r<120: return "INDIGO"
    if r<40 and g<60 and b<90: return "DARKNAVY"
    return "other"

# use x=20 (page gutter) AND x=960 (centre) to detect slab presence
prev=None; start=0; segs=[]
for y in range(H):
    c = classify(px[960,y])
    if c != prev:
        if prev is not None: segs.append((start,y-1,prev))
        prev=c; start=y
segs.append((start,H-1,prev))
merged=[]
for a,b,c in segs:
    if merged and merged[-1][2]==c and a-merged[-1][1]<=2: merged[-1]=(merged[-1][0],b,c)
    else: merged.append((a,b,c))
print("=== reference section map (centre column x=960) ===")
print(f"{'y range':>18} {'h':>6}  class    slab-x-extent")
for a,b,c in merged:
    if b-a+1>=10:
        # slab extent at the middle row
        y=(a+b)//2
        L=next((x for x in range(W) if classify(px[x,y])!="WHITE"), None)
        R=next((x for x in range(W-1,-1,-1) if classify(px[x,y])!="WHITE"), None)
        ext = "full-bleed" if (L is not None and L<44) else (f"L={L} R={R} w={R-L+1}" if L else "-")
        print(f"{a:6d}..{b:6d} {b-a+1:6d}  {c:<8} {ext}")
