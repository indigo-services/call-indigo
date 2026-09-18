from PIL import Image, ImageDraw
p = r"C:/Users/jaden.black/.workbuddy-ai/clipboard-images/clipboard-2026-09-18T00-07-47-206Z-427f47ad.jpg"
im = Image.open(p).convert("RGB")
px = im.load()
# utility bar vertical extent at x=900 (dark navy pill)
def dark(p): return p[0]<70 and p[1]<80 and p[2]<115
ys=[y for y in range(0,120) if dark(px[900,y])]
print("util bar vert src", min(ys), max(ys), "h css", (max(ys)-min(ys)+1)/2)
ym=(min(ys)+max(ys))//2
xs=[x for x in range(0,1920) if dark(px[x,ym])]
print("util bar horiz src", min(xs), max(xs), "css", min(xs)/2, max(xs)/2)
# hero card top+left
def brand(p): return p[2]>110 and p[2]>p[0]+25 and p[0]<135
ys2=[y for y in range(120,260) if brand(px[400,y])]
print("hero top src", min(ys2), "css", min(ys2)/2)
xs2=[x for x in range(0,400) if brand(px[x,400])]
print("hero left src", min(xs2), "css", min(xs2)/2)
xs3=[x for x in range(1700,1920) if brand(px[x,400])]
print("hero right src", max(xs3), "css", max(xs3)/2)
# hero bottom: last blue row at x=1900
ys3=[y for y in range(200,1118) if brand(px[1900,y])]
print("hero bottom at x=1900 src", max(ys3), "css", max(ys3)/2)
