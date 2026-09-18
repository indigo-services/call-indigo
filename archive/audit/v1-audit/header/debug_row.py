from playwright.sync_api import sync_playwright
import pathlib, json
url = pathlib.Path(r"C:/tmp/indigo/valvoro-prototype/index.html").as_uri()
JS = """() => {
  const row = document.querySelector('header .shell > div');
  const kids = [...row.children].map(e=>{
    const b=e.getBoundingClientRect(), c=getComputedStyle(e);
    return {tag:e.tagName.toLowerCase(), cls:(e.className||'').toString().slice(0,40),
            display:c.display, flex:c.flex, ml:c.marginLeft, x:+b.x.toFixed(1), r:+b.right.toFixed(1), w:+b.width.toFixed(1),
            txt:(e.innerText||'').replace(/\\n/g,'|').slice(0,30)};
  });
  const cta = row.querySelector('a[href="#contact"]');
  let ctaKids = null;
  if (cta) ctaKids = [...cta.children].map(e=>{const b=e.getBoundingClientRect(),c=getComputedStyle(e);
     return {tag:e.tagName.toLowerCase(), w:+b.width.toFixed(2), h:+b.height.toFixed(2), display:c.display, txt:(e.innerText||'').slice(0,20)};});
  return {rowW:+row.getBoundingClientRect().width.toFixed(1), kids, ctaKids};
}"""
with sync_playwright() as p:
    b=p.chromium.launch(); pg=b.new_page(viewport={"width":1280,"height":900})
    pg.goto(url); pg.wait_for_timeout(700)
    print(json.dumps(pg.evaluate(JS), indent=1))
    b.close()
