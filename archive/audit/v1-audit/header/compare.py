from playwright.sync_api import sync_playwright
from PIL import Image, ImageDraw
import pathlib

url = pathlib.Path(r"C:/tmp/indigo/valvoro-prototype/index.html").as_uri()
OUT = r"C:/tmp/indigo/_audit/header"

with sync_playwright() as p:
    br = p.chromium.launch()
    for w in (1920, 1440):
        pg = br.new_page(viewport={"width":w,"height":900}, device_scale_factor=1)
        pg.goto(url); pg.wait_for_timeout(900)
        pg.screenshot(path=rf"{OUT}\after_{w}_top.png", clip={"x":0,"y":0,"width":w,"height":150})
        pg.close()
    br.close()

ref = Image.open(r"C:/tmp/indigo/01_Home.jpg").convert("RGB").crop((0,0,1920,150))
aft = Image.open(OUT+r"\after_1920_top.png").convert("RGB")

GAP=16; LABEL=26
canvas = Image.new("RGB",(1920, 150*2+GAP+LABEL*2),(240,240,244))
d = ImageDraw.Draw(canvas)
d.text((10,6), "REFERENCE  (01_Home.jpg, 1920 viewport)", fill=(20,20,40))
canvas.paste(ref,(0,LABEL))
y2 = LABEL+150+GAP
d.text((10,y2-18), "AFTER  (prototype, 1920 viewport) — top corners square, 40px bottom radius", fill=(20,20,40))
canvas.paste(aft,(0,y2))
canvas.save(OUT+r"\compare_top_strip.png")

# corner zooms: reference bottom-left vs after bottom-left
rc = ref.crop((244,0,320,50)).resize((76*6,50*6), Image.NEAREST)
ac = aft.crop((20,0,96,50)).resize((76*6,50*6), Image.NEAREST)
z = Image.new("RGB",(76*6*2+24, 50*6+28),(240,240,244))
dz=ImageDraw.Draw(z)
dz.text((6,6),"REFERENCE", fill=(20,20,40)); dz.text((76*6+30,6),"AFTER", fill=(20,20,40))
z.paste(rc,(0,28)); z.paste(ac,(76*6+24,28))
z.save(OUT+r"\compare_corner_zoom.png")
print("saved compare images")
