from playwright.sync_api import sync_playwright
import pathlib, json

OUT = pathlib.Path("C:/tmp/indigo/_audit/v2check")
OUT.mkdir(parents=True, exist_ok=True)
URL = "file:///C:/tmp/indigo/valvoro-prototype/index.html"

report = {}

with sync_playwright() as p:
    b = p.chromium.launch()
    for w, h in [(1920, 1080), (1440, 900), (390, 844)]:
        pg = b.new_page(viewport={"width": w, "height": h}, device_scale_factor=1)
        errs = []
        pg.on("console", lambda m: errs.append(m.type + ": " + m.text) if m.type == "error" else None)
        pg.on("pageerror", lambda e: errs.append("pageerror: " + str(e)))
        pg.goto(URL, wait_until="load", timeout=60000)
        pg.wait_for_timeout(3500)

        # header screenshot
        pg.screenshot(path=str(OUT / f"header_{w}.png"), clip={"x": 0, "y": 0, "width": w, "height": 130})

        info = pg.evaluate("""() => {
          const g = (s) => document.querySelector(s);
          const cs = (el) => el ? getComputedStyle(el) : null;
          const nav = g('nav[aria-label="Main"]');
          const slab = g('.slab');
          const bar = g('.pill-topbar');
          const hdr = g('.header-card');
          const panel = g('#menu-panel');
          return {
            navItems: nav ? [...nav.querySelectorAll('a')].map(a => a.textContent.trim() + ' -> ' + a.getAttribute('href')) : null,
            drawerItems: panel ? [...panel.querySelectorAll('a')].map(a => a.textContent.trim()) : null,
            ribbonText: bar ? bar.innerText.replace(/\\n/g, ' | ') : null,
            radii: {
              slab: cs(slab)?.borderTopLeftRadius,
              topbar: bar ? cs(bar).borderBottomLeftRadius + ' / top ' + cs(bar).borderTopLeftRadius : null,
              headerCard: cs(hdr)?.borderTopLeftRadius,
              navPill: cs(nav?.querySelector('a'))?.borderTopLeftRadius,
              panel: cs(g('.card'))?.borderTopLeftRadius,
            },
            scrollWidth: document.documentElement.scrollWidth,
            innerWidth: window.innerWidth,
            brokenImgs: [...document.images].filter(i => !i.complete || i.naturalWidth === 0).map(i => i.getAttribute('src')),
            anchorTargets: ['top','services','area','contact'].map(id => id + ':' + !!document.getElementById(id)),
          };
        }""")
        info["consoleErrors"] = errs
        report[w] = info
        print(w, json.dumps(info, indent=1)[:2000])
        pg.close()
    b.close()

(OUT / "report.json").write_text(json.dumps(report, indent=2), encoding="utf-8")
print("done")
