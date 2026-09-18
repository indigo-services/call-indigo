from playwright.sync_api import sync_playwright
import pathlib

OUT = pathlib.Path("C:/tmp/indigo/_audit/v2check/shots")
BASE = "file:///C:/tmp/indigo/valvoro-prototype/"

with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={"width": 390, "height": 844})
    pg.goto(BASE + "index.html", wait_until="load", timeout=60000)
    pg.wait_for_timeout(2600)
    # scroll to the very bottom so the sticky header is genuinely over the footer
    pg.evaluate("() => window.scrollTo(0, document.body.scrollHeight)")
    pg.wait_for_timeout(700)
    print(pg.evaluate("""() => {
      const h = document.querySelector('header');
      const f = document.querySelector('footer.slab');
      const hr = h.getBoundingClientRect();
      const fr = f.getBoundingClientRect();
      const rows = [...f.querySelectorAll('.shell.grid > div')].map(d => {
        const r = d.getBoundingClientRect();
        return Math.round(r.top) + '..' + Math.round(r.bottom);
      });
      return {
        headerBox: Math.round(hr.top) + '..' + Math.round(hr.bottom),
        headerPosition: getComputedStyle(h).position,
        headerZ: getComputedStyle(h).zIndex,
        footerTop: Math.round(fr.top),
        footerRows: rows,
        // does the header actually cover any footer row?
        covered: rows.filter(s => {
          const [a, z] = s.split('..').map(Number);
          return a < hr.bottom && z > hr.top;
        }),
      };
    }"""))
    pg.screenshot(path=str(OUT / "footer_390_bottom_viewport.png"))
    pg.close()
    b.close()
