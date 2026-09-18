from PIL import Image, ImageDraw
import os
D = r"C:/tmp/indigo/valvoro-prototype/assets/images"
names = ["banner-bg-img.jpg","price-estimation-bg-img.jpg","cta-bg-img.jpg","sub-banner-img.jpg","cta-img.jpg"]
tiles=[]
for n in names:
    p=os.path.join(D,n)
    if not os.path.exists(p): print("MISSING", n); continue
    im=Image.open(p).convert("RGB")
    small=im.resize((16,16))
    px=list(small.getdata())
    mean=tuple(sum(c[i] for c in px)//len(px) for i in range(3))
    print(f"{n:34s} {im.size[0]}x{im.size[1]}  mean=#{mean[0]:02x}{mean[1]:02x}{mean[2]:02x} rgb{mean}")
    t=im.copy(); t.thumbnail((300,300)); tiles.append((n,t))
W=sum(t.width+10 for _,t in tiles); H=max(t.height for _,t in tiles)+24
c=Image.new("RGB",(W,H),(255,255,255)); d=ImageDraw.Draw(c); x=0
for n,t in tiles:
    d.text((x+4,4), n[:28], fill=(0,0,0)); c.paste(t,(x,22)); x+=t.width+10
c.save(r"C:/tmp/indigo/_audit/full/bg_assets.png"); print("saved", c.size)
