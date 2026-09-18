from playwright.sync_api import sync_playwright
import pathlib
CHROME = (r"C:/Users/jaden.black/AppData/Local/ms-playwright"
          r"\chromium-1243\chrome-win64\chrome.exe")
PROTO = pathlib.Path(r"C:/tmp/indigo/valvoro-prototype/index.html").resolve().as_uri()
REAL  = pathlib.Path(r"C:/tmp/indigo/_audit/vlv/index.html").resolve().as_uri()
JS = """() => {
  const g = s => { const e=document.querySelector(s); if(!e) return null; const r=e.getBoundingClientRect();
    const c=getComputedStyle(e);
    return {x:+r.x.toFixed(1),y:+r.y.toFixed(1),w:+r.width.toFixed(1),h:+r.height.toFixed(1),
            disp:c.display, txt:(e.textContent||'').trim().slice(0,22)}; };
  return {
    scrolOuter: g('.scrol-outer'),
    scrolArrow: g('.scroll-down-arrow'),
    scrolFig:   g('.scroll-down-arrow figure, .scroll-down-arrow span.grid, .scroll-down-arrow span'),
    firstPainter: g('.pointer-events-none.absolute.inset-x-0'),
  };
}"""
with sync_playwright() as pw:
    b = pw.chromium.launch(executable_path=CHROME, args=["--no-sandbox"])
    for vw in (1440, 992):
        print(f"--- vw {vw} ---")
        for tag, url in (("PROTO", PROTO), ("REAL ", REAL)):
            pg = b.new_page(viewport={"width": vw, "height": 1100})
            pg.goto(url, wait_until="load"); pg.wait_for_timeout(2200)
            d = pg.evaluate(JS)
            for k, v in d.items():
                print(f"  {tag} {k:12} {v}")
            pg.close()
    b.close()
