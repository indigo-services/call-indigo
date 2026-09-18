from playwright.sync_api import sync_playwright
import pathlib
CHROME = (r"C:/Users/jaden.black/AppData/Local/ms-playwright"
          r"\chromium-1243\chrome-win64\chrome.exe")
PROTO = pathlib.Path(r"C:/tmp/indigo/valvoro-prototype/index.html").resolve().as_uri()
REAL = pathlib.Path(r"C:/tmp/indigo/_audit/vlv/index.html").resolve().as_uri()
JS = """() => {
  const g = (sel) => { const e = document.querySelector(sel); if(!e) return null;
    const r = e.getBoundingClientRect(); const c = getComputedStyle(e);
    return {x:+r.x.toFixed(1), w:+r.width.toFixed(1), pl:c.paddingLeft, pr:c.paddingRight,
            ml:c.marginLeft, mr:c.marginRight, maxW:c.maxWidth}; };
  const sec = document.querySelector('section');
  // walk up from the h1 to find every box that constrains the text column
  const chain = []; let n = document.querySelector('h1');
  while (n && n.tagName !== 'BODY') {
    const r = n.getBoundingClientRect(); const c = getComputedStyle(n);
    chain.push({tag:n.tagName, cls:(n.className||'').toString().slice(0,40),
                x:+r.x.toFixed(1), w:+r.width.toFixed(1), pl:c.paddingLeft, pr:c.paddingRight, maxW:c.maxWidth});
    n = n.parentElement;
  }
  return {section: sec ? g('section') : null, chain};
}"""
with sync_playwright() as pw:
    b = pw.chromium.launch(executable_path=CHROME, args=["--no-sandbox"])
    for vw in (390,):
        for tag, url in (("PROTO", PROTO), ("REAL ", REAL)):
            pg = b.new_page(viewport={"width": vw, "height": 1400})
            pg.goto(url, wait_until="load"); pg.wait_for_timeout(2000)
            d = pg.evaluate(JS)
            print(f"--- {tag} vw {vw} --- section={d['section']}")
            for e in d['chain']:
                print(f"      {e['tag']:8} x={e['x']:>6} w={e['w']:>7} pl={e['pl']:>6} pr={e['pr']:>6} maxW={e['maxW']:>9} {e['cls']}")
            pg.close()
    b.close()
