from playwright.sync_api import sync_playwright
import pathlib
CHROME = (r"C:/Users/jaden.black/AppData/Local/ms-playwright"
          r"\chromium-1243\chrome-win64\chrome.exe")
URL = pathlib.Path(r"C:/tmp/indigo/valvoro-prototype/index.html").resolve().as_uri()
JS = """() => {
  const img = document.querySelector('.banner-img1 img');
  const cs = getComputedStyle(img);
  const mk = document.querySelector('.scrol-outer');
  return {
    innerW: window.innerWidth,
    archW_css: cs.width,
    archW_rect: img.getBoundingClientRect().width.toFixed(1),
    plumber_css: getComputedStyle(document.querySelector('.plumber-img')).width,
    mq991: window.matchMedia('(max-width: 991px)').matches,
    mq1199: window.matchMedia('(max-width: 1199px)').matches,
    scrollDisplay: mk ? getComputedStyle(mk).display : 'MISSING',
    scrollBox: mk ? mk.getBoundingClientRect().height.toFixed(1) : '-',
    scrollOpacity: mk ? getComputedStyle(mk).opacity : '-',
    scrollParent: mk ? mk.parentElement.className.slice(0,90) : '-',
  };
}"""
with sync_playwright() as pw:
    b = pw.chromium.launch(executable_path=CHROME, args=["--no-sandbox"])
    for vw in (1440, 1200, 992, 768):
        pg = b.new_page(viewport={"width": vw, "height": 1100})
        pg.goto(URL, wait_until="load"); pg.wait_for_timeout(2000)
        d = pg.evaluate(JS)
        print(f"vw={vw:5d} arch={d['archW_css']:>8} rect={d['archW_rect']:>8} plumber={d['plumber_css']:>8} "
              f"mq991={d['mq991']!s:5} mq1199={d['mq1199']!s:5} scrollDisp={d['scrollDisplay']:>10} h={d['scrollBox']:>6}")
        if vw == 992:
            print(f"        scroll parent: {d['scrollParent']}")
        pg.close()
    b.close()
