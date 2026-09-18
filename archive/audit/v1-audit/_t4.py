from playwright.sync_api import sync_playwright
import pathlib
CHROME = (r"C:/Users/jaden.black/AppData/Local/ms-playwright"
          r"\chromium-1243\chrome-win64\chrome.exe")
PROTO = pathlib.Path(r"C:/tmp/indigo/valvoro-prototype/index.html").resolve().as_uri()
REAL  = pathlib.Path(r"C:/tmp/indigo/_audit/vlv/index.html").resolve().as_uri()
JS = """() => {
  const g = e => { const r=e.getBoundingClientRect(); const c=getComputedStyle(e);
    return {tag:e.tagName, cls:(e.className||'').toString().slice(0,52),
            x:+r.x.toFixed(1),y:+r.y.toFixed(1),w:+r.width.toFixed(1),h:+r.height.toFixed(1),
            pos:c.position, pb:c.paddingBottom, pt:c.paddingTop, mb:c.marginBottom}; };
  const so = document.querySelector('.scrol-outer');
  const chain = [];
  let n = so;
  while (n && n !== document.body) { chain.push(g(n)); n = n.parentElement; }
  return {chain};
}"""
with sync_playwright() as pw:
    b = pw.chromium.launch(executable_path=CHROME, args=["--no-sandbox"])
    for tag, url in (("PROTO", PROTO), ("REAL ", REAL)):
        pg = b.new_page(viewport={"width": 1440, "height": 1100})
        pg.goto(url, wait_until="load"); pg.wait_for_timeout(2200)
        d = pg.evaluate(JS)
        print(f"--- {tag} ---")
        for i, e in enumerate(d['chain']):
            print(f"  {i} {e['tag']:8} {e['pos']:9} {e['x']:>7},{e['y']:>7} {e['w']:>7}x{e['h']:<7} pt={e['pt']:>6} pb={e['pb']:>6} mb={e['mb']:>6}  {e['cls']}")
        pg.close()
    b.close()
