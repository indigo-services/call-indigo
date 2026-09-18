from playwright.sync_api import sync_playwright
import json, pathlib
CHROME = r"C:/Users/jaden.black/AppData/Local/ms-playwright/chromium-1243/chrome-win64/chrome.exe"
u = pathlib.Path(r"C:/tmp/indigo/_audit/vlv/index.html").resolve().as_uri()
with sync_playwright() as pw:
    b = pw.chromium.launch(executable_path=CHROME, args=["--no-sandbox","--disable-dev-shm-usage"])
    for vw in (1440, 1300, 1200, 1199, 992, 991, 768, 576, 390):
        pg = b.new_page(viewport={"width":vw,"height":900})
        pg.goto(u, wait_until="load"); pg.wait_for_timeout(1600)
        d = pg.evaluate("""() => {
          const q=s=>document.querySelector(s);
          const R=e=>{if(!e)return null;const r=e.getBoundingClientRect();
            return {w:+r.width.toFixed(1),x:+r.x.toFixed(1)};};
          return { banner:R(q('.banner-con')),
                   mainC:R(q('.banner-con .main-container')),
                   wrapper:R(q('.banner-con .wrapper1711')),
                   h1:R(q('h1')),
                   bannerContent:R(q('.banner-content-con')) };
        }""")
        bn = d['banner']; mc = d['mainC']; wr = d['wrapper']
        print(f"vw={vw:5d}  banner={bn['w'] if bn else 0:7.1f} @x={bn['x'] if bn else 0:6.1f}"
              f"   mainC={mc['w'] if mc else 0:7.1f}"
              f"   wrapper={wr['w'] if wr else 0:7.1f}"
              f"   h1={d['h1']['w'] if d['h1'] else 0:7.1f}"
              f"   content={d['bannerContent']['w'] if d['bannerContent'] else 0:7.1f}")
        pg.close()
    b.close()
