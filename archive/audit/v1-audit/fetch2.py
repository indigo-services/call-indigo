from playwright.sync_api import sync_playwright
import pathlib
OUT = pathlib.Path("C:/tmp/indigo/_audit/tf"); OUT.mkdir(parents=True, exist_ok=True)
url = "https://preview.themeforest.net/item/valvoro-plumbing-services-html-template/full_screen_preview/62644376"
with sync_playwright() as p:
    b = p.chromium.launch(args=["--disable-blink-features=AutomationControlled"])
    ctx = b.new_context(
        viewport={"width":1440,"height":1000}, device_scale_factor=1,
        user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        locale="en-US",
    )
    ctx.add_init_script("Object.defineProperty(navigator,'webdriver',{get:()=>undefined});")
    pg = ctx.new_page()
    pg.goto(url, wait_until="domcontentloaded", timeout=60000)
    for i in range(12):
        pg.wait_for_timeout(3000)
        t = pg.title()
        if "moment" not in t.lower():
            break
    print("TITLE:", pg.title())
    print("FRAMES:", [f.url for f in pg.frames])
    html = pg.content()
    (OUT/"dom.html").write_text(html, encoding="utf-8")
    print("len", len(html))
    pg.screenshot(path=str(OUT/"tf_top.png"), clip={"x":0,"y":0,"width":1440,"height":900})
    ctx.close(); b.close()
