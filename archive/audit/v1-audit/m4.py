from PIL import Image
p = r"C:/Users/jaden.black/.workbuddy-ai/clipboard-images/clipboard-2026-09-18T00-07-47-206Z-427f47ad.jpg"
im = Image.open(p).convert("RGB"); px=im.load()
# The white page margin right of the hero: find where white starts on a hero row
for y in (500, 700):
    xs=[x for x in range(1800,1920) if px[x,y][0]>245 and px[x,y][1]>245 and px[x,y][2]>245]
    print("y",y,"first white src", min(xs) if xs else None, "css", (min(xs)/2 if xs else None))
# util bar pill left/right edges precisely
def dark(p): return p[0]<70 and p[1]<80 and p[2]<115
ym=30
xs=[x for x in range(0,1920) if dark(px[x,ym])]
print("util pill src", min(xs), max(xs), "css", min(xs)/2, max(xs)/2)
# home pill (sky) at header row
def sky(p): return p[2]>200 and p[1]>150 and p[0]<190 and p[2]>=p[1]
for y in (95, 100, 105):
    xs2=[x for x in range(300,900) if sky(px[x,y])]
    if xs2: print("sky pill y",y,"src",min(xs2),max(xs2),"css",min(xs2)/2,max(xs2)/2)
