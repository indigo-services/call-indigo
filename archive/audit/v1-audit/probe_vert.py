from playwright.sync_api import sync_playwright
import pathlib
CHROME = r"C:/Users/jaden.black/AppData/Local/ms-playwright/chromium-1243/chrome-win64/chrome.exe"
u = pathlib.Path(r"C:/tmp/indigo/_audit/vlv/index.html").resolve().as_uri()
with sync_playwright() as pw:
    b = pw.chromium.launch(executable_path=CHROME, args=["--no-sandbox","--disable-dev-shm-usage"])
    pg = b.new_page(viewport={"width":1440,"height":1000})
    pg.goto(u, wait_until="load"); pg.wait_for_timeout(2000)
    d = pg.evaluate("""() => {
      const q=s=>document.querySelector(s);
      const R=e=>{if(!e)return null;const r=e.getBoundingClientRect();const cs=getComputedStyle(e);
        return {y:+r.y.toFixed(1),h:+r.height.toFixed(1),pt:cs.paddingTop,pb:cs.paddingBottom,
                mt:cs.marginTop,mb:cs.marginBottom};};
      return {section:R(q('.banner-con')),
              wrapper:R(q('.banner-con .wrapper1711')),
              inner:R(q('.banner-inner-con')),
              row:R(q('.banner-con .row')),
              col:R(q('.banner-con .col-lg-6')),
              contentCon:R(q('.banner-content-con')),
              top:R(q('.banner-top')),
              rating:R(q('.rating-con')),
              h1:R(q('h1')),
              bottom:R(q('.banner-bottom')),
      };
    }""")
    for k,v in d.items(): print(f"  {k:11s} {v}")
    b.close()
