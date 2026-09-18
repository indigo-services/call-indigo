from playwright.sync_api import sync_playwright
import json, pathlib

OUT = pathlib.Path("C:/tmp/indigo/_audit/v2check")
OUT.mkdir(parents=True, exist_ok=True)

JS = """() => {
  const out = [];
  const main = document.querySelector('main') || document.body;
  const walk = (el) => {
    for (const c of el.children) {
      const tag = c.tagName.toLowerCase();
      if (/^h[1-6]$/.test(tag)) {
        out.push({t: tag, text: c.innerText.trim()});
      } else if (tag === 'p') {
        const tx = c.innerText.trim();
        if (tx) out.push({t: 'p', text: tx});
      } else if (tag === 'a') {
        out.push({t: 'a', text: c.innerText.trim().replace(/\\n/g, ' '), href: c.getAttribute('href')});
      } else if (tag === 'span' || tag === 'div') {
        const cls = c.className || '';
        if (typeof cls === 'string' && /eyebrow|label|text-xs|uppercase/.test(cls) && c.children.length === 0) {
          const tx = c.innerText.trim();
          if (tx && tx.length < 80) out.push({t: 'eyebrow?', text: tx, cls: cls.slice(0, 60)});
        }
        walk(c);
      } else {
        walk(c);
      }
    }
  };
  walk(main);
  return out;
}"""

with sync_playwright() as p:
    b = p.chromium.launch()
    for slug in ["residential", "commercial"]:
        pg = b.new_page(viewport={"width": 1440, "height": 1000})
        pg.goto("https://call-indigo.com/" + slug, wait_until="networkidle", timeout=90000)
        pg.wait_for_timeout(4000)
        data = pg.evaluate(JS)
        (OUT / f"v1_{slug}.json").write_text(json.dumps(data, indent=1), encoding="utf-8")
        print("=====", slug, "=====")
        for d in data:
            if d["t"] == "a":
                print("  A:", d["text"], "->", d["href"])
            elif d["t"] == "eyebrow?":
                print("  E:", d["text"])
            else:
                print(" ", d["t"].upper() + ":", d["text"])
        pg.screenshot(path=str(OUT / f"v1_{slug}_top.png"))
        pg.close()
    b.close()
