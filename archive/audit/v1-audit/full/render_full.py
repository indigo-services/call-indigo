from playwright.sync_api import sync_playwright
import pathlib
url = pathlib.Path(r"C:/tmp/indigo/valvoro-prototype/index.html").as_uri()
OUT=r"C:/tmp/indigo/_audit/full"
with sync_playwright() as p:
    br = p.chromium.launch()
    pg = br.new_page(viewport={"width":1920,"height":1200})
    pg.goto(url); pg.wait_for_timeout(1200)
    pg.evaluate("()=>{document.querySelectorAll('.reveal').forEach(e=>e.classList.add('visible'));}")
    pg.wait_for_timeout(900)
    pg.screenshot(path=OUT+r"\proto_1920_full.png", full_page=True)
    print("height:", pg.evaluate("()=>document.body.scrollHeight"))
    br.close()
from PIL import Image
im = Image.open(OUT+r"\proto_1920_full.png").convert("RGB")
print("render", im.size)
c = im.crop((0,856,1920,3661)); c=c.resize((1000,int(c.height*1000/1920)), Image.LANCZOS)
c.save(OUT+r"\proto_about_services.png"); print("saved", c.size)
