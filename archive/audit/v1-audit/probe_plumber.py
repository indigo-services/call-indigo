from playwright.sync_api import sync_playwright
import pathlib
CHROME = r"C:/Users/jaden.black/AppData/Local/ms-playwright/chromium-1243/chrome-win64/chrome.exe"
for name,url in [("PROTO",r"C:/tmp/indigo/valvoro-prototype/index.html"),
                 ("REAL", r"C:/tmp/indigo/_audit/vlv/index.html")]:
    u = pathlib.Path(url).resolve().as_uri()
    with sync_playwright() as pw:
        b = pw.chromium.launch(executable_path=CHROME, args=["--no-sandbox","--disable-dev-shm-usage"])
        pg = b.new_page(viewport={"width":1440,"height":1000})
        pg.goto(u, wait_until="load"); pg.wait_for_timeout(2000)
        d = pg.evaluate("""() => {
          const q=s=>document.querySelector(s);
          const R=e=>{if(!e)return null;const r=e.getBoundingClientRect();const cs=getComputedStyle(e);
            return {x:+r.x.toFixed(1),y:+r.y.toFixed(1),w:+r.width.toFixed(1),h:+r.height.toFixed(1),
                    right:+r.right.toFixed(1), pos:cs.position, t:cs.top, r2:cs.right};};
          return {imgCon:R(q('.banner-img-con')),
                  archFig:R(q('.banner-img1')),
                  archImg:R(q('.banner-img1 img')),
                  plumber:R(q('.plumber-img')),
                  plumberImg:q('.plumber-img')?R(q('.plumber-img img')):null,
                  navy:R(q('.navy-box'))};
        }""")
        print(f"===== {name} =====")
        for k,v in d.items(): print(f"  {k:11s} {v}")
        b.close()
