from playwright.sync_api import sync_playwright
import json, pathlib

url = pathlib.Path(r"C:/tmp/indigo/valvoro-prototype/index.html").as_uri()

with sync_playwright() as p:
    b = p.chromium.launch()
    for w in (960, 1440, 1920):
        pg = b.new_page(viewport={"width": w, "height": 900}, device_scale_factor=1)
        pg.goto(url); pg.wait_for_timeout(900)
        info = pg.evaluate("""() => {
          const bar = document.querySelector('.shell > div');
          const shell = document.querySelector('.shell');
          const header = document.querySelector('header');
          const logo = document.querySelector('header a[href="#top"]');
          const wordmark = logo.querySelector('span');
          const nav = document.querySelector('header nav');
          const navLink = nav.querySelector('a');
          const cs = el => { const c = getComputedStyle(el); return {
            w: el.getBoundingClientRect().width, h: el.getBoundingClientRect().height,
            x: el.getBoundingClientRect().x, y: el.getBoundingClientRect().y,
            radius: c.borderRadius, tl: c.borderTopLeftRadius, tr: c.borderTopRightRadius,
            bl: c.borderBottomLeftRadius, br: c.borderBottomRightRadius,
            font: c.fontSize }; };
          const r = { viewport: innerWidth, bar: cs(bar), shell: cs(shell), header: cs(header),
                      logoBox: cs(logo), wordmark: cs(wordmark), nav: cs(nav), navLink: cs(navLink) };
          return r;
        }""")
        print(f"--- viewport {w} ---")
        print(json.dumps(info, indent=1))
        pg.screenshot(path=rf"C:/tmp/indigo/_audit/header/render_{w}_top.png", clip={"x":0,"y":0,"width":w,"height":170})
        pg.close()
    b.close()
print("done")
