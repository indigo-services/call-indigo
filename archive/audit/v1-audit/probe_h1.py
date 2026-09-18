from playwright.sync_api import sync_playwright
import json, pathlib
CHROME = r"C:/Users/jaden.black/AppData/Local/ms-playwright/chromium-1243/chrome-win64/chrome.exe"
for name, url in [("PROTO", r"C:/tmp/indigo/valvoro-prototype/index.html"),
                  ("REAL",  r"C:/tmp/indigo/_audit/vlv/index.html")]:
    u = pathlib.Path(url).resolve().as_uri()
    with sync_playwright() as pw:
        b = pw.chromium.launch(executable_path=CHROME, args=["--no-sandbox","--disable-dev-shm-usage"])
        pg = b.new_page(viewport={"width":1440,"height":1100})
        pg.goto(u, wait_until="load"); pg.wait_for_timeout(2200)
        out = pg.evaluate("""() => {
          const h=document.querySelector('h1');
          if(!h) return null;
          const r=h.getBoundingClientRect(); const cs=getComputedStyle(h);
          const range=document.createRange(); range.selectNodeContents(h);
          const rects=[...range.getClientRects()].map(x=>({w:+x.width.toFixed(1),h:+x.height.toFixed(1),y:+x.y.toFixed(1)}));
          return {box:{w:+r.width.toFixed(1),h:+r.height.toFixed(1),x:+r.x.toFixed(1),y:+r.y.toFixed(1)},
            font:cs.fontSize, lh:cs.lineHeight, weight:cs.fontWeight, ls:cs.letterSpacing,
            transform:cs.textTransform, family:cs.fontFamily.slice(0,60),
            lines:rects, text:h.textContent.trim()};
        }""")
        print(f"===== {name} ====="); print(json.dumps(out, indent=2))
        b.close()
