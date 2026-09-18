from playwright.sync_api import sync_playwright
import pathlib
CHROME = (r"C:/Users/jaden.black/AppData/Local/ms-playwright"
          r"\chromium-1243\chrome-win64\chrome.exe")
PROTO = pathlib.Path(r"C:/tmp/indigo/valvoro-prototype/index.html").resolve().as_uri()
JS = """() => {
  const hr = document.querySelector('.hero-row');
  const cs = getComputedStyle(hr);
  const cols = [...hr.children].map(e=>{
    const r=e.getBoundingClientRect(); const s=getComputedStyle(e);
    return {cls:(e.className||'').toString().slice(0,28), x:+r.x.toFixed(1), w:+r.width.toFixed(1),
            disp:s.display, ml:s.marginLeft, mr:s.marginRight};
  });
  const arch = document.querySelector('.banner-img1');
  const af = getComputedStyle(arch);
  const aimg = document.querySelector('.banner-img1 img');
  const pl = document.querySelector('.plumber-img');
  return {row:{disp:cs.display, gtc:cs.gridTemplateColumns, w:+hr.getBoundingClientRect().width.toFixed(1)},
          cols,
          archFig:{x:+arch.getBoundingClientRect().x.toFixed(1), w:+arch.getBoundingClientRect().width.toFixed(1),
                   ml:af.marginLeft, mr:af.marginRight, ta:af.textAlign, disp:af.display},
          archImg:{w:+aimg.getBoundingClientRect().width.toFixed(1), cssW:getComputedStyle(aimg).width, maxW:getComputedStyle(aimg).maxWidth},
          plumber:{x:+pl.getBoundingClientRect().x.toFixed(1), w:+pl.getBoundingClientRect().width.toFixed(1), cssW:getComputedStyle(pl).width}};
}"""
with sync_playwright() as pw:
    b = pw.chromium.launch(executable_path=CHROME, args=["--no-sandbox"])
    for vw in (800, 767, 600, 390):
        pg = b.new_page(viewport={"width": vw, "height": 1200})
        pg.goto(PROTO, wait_until="load"); pg.wait_for_timeout(1800)
        d = pg.evaluate(JS)
        print(f"--- PROTO vw {vw} --- row disp={d['row']['disp']} gtc={d['row']['gtc']} w={d['row']['w']}")
        for c in d['cols']:
            print(f"      col x={c['x']:>7} w={c['w']:>7} disp={c['disp']:>8} ml={c['ml']} mr={c['mr']} {c['cls']}")
        print(f"      archFig x={d['archFig']['x']} w={d['archFig']['w']} ml={d['archFig']['ml']} mr={d['archFig']['mr']} ta={d['archFig']['ta']}")
        print(f"      archImg w={d['archImg']['w']} cssW={d['archImg']['cssW']} maxW={d['archImg']['maxW']}")
        print(f"      plumber x={d['plumber']['x']} w={d['plumber']['w']} cssW={d['plumber']['cssW']}")
        pg.close()
    b.close()
