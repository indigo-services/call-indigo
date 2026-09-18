from PIL import Image
im = Image.open(r"C:/Users/jaden.black/.workbuddy-ai/clipboard-images/clipboard-2026-09-18T02-39-38-955Z-dd5e06bf.png").convert("RGB")
W,H=im.size
px=im.load()
print("screenshot", W, H)

# nav band in the screenshot: find the row band of the nav text
# header band is below the top bar (top bar rows 40..139)
def inkrows(x0,x1,y0,y1,thr=330):
    return [y for y in range(y0,y1) if sum(1 for x in range(x0,x1) if sum(px[x,y])<thr)>0]

# locate nav items: scan the header band for dark ink columns
band=(190,240)
cols=[x for x in range(0,W) if any(sum(px[x,y])<330 for y in range(band[0],band[1]))]
runs=[]
if cols:
    s=cols[0]; p=cols[0]
    for c in cols[1:]:
        if c-p>25:
            runs.append((s,p)); s=c
        p=c
    runs.append((s,p))
print("ink clusters in header band y190..240:")
for a,b in runs:
    rr=inkrows(a,b+1,170,270)
    print(f"  x {a:5d}-{b:5d} w={b-a+1:5d}  rows y {rr[0] if rr else '-'}..{rr[-1] if rr else '-'} h={(rr[-1]-rr[0]+1) if rr else 0}")
