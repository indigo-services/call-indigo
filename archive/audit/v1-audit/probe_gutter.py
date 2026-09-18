from playwright.sync_api import sync_playwright
import pathlib, json
CHROME = r"C:/Users/jaden.black/AppData/Local/ms-playwright/chromium-1243/chrome-win64/chrome.exe"
u = pathlib.Path(r"C:/tmp/indigo/_audit/vlv/index.html").resolve().as_uri()
with sync_playwright() as pw:
    b = pw.chromium.launch(executable_path=CHROME, args=["--no-sandbox","--disable-dev-shm-usage"])
    for vw in (1440, 1300, 1200, 1199, 992, 768, 576, 390):
        pg = b.new_page(viewport={"width":vw,"height":900})
        pg.goto(u, wait_until="load"); pg.wait_for_timeout(1500)
        d = pg.evaluate("""() => {
          const w=document.querySelector('.banner-con .wrapper1711');
          if(!w) return null;
          const cs=getComputedStyle(w);
          return {pl:cs.paddingLeft, pr:cs.paddingRight, mw:cs.maxWidth, w:cs.width,
                  cls:w.className};
        }""")
        bn = None
        print(f"vw={vw:5d}  wrapper pl={d['pl'] if d else '-':>7s} pr={d['pr'] if d else '-':>7s} "
              f"maxW={d['mw'] if d else '-':>9s} w={d['w'] if d else '-':>9s}  cls={d['cls'] if d else '-'}")
        pg.close()
    b.close()
