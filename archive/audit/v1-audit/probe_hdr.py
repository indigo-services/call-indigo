from playwright.sync_api import sync_playwright
import pathlib
CHROME = r"C:/Users/jaden.black/AppData/Local/ms-playwright/chromium-1243/chrome-win64/chrome.exe"
for name,url in [("PROTO",r"C:/tmp/indigo/valvoro-prototype/index.html"),
                 ("REAL", r"C:/tmp/indigo/_audit/vlv/index.html")]:
    u=pathlib.Path(url).resolve().as_uri()
    with sync_playwright() as pw:
        b=pw.chromium.launch(executable_path=CHROME,args=['--no-sandbox','--disable-dev-shm-usage'])
        pg=b.new_page(viewport={'width':1440,'height':1000}); pg.goto(u,wait_until='load'); pg.wait_for_timeout(1800)
        d=pg.evaluate("""()=>{
          const q=s=>document.querySelector(s);
          const R=e=>{if(!e)return null;const r=e.getBoundingClientRect();const cs=getComputedStyle(e);
            return {y:+r.y.toFixed(1),h:+r.height.toFixed(1),pt:cs.paddingTop,pb:cs.paddingBottom,
                    pos:cs.position, cls:(e.className||'').toString().slice(0,50)};};
          return {header:R(q('header')),
                  topbar:R(q('.bg-topbar')),
                  heroSection:R(q('section')),
                  card:R(q('.rounded-card')||q('.banner-con'))};
        }""")
        print(f"===== {name} =====")
        for k,v in d.items(): print(f"  {k:12s} {v}")
        b.close()
