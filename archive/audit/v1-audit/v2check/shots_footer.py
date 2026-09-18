from playwright.sync_api import sync_playwright
import pathlib

OUT = pathlib.Path("C:/tmp/indigo/_audit/v2check/shots")
OUT.mkdir(parents=True, exist_ok=True)
BASE = "file:///C:/tmp/indigo/valvoro-prototype/"

with sync_playwright() as p:
    b = p.chromium.launch()

    # --- footer, all three pages ---
    for name in ["index", "residential", "commercial"]:
        for w, h in [(1440, 900), (390, 844)]:
            pg = b.new_page(viewport={"width": w, "height": h})
            pg.goto(BASE + name + ".html", wait_until="load", timeout=60000)
            pg.wait_for_timeout(2600)
            pg.locator("footer.slab").screenshot(path=str(OUT / ("footer_%s_%d.png" % (name, w))))
            pg.close()

    # --- modals on the home page ---
    for w, h in [(1440, 900), (390, 844)]:
        pg = b.new_page(viewport={"width": w, "height": h})
        pg.goto(BASE + "index.html", wait_until="load", timeout=60000)
        pg.wait_for_timeout(2600)

        pg.click('footer [data-legal="terms"]')
        pg.wait_for_timeout(700)
        pg.screenshot(path=str(OUT / ("modal_terms_top_%d.png" % w)))

        pg.eval_on_selector("#legal-terms .legal-body", "el => el.scrollTop = el.scrollHeight * 0.45")
        pg.wait_for_timeout(400)
        pg.screenshot(path=str(OUT / ("modal_terms_mid_%d.png" % w)))

        pg.eval_on_selector("#legal-terms .legal-body", "el => el.scrollTop = el.scrollHeight")
        pg.wait_for_timeout(400)
        pg.screenshot(path=str(OUT / ("modal_terms_end_%d.png" % w)))
        pg.keyboard.press("Escape")
        pg.wait_for_timeout(600)

        pg.click('footer [data-legal="privacy"]')
        pg.wait_for_timeout(700)
        pg.screenshot(path=str(OUT / ("modal_privacy_top_%d.png" % w)))
        pg.close()

    b.close()

for f in sorted(OUT.glob("*.png")):
    print(f.name, f.stat().st_size)
