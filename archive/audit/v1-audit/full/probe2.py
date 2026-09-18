from PIL import Image
from collections import Counter
REF = Image.open(r"C:/tmp/indigo/01_Home.jpg").convert("RGB")
PRO = Image.open(r"C:/tmp/indigo/_audit/full/proto_1920_full.png").convert("RGB")

def modal(im,y0,y1,x0,x1):
    px=im.load(); c=Counter()
    for y in range(y0,y1):
        for x in range(x0,x1): c[px[x,y]]+=1
    return c.most_common(1)[0]

print("MIST re-sample (large clean area):")
print("  REF about   y1300..1750 x 60..200 :", modal(REF,1300,1750,60,200))
print("  PRO about   y1000..1500 x 5..120  :", modal(PRO,1000,1500,5,120))
print("  PRO about   y2000..2350 x 900..1400:", modal(PRO,2000,2350,900,1400))

print("\nHERO background samples (avoiding content):")
for lbl,im,pts in [("REF",REF,[(200,300),(250,500),(900,300),(950,600),(1000,900),(400,1700),(500,1750)]),
                   ("PRO",PRO,[(200,300),(250,500),(900,300),(950,600),(1000,900),(400,1700),(500,1750)])]:
    px=im.load()
    print(f"  {lbl}: " + "  ".join(f"({x},{y})=#{px[x,y][0]:02x}{px[x,y][1]:02x}{px[x,y][2]:02x}" for x,y in pts))
