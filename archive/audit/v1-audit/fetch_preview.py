from playwright.sync_api import sync_playwright
import json, pathlib
OUT = pathlib.Path("C:/tmp/indigo/_audit/tf")
OUT.mkdir(parents=True, exist_ok=True)
url = "https://preview.themeforest.net/item/valvoro-plumbing-services-html-template/full_screen_preview/62644376"
with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={"width":1440,"height":1000}, device_scale_factor=1)
    pg.goto(url, wait_until="domcontentloaded", timeout=60000)
    pg.wait_for_timeout(6000)
    print("TITLE:", pg.title())
    print("URL:", pg.url)
    (OUT/"dom.html").write_text(pg.content(), encoding="utf-8")
    print("saved dom.html", len(pg.content()))
    pg.screenshot(path=str(OUT/"tf_top.png"), clip={"x":0,"y":0,"width":1440,"height":900})
    b.close()
