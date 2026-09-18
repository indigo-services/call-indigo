from playwright.sync_api import sync_playwright
import pathlib
CHROME = (r"C:/Users/jaden.black/AppData/Local/ms-playwright"
          r"\chromium-1243\chrome-win64\chrome.exe")
PROTO = pathlib.Path(r"C:/tmp/indigo/valvoro-prototype/index.html").resolve().as_uri()
JS = """() => {
  const hr = document.querySelector('.hero-row');
  const out = [];
  for (const sh of document.styleSheets) {
    let rules; try { rules = sh.cssRules; } catch(e) { continue; }
    if (!rules) continue;
    const walk = (list, media) => {
      for (const r of list) {
        if (r.cssRules) { walk(r.cssRules, r.conditionText || media || (r.media && r.media.mediaText) || null); continue; }
        if (!r.selectorText) continue;
        if (r.selectorText.includes('hero-row') || r.selectorText.includes('grid-cols-2')) {
          out.push({sel:r.selectorText, css:r.style.cssText.slice(0,90), media:media||'-'});
        }
      }
    };
    walk(rules, null);
  }
  return {rules: out, matched: getComputedStyle(hr).gridTemplateColumns};
}"""
with sync_playwright() as pw:
    b = pw.chromium.launch(executable_path=CHROME, args=["--no-sandbox"])
    pg = b.new_page(viewport={"width": 767, "height": 1200})
    pg.goto(PROTO, wait_until="load"); pg.wait_for_timeout(2000)
    d = pg.evaluate(JS)
    print(f"computed gtc = {d['matched']}")
    for r in d['rules']:
        print(f"  media={str(r['media'])[:34]:<34} {r['sel']:<40} {r['css']}")
    b.close()
