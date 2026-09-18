from playwright.sync_api import sync_playwright
import pathlib
url = pathlib.Path("C:/tmp/indigo/_audit/vlv/index.html").as_uri()
CHROME = r"C:/Users/jaden.black/.agent-browser/browsers/chrome-153.0.8010.47/chrome.exe"
with sync_playwright() as p:
    b = p.chromium.launch(executable_path=CHROME, headless=True, args=["--no-sandbox","--disable-gpu"])
    for w in (1440, 992, 1200):
        pg = b.new_page(viewport={"width":w,"height":900}, device_scale_factor=2)
        pg.goto(url, wait_until="load", timeout=60000)
        pg.wait_for_timeout(4000)
        pg.screenshot(path=f"C:/tmp/indigo/_audit/real_{w}.png", clip={"x":0,"y":0,"width":w,"height":760})
        m = pg.evaluate("""() => {
          const q=s=>document.querySelector(s);
          const r=e=>{if(!e)return null;const b=e.getBoundingClientRect();return {x:+b.x.toFixed(1),y:+b.y.toFixed(1),w:+b.width.toFixed(1),h:+b.height.toFixed(1)};};
          const cs=e=>e?getComputedStyle(e):null;
          return {
            header: r(q('header')),
            navCollapse: q('#navbarSupportedContent') ? cs(q('#navbarSupportedContent')).display : null,
            toggler: q('.navbar-toggler') ? cs(q('.navbar-toggler')).display : null,
            banner: r(q('.banner-con')),
            h1: r(q('.banner-con h1')),
            h1font: cs(q('.banner-con h1')).fontSize,
            navyBox: r(q('.navy-box')),
            arch: r(q('.banner-img1')),
            circ: r(q('.banner-img2')),
            scrollOuter: r(q('.scrol-outer')),
            bodyW: document.body.scrollWidth, innerW: window.innerWidth
          };
        }""")
        print(f"--- REAL at {w} ---")
        for k,v in m.items(): print(f"   {k}: {v}")
        pg.close()
    b.close()
