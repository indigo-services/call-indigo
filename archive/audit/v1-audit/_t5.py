from playwright.sync_api import sync_playwright
import pathlib
CHROME = (r"C:/Users/jaden.black/AppData/Local/ms-playwright"
          r"\chromium-1243\chrome-win64\chrome.exe")
PROTO = pathlib.Path(r"C:/tmp/indigo/valvoro-prototype/index.html").resolve().as_uri()
REAL  = pathlib.Path(r"C:/tmp/indigo/_audit/vlv/index.html").resolve().as_uri()
JS = """() => {
  const f = document.querySelector('.banner-img2');
  const i = document.querySelector('.banner-img2 img');
  const cs = getComputedStyle(f), ci = getComputedStyle(i);
  const rf = f.getBoundingClientRect(), ri = i.getBoundingClientRect();
  const mq = v => window.matchMedia(v).matches;
  return {mq1199: mq('(max-width:1199px)'), mq991: mq('(max-width:991px)'),
          fig:{w:+rf.width.toFixed(1),h:+rf.height.toFixed(1),cssW:cs.width,ar:cs.aspectRatio,disp:cs.display,flex:cs.flex},
          img:{w:+ri.width.toFixed(1),h:+ri.height.toFixed(1),cssW:ci.width,ar:ci.aspectRatio},
          natural:{w:i.naturalWidth,h:i.naturalHeight},
          innerW: window.innerWidth};
}"""
with sync_playwright() as pw:
    b = pw.chromium.launch(executable_path=CHROME, args=["--no-sandbox"])
    for vw in (1440, 1300, 1200, 1199, 1100, 992):
        print(f"--- vw {vw} ---")
        for tag, url in (("PROTO", PROTO), ("REAL ", REAL)):
            pg = b.new_page(viewport={"width": vw, "height": 1100})
            pg.goto(url, wait_until="load"); pg.wait_for_timeout(1800)
            d = pg.evaluate(JS)
            print(f"  {tag} mq1199={d['mq1199']!s:5} fig {d['fig']['w']:>6}x{d['fig']['h']:<6} cssW={d['fig']['cssW']:>8} ar={d['fig']['ar']:>8} flex={d['fig']['flex']:>10} "
                  f"| img {d['img']['w']:>6}x{d['img']['h']:<6} cssW={d['img']['cssW']:>7} ar={d['img']['ar']:>8} nat={d['natural']['w']}x{d['natural']['h']}")
            pg.close()
    b.close()
