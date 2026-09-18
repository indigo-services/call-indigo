from playwright.sync_api import sync_playwright
import pathlib

url = pathlib.Path(r"C:/tmp/indigo/valvoro-prototype/index.html").as_uri()
WIDTHS = [360, 390, 480, 640, 767, 768, 800, 860, 960, 1000, 1024, 1060, 1100, 1200, 1279, 1280, 1366, 1440, 1600, 1920]

JS = """() => {
  const row = document.querySelector('header .shell > div');
  const b = e => { const r = e.getBoundingClientRect(); return {x:+r.x.toFixed(1), r:+r.right.toFixed(1), w:+r.width.toFixed(1)}; };
  const kids = [...row.children].filter(e=>getComputedStyle(e).display!=='none');
  const byText = t => kids.find(e => (e.innerText||'').trim().startsWith(t));
  const contentRight = Math.max(...kids.map(e=>e.getBoundingClientRect().right));
  const rowBox = b(row);
  const navA = row.querySelector('nav a');
  const wordmark = row.querySelector(':scope > a > span');
  const out = { row: rowBox, slack:+(rowBox.r - contentRight).toFixed(1),
                navFont: navA?getComputedStyle(navA).fontSize:null,
                wordFont: wordmark?getComputedStyle(wordmark).fontSize:null,
                docOverflow: document.documentElement.scrollWidth - innerWidth,
                parts: kids.map(e=>({txt:(e.innerText||'').replace(/\\n/g,' ').trim().slice(0,18), ...b(e)})) };
  return out;
}"""

with sync_playwright() as p:
    br = p.chromium.launch()
    print(f"{'vw':>5} {'ovf':>4} | {'slack':>7} | parts (x..right w)")
    for w in WIDTHS:
        pg = br.new_page(viewport={"width":w,"height":900})
        pg.goto(url); pg.wait_for_timeout(450)
        d = pg.evaluate(JS)
        parts = " | ".join(f"{p['txt'][:14]}:{p['x']}..{p['r']}({p['w']})" for p in d['parts'])
        print(f"{w:>5} {d['docOverflow']:>4} | {d['slack']:>7} | {parts}")
        pg.close()
    br.close()
