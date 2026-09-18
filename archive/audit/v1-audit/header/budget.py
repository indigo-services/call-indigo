from playwright.sync_api import sync_playwright
import pathlib

url = pathlib.Path(r"C:/tmp/indigo/valvoro-prototype/index.html").as_uri()
WIDTHS = [360, 390, 480, 640, 767, 768, 860, 960, 1024, 1100, 1200, 1279, 1280, 1366, 1440, 1600, 1920]

JS = """() => {
  const header = document.querySelector('header');
  const row = header.querySelector('.shell > div');
  const logo = row.querySelector('a[href="#top"]');
  const nav  = row.querySelector('nav');
  const phone= row.querySelector('a[href^="tel:"]');
  const cta  = row.querySelector('a[href="#contact"]');
  const burger = row.querySelector('#burger');
  const R = el => { if(!el) return null; const b = el.getBoundingClientRect();
    return {x:+b.x.toFixed(1), r:+b.right.toFixed(1), w:+b.width.toFixed(1), vis: getComputedStyle(el).display!=='none'}; };
  const kids = [...row.children].filter(e=>getComputedStyle(e).display!=='none').map(e=>({
      tag:e.tagName.toLowerCase(), cls:(e.className||'').slice(0,28), x:+e.getBoundingClientRect().x.toFixed(1),
      r:+e.getBoundingClientRect().right.toFixed(1), w:+e.getBoundingClientRect().width.toFixed(1)}));
  return {
    vw: innerWidth,
    docOverflow: document.documentElement.scrollWidth - innerWidth,
    rowBox: R(row),
    rowRight: row.getBoundingClientRect().right,
    logo:R(logo), nav:R(nav), phone:R(phone), cta:R(cta), burger:R(burger),
    contentRight: Math.max(...kids.map(k=>k.r)),
    kids
  };
}"""

with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={"width":1440,"height":900})
    pg.goto(url); pg.wait_for_timeout(600)
    print(f"{'vw':>6} {'ovf':>4} | {'logoW':>7} {'navX':>7} {'navR':>7} {'navW':>7} | {'phX':>7} {'phW':>7} {'ctaX':>7} {'ctaW':>7} | {'contentR':>8} {'rowR':>8} {'slack':>7} | navfont")
    for w in WIDTHS:
        pg.set_viewport_size({"width":w,"height":900})
        pg.wait_for_timeout(180)
        d = pg.evaluate(JS)
        nf = pg.evaluate("()=>{const a=document.querySelector('header nav a'); return a?getComputedStyle(a).fontSize:'-';}")
        logo = d['logo'] or {}; nav=d['nav'] or {}; ph=d['phone'] or {}; cta=d['cta'] or {}
        slack = d['rowRight'] - d['contentRight']
        print(f"{w:>6} {d['docOverflow']:>4} | {logo.get('w','-'):>7} {nav.get('x','-'):>7} {nav.get('r','-'):>7} {nav.get('w','-'):>7} | "
              f"{ph.get('x','-'):>7} {ph.get('w','-'):>7} {cta.get('x','-'):>7} {cta.get('w','-'):>7} | "
              f"{d['contentRight']:>8} {d['rowRight']:>8} {slack:>7.1f} | {nf}")
    b.close()
