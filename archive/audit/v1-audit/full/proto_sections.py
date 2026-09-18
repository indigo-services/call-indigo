from playwright.sync_api import sync_playwright
import pathlib, json

url = pathlib.Path(r"C:/tmp/indigo/valvoro-prototype/index.html").as_uri()
JS = """() => {
  const out = [];
  const secs = document.querySelectorAll('body > section, body > footer, body > div.shell, header');
  const list = [...document.querySelectorAll('section, footer, header')].filter(e => e.closest('header')===null || e.tagName==='HEADER');
  const seen = new Set();
  const rows = [];
  const walk = (el) => {
    const cs = getComputedStyle(el);
    const b = el.getBoundingClientRect();
    rows.push({
      tag: el.tagName.toLowerCase(),
      id: el.id || '',
      cls: (el.className||'').toString().slice(0,60),
      y: +b.top.toFixed(0), h: +b.height.toFixed(0), x: +b.left.toFixed(1), w: +b.width.toFixed(1),
      radius: cs.borderRadius, bg: cs.backgroundColor, pad: cs.paddingTop+' '+cs.paddingBottom
    });
    [...el.children].forEach(c=>{ if(['SECTION','FOOTER'].includes(c.tagName)) walk(c); });
  };
  [...document.querySelectorAll('body > *')].forEach(el=>{
    if (['SECTION','FOOTER','HEADER'].includes(el.tagName) || el.classList.contains('shell')) walk(el);
  });
  return rows;
}"""
with sync_playwright() as p:
    br = p.chromium.launch(); pg = br.new_page(viewport={"width":1920,"height":1000})
    pg.goto(url); pg.wait_for_timeout(1500)
    rows = pg.evaluate(JS)
    print(f"{'tag/id':<26} {'x':>7} {'w':>8} {'y':>7} {'h':>6} | {'radius':<14} {'bg':<22} pad")
    for r in rows:
        print(f"{r['tag']+'#'+r['id']:<26} {r['x']:>7} {r['w']:>8} {r['y']:>7} {r['h']:>6} | {r['radius']:<14} {r['bg']:<22} {r['pad']}")
    print("\ndoc height:", pg.evaluate("()=>document.body.scrollHeight"))
    pg.screenshot(path=r"C:/tmp/indigo/_audit/full/proto_1920_full.png", full_page=True)
    br.close()
