from PIL import Image
im = Image.open(r"C:/Users/jaden.black/.workbuddy-ai/clipboard-images/clipboard-2026-09-18T02-39-38-955Z-dd5e06bf.png").convert("RGB")
W,H=im.size
px=im.load()
print("rows with dark ink (x 0..3134), screenshot", W, H)
prev=False
for y in range(0,H):
    cnt=sum(1 for x in range(0,W,2) if sum(px[x,y])<330)
    cur = cnt>4
    if cur!=prev:
        print(f"  y={y:4d} {'START' if cur else 'end  '} (cnt={cnt})")
    prev=cur

print()
print("nav word clusters, y 150..230:")
band=(150,230)
cols=[x for x in range(0,W) if any(sum(px[x,y])<330 for y in range(band[0],band[1]))]
runs=[]
if cols:
    s=cols[0]; p=cols[0]
    for c in cols[1:]:
        if c-p>20: runs.append((s,p)); s=c
        p=c
    runs.append((s,p))
for a,b in runs:
    rr=[y for y in range(band[0],band[1]) if sum(1 for x in range(a,b+1) if sum(px[x,y])<330)>0]
    print(f"  x {a:5d}-{b:5d} w={b-a+1:5d}  rows {rr[0] if rr else '-'}..{rr[-1] if rr else '-'} h={(rr[-1]-rr[0]+1) if rr else 0}")
