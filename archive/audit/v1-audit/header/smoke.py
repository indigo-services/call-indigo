from playwright.sync_api import sync_playwright
import pathlib

url = pathlib.Path(r"C:/tmp/indigo/valvoro-prototype/index.html").as_uri()
OUT = r"C:/tmp/indigo/_audit/header"
WIDTHS = [390, 768, 1024, 1279, 1280, 1322, 1440, 1920]

with sync_playwright() as p:
    br = p.chromium.launch()
    for w in WIDTHS:
        errs=[]; pg = br.new_page(viewport={"width":w,"height":900})
        pg.on("console", lambda m: errs.append(m.text) if m.type=="error" else None)
        pg.on("pageerror", lambda e: errs.append(str(e)))
        pg.goto(url); pg.wait_for_timeout(1100)
        broken = pg.evaluate("""() => [...document.images].filter(i=>!i.complete||i.naturalWidth===0).map(i=>i.getAttribute('src'))""")
        ovf = pg.evaluate("()=>document.documentElement.scrollWidth - innerWidth")
        bar = pg.evaluate("""()=>{const b=document.querySelector('.shell > div');const c=getComputedStyle(b);
            return c.borderTopLeftRadius+' '+c.borderTopRightRadius+' / '+c.borderBottomLeftRadius+' '+c.borderBottomRightRadius;}""")
        nav = pg.evaluate("()=>{const a=document.querySelector('header nav a');return getComputedStyle(a).fontSize;}")
        word = pg.evaluate("()=>getComputedStyle(document.querySelector('header .shell > div > a > span')).fontSize;")
        mark = pg.evaluate("()=>getComputedStyle(document.querySelector('header .shell > div > a > img')).height;")
        burgerVis = pg.evaluate("()=>getComputedStyle(document.querySelector('#burger')).display")
        navVis = pg.evaluate("()=>getComputedStyle(document.querySelector('header nav')).display")
        print(f"vw={w:>5} ovf={ovf:>3} | bar radius {bar:<24} | nav {nav:>7} word {word:>6} mark {mark:>6} | nav {navVis:<5} burger {burgerVis:<5} | broken imgs {len(broken)} | console errors {len(errs)}")
        if broken: print("   broken:", broken)
        if errs: print("   errs:", errs[:3])
        pg.screenshot(path=rf"{OUT}\final_{w}.png", clip={"x":0,"y":0,"width":w,"height":150})
        pg.close()
    br.close()
print("smoke done")
