from playwright.sync_api import sync_playwright
import pathlib
CHROME = (r"C:/Users/jaden.black/AppData/Local/ms-playwright"
          r"\chromium-1243\chrome-win64\chrome.exe")
PROTO = pathlib.Path(r"C:/tmp/indigo/valvoro-prototype/index.html").resolve().as_uri()
JS = """() => { const s=document.querySelector('.hero-section'); const r=s.getBoundingClientRect();
  return {w:+r.width.toFixed(2), x:+r.x.toFixed(2)}; }"""
vals = {390:374.59, 480:461.00, 576:553.22, 640:614.69, 767:736.66, 768:737.63,
        991:951.78, 992:952.75, 1200:1152.50, 1300:1248.53, 1440:1383.00, 1600:1536.66, 1920:1820.00}
with sync_playwright() as pw:
    b = pw.chromium.launch(executable_path=CHROME, args=["--no-sandbox"])
    print(f"{'vw':>6} {'PROTO':>10} {'REAL':>10} {'delta':>8}")
    for vw, real in vals.items():
        pg = b.new_page(viewport={"width": vw, "height": 900})
        pg.goto(PROTO, wait_until="load"); pg.wait_for_timeout(1400)
        d = pg.evaluate(JS)
        print(f"{vw:>6} {d['w']:>10.2f} {real:>10.2f} {d['w']-real:>+8.2f}")
        pg.close()
    b.close()
