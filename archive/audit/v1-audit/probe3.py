from playwright.sync_api import sync_playwright
import json, pathlib
CHROME = r"C:/Users/jaden.black/AppData/Local/ms-playwright/chromium-1243/chrome-win64/chrome.exe"
PROTO = pathlib.Path(r"C:/tmp/indigo/valvoro-prototype/index.html").resolve().as_uri()
with sync_playwright() as pw:
    b = pw.chromium.launch(executable_path=CHROME, args=["--no-sandbox","--disable-dev-shm-usage"])
    pg = b.new_page(viewport={"width":1440,"height":1100})
    pg.goto(PROTO, wait_until="load"); pg.wait_for_timeout(2200)
    out = pg.evaluate("""() => {
      const res=[];
      document.querySelectorAll('.bg-topbar').forEach((el,i)=>{
        const r=el.getBoundingClientRect(); const cs=getComputedStyle(el);
        res.push({i, tag:el.tagName, cls:el.className.slice(0,90),
          w:+r.width.toFixed(1),h:+r.height.toFixed(1),x:+r.x.toFixed(1),y:+r.y.toFixed(1),
          disp:cs.display, pos:cs.position});
      });
      // and the emergency link specifically
      const em=[...document.querySelectorAll('a')].find(a=>/Emergency/.test(a.textContent));
      let e=null;
      if(em){const r=em.getBoundingClientRect();e={w:+r.width.toFixed(1),h:+r.height.toFixed(1),
        x:+r.x.toFixed(1),y:+r.y.toFixed(1),disp:getComputedStyle(em).display,
        pos:getComputedStyle(em).position, cls:em.className.slice(0,120)};}
      return {matches:res, emergency:e};
    }""")
    print(json.dumps(out, indent=2))
    b.close()
