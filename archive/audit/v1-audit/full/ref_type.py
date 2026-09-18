from PIL import Image
im = Image.open(r"C:/tmp/indigo/01_Home.jpg").convert("RGB")
W,H=im.size; px=im.load()

def ink_rows(y0,y1,x0=200,x1=1720,thr=420):
    rows=[]
    for y in range(y0,y1):
        c=sum(1 for x in range(x0,x1,2) if sum(px[x,y])<thr)
        rows.append((y,c))
    return rows

def biggest_text_block(y0,y1,minc=6):
    rows=ink_rows(y0,y1)
    runs=[]; s=None
    for y,c in rows:
        if c>=minc:
            if s is None: s=y
            last=y
        else:
            if s is not None and last-s+1>=6: runs.append((s,last))
            s=None
    if s is not None: runs.append((s,last))
    runs.sort(key=lambda r:-(r[1]-r[0]))
    return runs[:4]

for name,(a,b) in [("about",(1150,1800)),("services",(1900,2400)),("faq",(8400,8900)),("choose",(2950,3400))]:
    runs = biggest_text_block(a,b)
    print(f"{name:10s} band {a}..{b}: largest text blocks (y0,y1,h) -> {[(r[0],r[1],r[1]-r[0]+1) for r in runs]}")
