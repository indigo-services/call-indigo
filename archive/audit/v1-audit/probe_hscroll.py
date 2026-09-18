from playwright.sync_api import sync_playwright
import pathlib
CHROME = r"C:/Users/jaden.black/AppData/Local/ms-playwright/chromium-1243/chrome-win64/chrome.exe"
u = pathlib.Path(r"C:/tmp/indigo/valvoro-prototype/index.html").resolve().as_uri()
with sync_playwright() as pw:
    b = pw.chromium.launch(executable_path=CHROME, args=["--no-sandbox","--disable-dev-shm-usage"])
    for vw in (1440, 1200, 992, 991, 768, 576, 390):
        pg = b.new_page(viewport={"width":vw,"height":900})
        pg.goto(u, wait_until="load"); pg.wait_for_timeout(1800)
        d = pg.evaluate("""() => {
          const before = window.scrollX;
          window.scrollTo(9999, 0);
          const after = window.scrollX;
          window.scrollTo(before, 0);
          return {scrollable: after, bodyW: document.body.scrollWidth,
                  docW: document.documentElement.scrollWidth,
                  winW: window.innerWidth,
                  bodyOverflowX: getComputedStyle(document.body).overflowX};
        }""")
        real = "YES  <<<" if d['scrollable'] > 0 else "no"
        print(f"vw={vw:5d}  h-scrollable={real:9s} (max scrollX={d['scrollable']})"
              f"  bodyW={d['bodyW']} docW={d['docW']} winW={d['winW']} ovX={d['bodyOverflowX']}")
        pg.close()
    b.close()
