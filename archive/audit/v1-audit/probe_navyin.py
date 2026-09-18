from playwright.sync_api import sync_playwright
import pathlib, json
CHROME = r"C:/Users/jaden.black/AppData/Local/ms-playwright/chromium-1243/chrome-win64/chrome.exe"
for name,url in [("PROTO",r"C:/tmp/indigo/valvoro-prototype/index.html"),
                 ("REAL", r"C:/tmp/indigo/_audit/vlv/index.html")]:
    u = pathlib.Path(url).resolve().as_uri()
    with sync_playwright() as pw:
        b = pw.chromium.launch(executable_path=CHROME, args=["--no-sandbox","--disable-dev-shm-usage"])
        pg = b.new_page(viewport={"width":1440,"height":1000})
        pg.goto(u, wait_until="load"); pg.wait_for_timeout(2000)
        d = pg.evaluate("""() => {
          const box=document.querySelector('.navy-box'); if(!box) return null;
          const cs=getComputedStyle(box);
          const kids=[...box.querySelectorAll('*')].map(el=>{
            const r=el.getBoundingClientRect(); const s=getComputedStyle(el);
            return {tag:el.tagName, txt:(el.textContent||'').trim().slice(0,26),
                    w:+r.width.toFixed(1), h:+r.height.toFixed(1), y:+r.y.toFixed(1),
                    fs:s.fontSize, lh:s.lineHeight, fw:s.fontWeight,
                    mb:s.marginBottom, mt:s.marginTop, disp:s.display};
          });
          return {box:{w:+box.getBoundingClientRect().width.toFixed(1),
                       h:+box.getBoundingClientRect().height.toFixed(1),
                       pt:cs.paddingTop,pb:cs.paddingBottom,pl:cs.paddingLeft,pr:cs.paddingRight},
                  kids};
        }""")
        print(f"===== {name} =====")
        if d:
            print(f"  box: {d['box']}")
            for k in d['kids']:
                print(f"   {k['tag']:5s} {k['txt']:26s} w={k['w']:6.1f} h={k['h']:6.1f} y={k['y']:7.1f}"
                      f" fs={k['fs']:>6s} lh={k['lh']:>7s} fw={k['fw']:>3s} mb={k['mb']:>7s} disp={k['disp']}")
        b.close()
