from playwright.sync_api import sync_playwright
import pathlib
CHROME = (r"C:/Users/jaden.black/AppData/Local/ms-playwright"
          r"\chromium-1243\chrome-win64\chrome.exe")
REAL  = pathlib.Path(r"C:/tmp/indigo/_audit/vlv/index.html").resolve().as_uri()
JS = """() => {
  const bb = document.querySelector('.banner-bottom');
  const bbl = getComputedStyle(bb);
  const kid = [...bb.children].map(e=>{
    const r=e.getBoundingClientRect(); const c=getComputedStyle(e);
    return {tag:e.tagName, cls:(e.className||'').toString().slice(0,34),
            x:+r.x.toFixed(1), w:+r.width.toFixed(1), h:+r.height.toFixed(1),
            flex:c.flex, minW:c.minWidth, maxW:c.maxWidth, w0:c.width, disp:c.display};
  });
  const iw = document.querySelector('.banner-bottom .inner-wrap');
  const iwc = iw ? getComputedStyle(iw) : null;
  const cta = document.querySelector('.banner-con .primary_btn, .banner-bottom a');
  return {bottom:{x:+bb.getBoundingClientRect().x.toFixed(1), w:+bb.getBoundingClientRect().width.toFixed(1), display:bbl.display, gap:bbl.gap},
          kids:kid,
          innerWrap: iwc ? {flex:iwc.flex, minW:iwc.minWidth, w0:iwc.width} : null,
          cta: cta ? {w:+cta.getBoundingClientRect().width.toFixed(1), minW:getComputedStyle(cta).minWidth} : null};
}"""
with sync_playwright() as pw:
    b = pw.chromium.launch(executable_path=CHROME, args=["--no-sandbox"])
    for vw in (1440, 1300, 1200):
        pg = b.new_page(viewport={"width": vw, "height": 1100})
        pg.goto(REAL, wait_until="load"); pg.wait_for_timeout(1800)
        d = pg.evaluate(JS)
        print(f"--- REAL vw {vw} --- bottom w={d['bottom']['w']} gap={d['bottom']['gap']} innerWrap={d['innerWrap']} cta={d['cta']}")
        for k in d['kids']:
            print(f"      {k['tag']:8} x={k['x']:>7} w={k['w']:>7} h={k['h']:>7} flex={k['flex']:>10} minW={k['minW']:>8} maxW={k['maxW']:>8} w={k['w0']:>9} {k['cls']}")
        pg.close()
    b.close()
