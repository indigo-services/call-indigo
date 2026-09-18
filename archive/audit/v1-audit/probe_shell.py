from playwright.sync_api import sync_playwright
import pathlib
CHROME = r"C:/Users/jaden.black/AppData/Local/ms-playwright/chromium-1243/chrome-win64/chrome.exe"
u = pathlib.Path(r"C:/tmp/indigo/valvoro-prototype/index.html").resolve().as_uri()
with sync_playwright() as pw:
    b = pw.chromium.launch(executable_path=CHROME, args=["--no-sandbox","--disable-dev-shm-usage"])
    for vw in (1440, 1300, 1200, 1199, 992, 991, 768, 576, 390):
        pg = b.new_page(viewport={"width":vw,"height":900})
        pg.goto(u, wait_until="load"); pg.wait_for_timeout(1500)
        d = pg.evaluate("""() => {
          const q=s=>document.querySelector(s);
          const R=e=>{if(!e)return null;const r=e.getBoundingClientRect();
            return {w:+r.width.toFixed(1),x:+r.x.toFixed(1)};};
          return {card:R(q('.rounded-card')),
                  h1:R(q('h1')),
                  docW:document.documentElement.scrollWidth, winW:window.innerWidth};
        }""")
        c=d['card']
        print(f"vw={vw:5d}  card={c['w'] if c else 0:7.1f} @x={c['x'] if c else 0:6.1f}"
              f"   h1={d['h1']['w'] if d['h1'] else 0:7.1f}"
              f"   scrollW={d['docW']} winW={d['winW']}"
              f"{'   <<< OVERFLOW' if d['docW']>d['winW']+1 else ''}")
        pg.close()
    b.close()
