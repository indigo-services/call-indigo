from playwright.sync_api import sync_playwright
import json, pathlib
CHROME = r"C:/Users/jaden.black/AppData/Local/ms-playwright/chromium-1243/chrome-win64/chrome.exe"
PROTO = pathlib.Path(r"C:/tmp/indigo/valvoro-prototype/index.html").resolve().as_uri()
with sync_playwright() as pw:
    b = pw.chromium.launch(executable_path=CHROME, args=["--no-sandbox","--disable-dev-shm-usage"])
    pg = b.new_page(viewport={"width":1440,"height":1100})
    pg.goto(PROTO, wait_until="load"); pg.wait_for_timeout(2200)
    out = pg.evaluate("""() => {
      const links=[...document.querySelectorAll('a')];
      return links.map(a=>{
        const r=a.getBoundingClientRect();
        const cs=getComputedStyle(a);
        return {href:a.getAttribute('href'), cls:a.className.slice(0,70),
                w:+r.width.toFixed(1), h:+r.height.toFixed(1),
                x:+r.x.toFixed(1), y:+r.y.toFixed(1),
                display:cs.display, pos:cs.position};
      }).filter(o=>o.h>60 || /Emergency/i.test(o.cls));
    }""")
    print(json.dumps(out, indent=2))
    b.close()
