from playwright.sync_api import sync_playwright
import pathlib
CHROME = (r"C:/Users/jaden.black/AppData/Local/ms-playwright"
          r"\chromium-1243\chrome-win64\chrome.exe")
PROTO = pathlib.Path(r"C:/tmp/indigo/valvoro-prototype/index.html").resolve().as_uri()
REAL  = pathlib.Path(r"C:/tmp/indigo/_audit/vlv/index.html").resolve().as_uri()
JS = """() => {
  const all = [...document.querySelectorAll('.banner-img2')].map((e,i)=>{
    const r=e.getBoundingClientRect(); const img=e.querySelector('img');
    return {i, tag:e.tagName, x:+r.x.toFixed(0), y:+r.y.toFixed(0), w:+r.width.toFixed(0), h:+r.height.toFixed(0),
            inHero: !!e.closest('.banner-content-con, section'),
            imgW: img ? +img.getBoundingClientRect().width.toFixed(0) : null,
            src: img ? img.getAttribute('src').slice(-24) : null};
  });
  const so = document.querySelector('.scrol-outer');
  return {ovalCount: all.length, all,
          scrolOuter: so ? (()=>{const r=so.getBoundingClientRect(); const c=getComputedStyle(so);
            return {x:+r.x.toFixed(1),y:+r.y.toFixed(1),w:+r.width.toFixed(1),h:+r.height.toFixed(1),
                    pos:c.position, bottom:c.bottom, top:c.top, height:c.height,
                    parentPos:getComputedStyle(so.parentElement).position};})() : null};
}"""
with sync_playwright() as pw:
    b = pw.chromium.launch(executable_path=CHROME, args=["--no-sandbox"])
    for tag, url in (("PROTO", PROTO), ("REAL ", REAL)):
        pg = b.new_page(viewport={"width": 1440, "height": 1100})
        pg.goto(url, wait_until="load"); pg.wait_for_timeout(2200)
        d = pg.evaluate(JS)
        print(f"--- {tag} --- ovalCount={d['ovalCount']}")
        for o in d['all']:
            print(f"    [{o['i']}] {o['tag']:8} {o['x']:>6},{o['y']:>6} {o['w']:>5}x{o['h']:<5} imgW={o['imgW']} src=...{o['src']}")
        print(f"    scrolOuter {d['scrolOuter']}")
        pg.close()
    b.close()
