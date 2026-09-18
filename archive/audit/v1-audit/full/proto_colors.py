from PIL import Image
from collections import Counter
im = Image.open(r"C:/tmp/indigo/_audit/full/proto_1920_full.png").convert("RGB"); px=im.load()
print("proto render", im.size)
def modal(y0,y1,x0,x1):
    c=Counter()
    for y in range(y0,y1):
        for x in range(x0,x1,3): c[px[x,y]]+=1
    return c.most_common(1)[0]
spots = {
 "topbar":        (5,38, 300,1600),
 "hero card":     (250,800, 60,300),
 "about mist":    (1000,2000, 5,30),
 "estimate indigo":(4500,5000, 5,30),
 "area":          (6800,7150, 5,30),
 "cta":           (8300,8800, 5,30),
 "footer":        (8900,9250, 5,30),
 "page bg":       (500,800, 5,30),
}
for k,(y0,y1,x0,x1) in spots.items():
    (col,n)=modal(y0,y1,x0,x1)
    print(f"{k:18s} -> #{col[0]:02x}{col[1]:02x}{col[2]:02x}  rgb{col} (n={n})")
