from PIL import Image
im = Image.open(r"C:/tmp/indigo/01_Home.jpg").convert("RGB")
px=im.load()

def inkcols(y0,y1,x0,x1,thr=330):
    cols=[x for x in range(x0,x1) if any(sum(px[x,y])<thr for y in range(y0,y1))]
    return cols

def inkrows(x0,x1,y0,y1,thr=330):
    return [y for y in range(y0,y1) if sum(1 for x in range(x0,x1) if sum(px[x,y])<thr)>0]

# find nav word clusters across the header band
band=(85,110)
cols = inkcols(band[0],band[1],250,1750)
# group into runs
runs=[]; 
if cols:
    s=cols[0]; p=cols[0]
    for c in cols[1:]:
        if c-p>12:
            runs.append((s,p)); s=c
        p=c
    runs.append((s,p))
print("ink clusters x-ranges in nav band (y 85..110):")
for a,b in runs:
    rr = inkrows(a,b+1,70,130)
    print(f"  x {a:5d}-{b:5d}  w={b-a+1:4d}   ink rows y {rr[0] if rr else '-'}..{rr[-1] if rr else '-'}  h={(rr[-1]-rr[0]+1) if rr else 0}")
