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
          const q=s=>document.querySelector(s);
          const R=e=>{if(!e)return null;const r=e.getBoundingClientRect();
            const cs=getComputedStyle(e);
            return {w:+r.width.toFixed(1),x:+r.x.toFixed(1),
                    pl:cs.paddingLeft,pr:cs.paddingRight};};
          // find the hero row
          const row = q('.banner-con .row') || q('.rounded-card .grid');
          const cols = row ? [...row.children].map(R) : [];
          return {row:R(row), cols,
                  content:R(q('.banner-content-con') || q('.rounded-card .grid > div:first-child')),
                  rowGap: row?getComputedStyle(row).gap:null,
                  rowClass: row?row.className:null};
        }""")
        print(f"===== {name} =====")
        print(f"  row {d['row']}  gap={d['rowGap']}  cls={d['rowClass']}")
        for i,c in enumerate(d['cols']): print(f"   col{i}: {c}")
        print(f"  content: {d['content']}")
        b.close()
