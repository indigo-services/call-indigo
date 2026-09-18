from playwright.sync_api import sync_playwright
import pathlib
CHROME = r"C:/Users/jaden.black/AppData/Local/ms-playwright/chromium-1243/chrome-win64/chrome.exe"
OUT = pathlib.Path(r"C:/tmp/indigo/_audit")
with sync_playwright() as pw:
    b = pw.chromium.launch(executable_path=CHROME, args=["--no-sandbox","--disable-dev-shm-usage"])
    for name, url in [("proto", r"C:/tmp/indigo/valvoro-prototype/index.html"),
                      ("real",  r"C:/tmp/indigo/_audit/vlv/index.html")]:
        pg = b.new_page(viewport={"width":1440,"height":1000}, device_scale_factor=1)
        pg.goto(pathlib.Path(url).resolve().as_uri(), wait_until="load")
        pg.wait_for_timeout(2500)
        pg.add_style_tag(content="*{animation-play-state:paused!important;transition:none!important}")
        pg.wait_for_timeout(400)
        pg.screenshot(path=str(OUT/f"hero_{name}.png"),
                      clip={"x":0,"y":0,"width":1440,"height":820})
        pg.close()
    b.close()
print("done")
