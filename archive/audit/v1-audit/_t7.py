from playwright.sync_api import sync_playwright
import pathlib
CHROME = (r"C:/Users/jaden.black/AppData/Local/ms-playwright"
          r"\chromium-1243\chrome-win64\chrome.exe")
PROTO = pathlib.Path(r"C:/tmp/indigo/valvoro-prototype/index.html").resolve().as_uri()
JS = """() => {
  const bb = document.querySelector('.banner-bottom');
  const c = getComputedStyle(bb);
  const kid = [...bb.children].map(e=>{
    const r=e.getBoundingClientRect(); const s=getComputedStyle(e);
    return {tag:e.tagName, cls:(e.className||'').toString().slice(0,30),
            x:+r.x.toFixed(1), w:+r.width.toFixed(1), h:+r.height.toFixed(1),
            flex:s.flex, minW:s.minWidth, maxW:s.maxWidth, w0:s.width, ar:s.aspectRatio};
  });
  return {bottom:{w:+bb.getBoundingClientRect().width.toFixed(1), display:c.display, gap:c.gap,
                  width:c.width, maxW:c.maxWidth, minW:c.minWidth},
          kid};
}"""
with sync_playwright() as pw:
    b = pw.chromium.launch(executable_path=CHROME, args=["--no-sandbox"])
    for vw in (1440, 1300, 1200):
        pg = b.new_page(viewport={"width": vw, "height": 1100})
        pg.goto(PROTO, wait_until="load"); pg.wait_for_timeout(1800)
        d = pg.evaluate(JS)
        print(f"--- PROTO vw {vw} --- bottom w={d['bottom']['w']} cssW={d['bottom']['width']} maxW={d['bottom']['maxW']} display={d['bottom']['display']} gap={d['bottom']['gap']}")
        for k in d['kid']:
            print(f"      {k['tag']:8} x={k['x']:>7} w={k['w']:>7} h={k['h']:>7} flex={k['flex']:>10} minW={k['minW']:>8} maxW={k['maxW']:>8} w={k['w0']:>9} ar={k['ar']:>10} {k['cls']}")
        pg.close()
    b.close()
