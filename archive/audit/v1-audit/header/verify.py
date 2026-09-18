from playwright.sync_api import sync_playwright
import pathlib

url = pathlib.Path(r"C:/tmp/indigo/valvoro-prototype/index.html").as_uri()
WIDTHS = [360, 390, 480, 640, 767, 768, 800, 860, 960, 1000, 1024, 1060, 1100, 1200, 1279, 1280, 1366, 1440, 1600, 1920]

JS = """() => {
  const bar = document.querySelector('.shell > div');
  const row = document.querySelector('header .shell > div');
  const b = e => { const r = e.getBoundingClientRect(); return {x:+r.x.toFixed(1), r:+r.right.toFixed(1), w:+r.width.toFixed(1)}; };
  const kids = [...row.children].filter(e=>getComputedStyle(e).display!=='none');
  const contentRight = Math.max(...kids.map(e=>e.getBoundingClientRect().right));
  const rowBox = b(row);
  const barCS = getComputedStyle(bar);
  const navA = row.querySelector('nav a');
  const wordmark = row.querySelector(':scope > a > span');
  const mark = row.querySelector(':scope > a > img');
  return {
    barRadius: [barCS.borderTopLeftRadius, barCS.borderTopRightRadius, barCS.borderBottomRightRadius, barCS.borderBottomLeftRadius].join(' '),
    barH: +bar.getBoundingClientRect().height.toFixed(1),
    barW: +bar.getBoundingClientRect().width.toFixed(1),
    rowW: rowBox.w,
    contentW: +(contentRight - rowBox.x).toFixed(1),
    slack: +(rowBox.r - contentRight).toFixed(1),
    navFont: navA?getComputedStyle(navA).fontSize:null,
    wordFont: wordmark?getComputedStyle(wordmark).fontSize:null,
    markH: mark?getComputedStyle(mark).height:null,
    logoW: b(row.querySelector(':scope > a')).w,
    docOverflow: document.documentElement.scrollWidth - innerWidth,
    bodyOverflow: document.body.scrollWidth - innerWidth
  };
}"""

with sync_playwright() as p:
    br = p.chromium.launch()
    print(f"{'vw':>5} {'ovf':>4} {'bovf':>5} | {'barRadius':<28} {'barH':>5} | {'logoW':>6} {'navFont':>8} {'wordFont':>9} {'markH':>6} | {'contentW':>9} {'rowW':>8} {'slack':>7}")
    bad=[]
    for w in WIDTHS:
        pg = br.new_page(viewport={"width":w,"height":900})
        pg.goto(url); pg.wait_for_timeout(500)
        d = pg.evaluate(JS)
        print(f"{w:>5} {d['docOverflow']:>4} {d['bodyOverflow']:>5} | {d['barRadius']:<28} {d['barH']:>5} | {d['logoW']:>6} {d['navFont']:>8} {d['wordFont']:>9} {d['markH']:>6} | {d['contentW']:>9} {d['rowW']:>8} {d['slack']:>7}")
        if d['docOverflow']>0 or d['bodyOverflow']>0 or d['slack']<-0.5: bad.append((w,d['slack'],d['docOverflow']))
        pg.close()
    br.close()
    print("\nPROBLEM WIDTHS:", bad if bad else "none")
