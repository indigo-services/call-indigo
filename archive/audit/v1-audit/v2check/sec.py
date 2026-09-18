from playwright.sync_api import sync_playwright
import pathlib

OUT = pathlib.Path("C:/tmp/indigo/_audit/v2check")
URL = "file:///C:/tmp/indigo/valvoro-prototype/index.html"

with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={"width": 1440, "height": 900}, device_scale_factor=1)
    pg.goto(URL, wait_until="load", timeout=60000)
    pg.wait_for_timeout(3500)
    pg.evaluate("document.querySelectorAll('.reveal').forEach(e=>e.classList.add('visible'))")
    pg.wait_for_timeout(600)
    for sel, name in [("#about", "about"), ("#services", "services"),
                      ("#estimate", "estimate"), ("#contact", "contact")]:
        el = pg.query_selector(sel)
        el.scroll_into_view_if_needed()
        pg.wait_for_timeout(400)
        el.screenshot(path=str(OUT / f"sec_{name}.png"))
        print("shot", name)
    b.close()
