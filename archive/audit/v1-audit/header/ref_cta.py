from PIL import Image
im = Image.open(r"C:/tmp/indigo/01_Home.jpg").convert("RGB")
px=im.load()
# find the sky/cyan pill in the header band y 70..125
def issky(p):
    r,g,b=p
    return b>180 and g>150 and r<160
rows={}
for y in range(70,130):
    xs=[x for x in range(1300,1750) if issky(px[x,y])]
    if xs: rows[y]=(xs[0],xs[-1])
if rows:
    ys=sorted(rows)
    print("sky pill rows:", ys[0], "..", ys[-1], " height:", ys[-1]-ys[0]+1)
    for y in ys[:1]+ys[-1:]:
        print(f"  y={y} x {rows[y][0]}..{rows[y][1]} w={rows[y][1]-rows[y][0]+1}")
    x0=min(v[0] for v in rows.values()); x1=max(v[1] for v in rows.values())
    print(f"pill x {x0}..{x1} w={x1-x0+1}")
    # white text inside the pill (excluding the white arrow disc on the right)
    print("\nwhite text rows inside pill (x x0+8 .. x1-30):")
    for y in range(ys[0], ys[-1]+1):
        cnt=sum(1 for x in range(x0+8, x1-30) if sum(px[x,y])>720)
        if cnt: print(f"  y={y} white={cnt}")
else:
    print("no sky pill found")
