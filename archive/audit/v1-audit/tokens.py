from PIL import Image
im = Image.open(r"C:/Users/jaden.black/.workbuddy-ai/clipboard-images/clipboard-2026-09-18T00-07-47-206Z-427f47ad.jpg").convert("RGB")
px=im.load()
def sample(x,y,label):
    print(f"{label:26s} src({x},{y}) = {px[x,y]}  -> #{px[x,y][0]:02x}{px[x,y][1]:02x}{px[x,y][2]:02x}")
sample(900,30,"utility bar bg")
sample(1100,400,"hero card bg (mid)")
sample(300,300,"hero card bg (left)")
sample(520,100,"Home pill")
sample(100,60,"page bg")
# Active pill sky
print()
# find the most common colour in the hero card
from collections import Counter
c=Counter()
for y in range(300,900,7):
    for x in range(60,1800,7):
        c[px[x,y]]+=1
print("top hero colours:")
for col,n in c.most_common(6):
    print(f"   #{col[0]:02x}{col[1]:02x}{col[2]:02x}  n={n}")
