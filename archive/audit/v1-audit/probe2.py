from playwright.sync_api import sync_playwright
import json, pathlib
CHROME = r"C:/Users/jaden.black/AppData/Local/ms-playwright/chromium-1243/chrome-win64/chrome.exe"
PROTO = pathlib.Path(r"C:/tmp/indigo/valvoro-prototype/index.html").resolve().as_uri()
with sync_playwright() as pw:
    b = pw.chromium.launch(executable_path=CHROME, args=["--no-sandbox","--disable-dev-shm-usage"])
    pg = b.new_page(viewport={"width":1440,"height":1100})
    pg.goto(PROTO, wait_until="load"); pg.wait_for_timeout(2200)
    out = pg.evaluate("""() => {
      const el=document.querySelector('.bg-topbar');
      if(!el) return {found:false};
      const r=el.getBoundingClientRect(); const cs=getComputedStyle(el);
      const p=el.parentElement, pr=p.getBoundingClientRect(), pcs=getComputedStyle(p);
      return {found:true,
        box:{w:+r.width.toFixed(1),h:+r.height.toFixed(1),x:+r.x.toFixed(1),y:+r.y.toFixed(1)},
        display:cs.display, position:cs.position,
        parent:{cls:p.className, w:+pr.width.toFixed(1), h:+pr.height.toFixed(1),
                x:+pr.x.toFixed(1), y:+pr.y.toFixed(1), pos:pcs.position, disp:pcs.display},
        grandparent:{cls:p.parentElement.className.slice(0,90),
                     w:+p.parentElement.getBoundingClientRect().width.toFixed(1)},
        windowInner: window.innerWidth,
      };
    }""")
    print(json.dumps(out, indent=2))
    b.close()
