from PIL import Image, ImageDraw
p = r"C:/Users/jaden.black/.workbuddy-ai/clipboard-images/clipboard-2026-09-18T00-07-47-206Z-427f47ad.jpg"
im = Image.open(p).convert("RGB")
c = im.crop((0,0,1920,300))
c = c.resize((1920,300), Image.LANCZOS)
d=ImageDraw.Draw(c)
for x in range(0,1920,40):
    d.line([(x,0),(x,300)], fill=(255,0,0), width=1)
    if x%80==0: d.text((x+1,2), str(x//2), fill=(255,255,0))
for y in range(0,300,20):
    d.line([(0,y),(1920,y)], fill=(0,255,0), width=1)
    if y%40==0: d.text((1000,y+1), str(y//2), fill=(0,255,180))
c.save("_audit/new_hdr.png"); print(c.size)
