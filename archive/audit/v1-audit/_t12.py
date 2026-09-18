from playwright.sync_api import sync_playwright
import pathlib
CHROME = (r"C:/Users/jaden.black/AppData/Local/ms-playwright"
          r"\chromium-1243\chrome-win64\chrome.exe")
REAL = pathlib.Path(r"C:/tmp/indigo/_audit/vlv/index.html").resolve().as_uri()
JS = """() => {
  const sec = document.querySelector('.banner-con');
  const r = sec.getBoundingClientRect();
  return {secW:+r.width.toFixed(2), secX:+r.x.toFixed(2), winW: window.innerWidth,
          diff:+(window.innerWidth - r.width).toFixed(2),
          ratio:+(r.width/window.innerWidth).toFixed(5)};
}"""
with sync_playwright() as pw:
    b = pw.chromium.launch(executable_path=CHROME, args=["--no-sandbox"])
    for vw in (390, 480, 576, 640, 767, 768, 991, 992, 1200, 1300, 1440, 1600):
        pg = b.new_page(viewport={"width": vw, "height": 900})
        pg.goto(REAL, wait_until="load"); pg.wait_for_timeout(1500)
        d = pg.evaluate(JS)
        print(f"  vw={vw:5d}  banner w={d['secW']:>8}  x={d['secX']:>7}  vw-w={d['diff']:>7}  ratio={d['ratio']}")
        pg.close()
    b.close()
