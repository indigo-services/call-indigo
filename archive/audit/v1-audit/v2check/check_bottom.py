from playwright.sync_api import sync_playwright

BASE = "file:///C:/tmp/indigo/valvoro-prototype/"

with sync_playwright() as p:
    b = p.chromium.launch()
    for name in ["index.html", "residential.html", "commercial.html"]:
        for w, h in [(1440, 900), (390, 844)]:
            pg = b.new_page(viewport={"width": w, "height": h})
            pg.goto(BASE + name, wait_until="load", timeout=60000)
            pg.wait_for_timeout(2500)
            pg.evaluate("() => { document.documentElement.style.scrollBehavior='auto'; }")
            r = pg.evaluate("""() => {
              window.scrollTo(0, 1e9);
              const f = document.querySelector('footer.slab').getBoundingClientRect();
              const last = document.querySelector('footer.slab .legal-link').getBoundingClientRect();
              return {
                maxScroll: Math.round(window.scrollY),
                docH: document.documentElement.scrollHeight,
                viewportH: window.innerHeight,
                footerBottomAtMax: Math.round(f.bottom),
                legalLinkBottom: Math.round(last.bottom),
                blankBelowFooter: Math.round(window.innerHeight - f.bottom),
              };
            }""")
            print("%-18s @%-5d %s" % (name, w, r))
            pg.close()
    b.close()
