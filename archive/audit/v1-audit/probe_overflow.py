from playwright.sync_api import sync_playwright
import pathlib, json
CHROME = r"C:/Users/jaden.black/AppData/Local/ms-playwright/chromium-1243/chrome-win64/chrome.exe"
u = pathlib.Path(r"C:/tmp/indigo/valvoro-prototype/index.html").resolve().as_uri()
with sync_playwright() as pw:
    b = pw.chromium.launch(executable_path=CHROME, args=["--no-sandbox","--disable-dev-shm-usage"])
    for vw in (768, 991, 1000):
        pg = b.new_page(viewport={"width":vw,"height":900})
        pg.goto(u, wait_until="load"); pg.wait_for_timeout(1800)
        d = pg.evaluate("""(vw) => {
          const bad=[];
          document.querySelectorAll('*').forEach(el=>{
            const r=el.getBoundingClientRect();
            if(r.right > vw + 1 && r.width > 0){
              bad.push({tag:el.tagName, cls:(el.className||'').toString().slice(0,80),
                        right:+r.right.toFixed(1), w:+r.width.toFixed(1),
                        x:+r.x.toFixed(1), y:+r.y.toFixed(1)});
            }
          });
          return bad.slice(0,14);
        }""", vw)
        print(f"\n===== vw {vw} — {len(d)} overflowing =====")
        for o in d: print(f"  {o['tag']:6s} right={o['right']:7.1f} w={o['w']:7.1f} x={o['x']:7.1f} y={o['y']:7.1f}  {o['cls']}")
        pg.close()
    b.close()
