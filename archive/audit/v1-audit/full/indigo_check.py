from PIL import Image
im = Image.open(r"C:/tmp/indigo/01_Home.jpg").convert("RGB")
OUT=r"C:/tmp/indigo/_audit/full"
strips = [("estimate", 3640, 4000), ("area", 7700, 8330), ("cta", 9630, 10200)]
tiles=[]
for name,a,b in strips:
    c = im.crop((0,a,1920,b))
    c = c.resize((900, int(c.height*900/1920)), Image.LANCZOS)
    tiles.append((name,c))
W = max(t.width for _,t in tiles)
H = sum(t.height+22 for _,t in tiles)
canvas = Image.new("RGB",(W,H),(255,255,255))
from PIL import ImageDraw
d=ImageDraw.Draw(canvas); y=0
for name,t in tiles:
    d.text((6,y+5), name, fill=(0,0,0)); y+=22
    canvas.paste(t,(0,y)); y+=t.height
canvas.save(OUT+r"\ref_indigo_sections.png")
print("saved", canvas.size)

# about slab internal padding: first non-mist row inside the slab
px=im.load()
def ismist(p): return abs(p[0]-245)<9 and abs(p[1]-248)<9 and abs(p[2]-255)<9
for y in range(1125, 1400):
    row_has = any(not ismist(px[x,y]) for x in range(60,1860))
    if row_has:
        print("about slab top =1125 ; first content row =", y, "=> top padding =", y-1125); break
for y in range(1853, 1600, -1):
    row_has = any(not ismist(px[x,y]) for x in range(60,1860))
    if row_has:
        print("about slab bottom=1853 ; last content row =", y, "=> bottom padding =", 1853-y); break
