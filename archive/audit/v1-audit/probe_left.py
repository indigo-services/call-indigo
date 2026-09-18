from playwright.sync_api import sync_playwright
import pathlib
CHROME = r"C:/Users/jaden.black/AppData/Local/ms-playwright/chromium-1243/chrome-win64/chrome.exe"
for name,url in [("PROTO",r"C:/tmp/indigo/valvoro-prototype/index.html"),
                 ("REAL", r"C:/tmp/indigo/_audit/vlv/index.html")]:
    u=pathlib.Path(url).resolve().as_uri()
    with sync_playwright() as pw:
        b=pw.chromium.launch(executable_path=CHROME,args=['--no-sandbox','--disable-dev-shm-usage'])
        pg=b.new_page(viewport={'width':1440,'height':1000}); pg.goto(u,wait_until='load'); pg.wait_for_timeout(2000)
        d=pg.evaluate("""()=>{
          const q=s=>document.querySelector(s);
          const R=e=>{if(!e)return null;const r=e.getBoundingClientRect();const cs=getComputedStyle(e);
            return {w:+r.width.toFixed(1),h:+r.height.toFixed(1),x:+r.x.toFixed(1),y:+r.y.toFixed(1),
                    fs:cs.fontSize,lh:cs.lineHeight,mw:cs.minWidth,ml:cs.marginLeft,mb:cs.marginBottom};};
          return {p:R(q('.banner-lead')||q('.banner-content-con p')),
                  cta:R(q('.pill-lg')||q('.primary_btn')),
                  bottom:R(q('.banner-bottom')||q('.banner-img2').parentElement),
                  innerWrap:R(q('.inner-wrap'))};
        }""")
        print(f"===== {name} =====")
        for k,v in d.items(): print(f"  {k:10s} {v}")
        b.close()
