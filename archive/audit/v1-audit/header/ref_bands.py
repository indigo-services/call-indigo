from PIL import Image
im = Image.open(r"C:/tmp/indigo/01_Home.jpg").convert("RGB")
W,H=im.size
px=im.load()
def classify(p):
    r,g,b=p
    if r>245 and g>245 and b>245: return "white"
    if b>r+20 and b>90 and r<160: return "BLUE"   # indigo hero
    if sum(p)<200: return "DARK"
    return "other"
print("row samples: x=0,20,60,120,252,300,960,1600,1860,1900,1919")
for y in [0,10,20,30,42,50,60,80,100,120,140,160,180,200,240,280,320,360,400]:
    row=[classify(px[x,y])[:5] for x in [0,20,60,120,252,300,960,1600,1860,1900,1919]]
    print(f"y={y:4d}", " ".join(f"{v:>5}" for v in row))

# hero card horizontal extent: find blue-ish run in a row well inside the card
print()
for y in [400, 600, 800]:
    xs=[x for x in range(W) if classify(px[x,y])=="BLUE"]
    if xs: print(f"y={y}: blue from {xs[0]} to {xs[-1]}  width={xs[-1]-xs[0]+1}")
    else: print(f"y={y}: no blue")
