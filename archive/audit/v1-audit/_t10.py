from playwright.sync_api import sync_playwright
import pathlib
CHROME = (r"C:/Users/jaden.black/AppData/Local/ms-playwright"
          r"\chromium-1243\chrome-win64\chrome.exe")
REAL = pathlib.Path(r"C:/tmp/indigo/_audit/vlv/index.html").resolve().as_uri()
JS = """() => {
  const g = (sel) => { const e=document.querySelector(sel); if(!e) return null;
    const r=e.getBoundingClientRect(); const c=getComputedStyle(e);
    return {sel, tag:e.tagName, x:+r.x.toFixed(1), y:+r.y.toFixed(1), w:+r.width.toFixed(1), h:+r.height.toFixed(1),
            disp:c.display, ta:c.textAlign, pos:c.position, w0:c.width, maxW:c.maxWidth, float:c.float}; };
  const pl = document.querySelector('.plumber-img');
  const inner = pl ? pl.querySelector('img') : null;
  return {fig: g('.plumber-img'), inner: g('.plumber-img img'),
          archFig: g('.banner-img1'), archImg: g('.banner-img1 img'),
          stats: g('.statistics-wrapper'),
          bannerImgCon: g('.banner-img-con'),
          plFloat: pl ? getComputedStyle(pl).float : null,
          innerFloat: inner ? getComputedStyle(inner).float : null};
}"""
with sync_playwright() as pw:
    b = pw.chromium.launch(executable_path=CHROME, args=["--no-sandbox"])
    for vw in (767, 390):
        pg = b.new_page(viewport={"width": vw, "height": 1200})
        pg.goto(REAL, wait_until="load"); pg.wait_for_timeout(2000)
        d = pg.evaluate(JS)
        print(f"--- REAL vw {vw} ---")
        for k, v in d.items():
            print(f"   {k:14} {v}")
        pg.close()
    b.close()
