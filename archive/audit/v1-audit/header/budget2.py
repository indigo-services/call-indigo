from playwright.sync_api import sync_playwright
import pathlib, sys

url = pathlib.Path(r"C:/tmp/indigo/valvoro-prototype/index.html").as_uri()
WIDTHS = [360, 390, 480, 640, 767, 768, 800, 860, 960, 1000, 1024, 1060, 1100, 1200, 1279, 1280, 1366, 1440, 1600, 1920]

JS = """() => {
  const row = document.querySelector('header .shell > div');
  const b = e => { const r = e.getBoundingClientRect(); return {x:+r.x.toFixed(1), r:+r.right.toFixed(1), w:+r.width.toFixed(1)}; };
  const pick = sel => { const e = row.querySelector(sel); return e && getComputedStyle(e).display!=='none' ? b(e) : null; };
  const kids = [...row.children].filter(e=>getComputedStyle(e).display!=='none');
  const contentRight = Math.max(...kids.map(e=>e.getBoundingClientRect().right));
  const rowBox = b(row);
  const navA = row.querySelector('nav a');
  const wordmark = row.querySelector('a[href="#top"] span');
  return {
    row: rowBox, contentRight:+contentRight.toFixed(1),
    slack:+(rowBox.r - contentRight).toFixed(1),
    logo: pick('a[href="#top"]'), nav: pick('nav'), phone: pick('a[href^="tel:"]'),
    cta: pick('a[href="#contact"]'), burger: pick('#burger'),
    navFont: navA?getComputedStyle(navA).fontSize:null,
    markFont: wordmark?getComputedStyle(wordmark).fontSize:null,
    docOverflow: document.documentElement.scrollWidth - innerWidth
  };
}"""

with sync_playwright() as p:
    br = p.chromium.launch()
    print(f"{'vw':>5} {'ovf':>4} | {'logoX':>7}{'logoW':>7} | {'navX':>7}{'navR':>7}{'navW':>7} | {'phX':>7}{'phW':>7} | {'ctaX':>7}{'ctaW':>7} | {'slack':>6} | nav/word")
    for w in WIDTHS:
        pg = br.new_page(viewport={"width":w,"height":900})
        pg.goto(url); pg.wait_for_timeout(500)
        d = pg.evaluate(JS)
        g=lambda k,f='x': (d[k] or {}).get(f,'-')
        print(f"{w:>5} {d['docOverflow']:>4} | {g('logo'):>7}{g('logo','w'):>7} | {g('nav'):>7}{g('nav','r'):>7}{g('nav','w'):>7} | "
              f"{g('phone'):>7}{g('phone','w'):>7} | {g('cta'):>7}{g('cta','w'):>7} | {d['slack']:>6} | {d['navFont']}/{d['markFont']}")
        pg.close()
    br.close()
