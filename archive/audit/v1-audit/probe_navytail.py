from playwright.sync_api import sync_playwright
import pathlib
CHROME = r"C:/Users/jaden.black/AppData/Local/ms-playwright/chromium-1243/chrome-win64/chrome.exe"
u = pathlib.Path(r"C:/tmp/indigo/_audit/vlv/index.html").resolve().as_uri()
with sync_playwright() as pw:
    b = pw.chromium.launch(executable_path=CHROME, args=["--no-sandbox","--disable-dev-shm-usage"])
    pg = b.new_page(viewport={"width":1440,"height":1000})
    pg.goto(u, wait_until="load"); pg.wait_for_timeout(1800)
    d = pg.evaluate("""() => {
      const box=document.querySelector('.navy-box');
      const s2=box.querySelectorAll('span')[1];
      const a=box.querySelector('a');
      const img=a.querySelector('img');
      const R=e=>{const r=e.getBoundingClientRect();const cs=getComputedStyle(e);
        return {y:+r.y.toFixed(1),h:+r.height.toFixed(1),w:+r.width.toFixed(1),
                disp:cs.display,lh:cs.lineHeight,mb:cs.marginBottom,fs:cs.fontSize,
                va:cs.verticalAlign, fsz:cs.fontSize};};
      return {span2:R(s2), span2mb:getComputedStyle(s2).marginBottom,
              aBox:R(a), imgBox:R(img),
              boxY:+box.getBoundingClientRect().y.toFixed(1),
              boxB:+box.getBoundingClientRect().bottom.toFixed(1),
              boxPb:getComputedStyle(box).paddingBottom};
    }""")
    print(d)
    b.close()
