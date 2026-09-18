from PIL import Image
from collections import Counter
im = Image.open(r"C:/tmp/indigo/01_Home.jpg").convert("RGB"); px=im.load()

def modal(y0,y1,x0,x1):
    c=Counter()
    for y in range(y0,y1):
        for x in range(x0,x1,3):
            c[px[x,y]]+=1
    return c.most_common(3)

spots = {
 "topbar (0..42)":            (5,40, 300,1600),
 "hero card (149..1074)":     (200,900, 60,300),
 "about slab mist":           (1200,1800, 60,140),
 "choose slab mist":          (2950,3450, 60,140),
 "estimate slab (indigo)":    (3700,3950, 60,140),
 "gallery slab mist":         (5500,6400, 60,140),
 "area slab (indigo)":        (7750,8250, 60,140),
 "faq slab mist":             (8400,9100, 60,140),
 "cta slab (indigo)":         (9700,10100, 60,140),
 "footer (dark)":             (10250,10540, 60,140),
 "page bg":                   (600,900, 5,40),
}
for k,(y0,y1,x0,x1) in spots.items():
    m=modal(y0,y1,x0,x1)
    top = m[0]
    print(f"{k:28s} -> #{top[0][0]:02x}{top[0][1]:02x}{top[0][2]:02x}  rgb{top[0]}  (count {top[1]})")
