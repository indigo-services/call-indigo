from playwright.sync_api import sync_playwright
import pathlib

OUT = pathlib.Path("C:/tmp/indigo/_audit/v2check/shots")
BASE = "file:///C:/tmp/indigo/valvoro-prototype/"

with sync_playwright() as p:
    b = p.chromium.launch()
    for w, h in [(1440, 900), (390, 844)]:
        pg = b.new_page(viewport={"width": w, "height": h}, device_scale_factor=2)
        pg.goto(BASE + "index.html", wait_until="load", timeout=60000)
        pg.wait_for_timeout(2600)
        pg.click('footer [data-legal="terms"]')
        pg.wait_for_timeout(700)
        pg.eval_on_selector("#legal-terms .legal-body", "el => el.scrollTop = el.scrollHeight * 0.45")
        pg.wait_for_timeout(450)
        left = 0 if w < 768 else 220
        pg.screenshot(path=str(OUT / ("zoom_bar_%d.png" % w)),
                      clip={"x": left, "y": 0, "width": min(w - left, 1000), "height": 150})
        pg.close()
    b.close()
print("ok")
