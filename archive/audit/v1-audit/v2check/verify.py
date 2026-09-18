from playwright.sync_api import sync_playwright
import json, pathlib, subprocess, sys

OUT = pathlib.Path("C:/tmp/indigo/_audit/v2check")
OUT.mkdir(parents=True, exist_ok=True)
BASE = "file:///C:/tmp/indigo/valvoro-prototype/"

CHECK = """() => {
  const g = (s) => document.querySelector(s);
  const nav = g('nav[aria-label="Main"]');
  const panel = g('#menu-panel');
  return {
    title: document.title,
    nav: nav ? [...nav.querySelectorAll('a')].map(a => a.textContent.trim() + ' -> ' + a.getAttribute('href') + (a.hasAttribute('aria-current') ? ' [active]' : '')) : null,
    drawer: panel ? [...panel.querySelectorAll('a')].map(a => a.textContent.trim()) : null,
    ribbon: g('.pill-topbar') ? g('.pill-topbar').innerText.replace(/\\n/g, ' | ') : null,
    h1: g('h1') ? g('h1').innerText : null,
    h2s: [...document.querySelectorAll('h2')].map(h => h.innerText.replace(/\\n/g, ' ')),
    h3s: [...document.querySelectorAll('h3')].map(h => h.innerText.replace(/\\n/g, ' ')),
    ctaLabels: [...document.querySelectorAll('.pill')].map(p => p.innerText.replace(/\\n/g, ' ').trim()),
    overflow: document.documentElement.scrollWidth - window.innerWidth,
    broken: [...document.images].filter(i => !i.complete || i.naturalWidth === 0).map(i => i.getAttribute('src')),
    internalLinks: [...document.querySelectorAll('a[href]')].map(a => a.getAttribute('href')).filter(h => !h.startsWith('#') && !h.startsWith('tel:') && !h.startsWith('mailto:') && !h.startsWith('http')),
    deadAnchors: [...document.querySelectorAll('a[href^="#"]')].map(a => a.getAttribute('href')).filter(h => h !== '#' && !document.getElementById(h.slice(1))),
    anchorCount: document.querySelectorAll('a[href^="#"]').length,
  };
}"""

pages = ["index.html", "residential.html", "commercial.html"]
report = {}

with sync_playwright() as p:
    b = p.chromium.launch()
    for page_name in pages:
        for w, h in [(1920, 1080), (1440, 900), (390, 844)]:
            pg = b.new_page(viewport={"width": w, "height": h})
            errs = []
            pg.on("pageerror", lambda e: errs.append("pageerror: " + str(e)))
            pg.on("console", lambda m: errs.append("console." + m.type + ": " + m.text) if m.type == "error" else None)
            pg.goto(BASE + page_name, wait_until="load", timeout=60000)
            pg.wait_for_timeout(3200)
            info = pg.evaluate(CHECK)
            info["errors"] = errs
            report[f"{page_name}@{w}"] = info
            pg.screenshot(path=str(OUT / f"pg_{page_name.replace('.html','')}_{w}.png"), full_page=False)
            pg.close()
    b.close()

# ---- assertions ----
fails = []
for key, info in report.items():
    if info["errors"]:
        fails.append(f"{key}: console/page errors {info['errors']}")
    if info["overflow"] > 1:
        fails.append(f"{key}: horizontal overflow {info['overflow']}px")
    if info["broken"]:
        fails.append(f"{key}: broken images {info['broken']}")
    if info["deadAnchors"]:
        fails.append(f"{key}: dead in-page anchors {sorted(set(info['deadAnchors']))}")
    if info["nav"] != ["Home", "Residential", "Commercial", "Contact"] and [n.split(' ->')[0] for n in info["nav"]] != ["Home", "Residential", "Commercial", "Contact"]:
        fails.append(f"{key}: nav labels {info['nav']}")
    if len([n for n in info["nav"] if "[active]" in n]) != 1:
        fails.append(f"{key}: active nav count {info['nav']}")

# link targets exist
targets = {p for p in pages}
for key, info in report.items():
    for href in info["internalLinks"]:
        base = href.split("#")[0]
        if base and base not in targets:
            fails.append(f"{key}: dead link {href}")

print(json.dumps({k: {kk: vv for kk, vv in v.items() if kk in ("title", "nav", "ribbon", "h1", "overflow", "broken")} for k, v in report.items() if k.endswith("@1440")}, indent=1, ensure_ascii=False))
print()
print("h2s residential:", report["residential.html@1440"]["h2s"])
print("h2s commercial :", report["commercial.html@1440"]["h2s"])
print()

# ---- css/tw.css must not drift from index.html's inline block ----------------
# It is documented as "the same tokens for CLI/Vite builds". It was not: `.shell`
# was `w-[94%] max-w-[1220px]` against the shipped `--col: 1417px`, and the frame
# model and legal-modal CSS were absent entirely. sync_tw.py now generates it, and
# this makes drift a gate failure rather than something found months later.
tw = subprocess.run([sys.executable, str(OUT / "sync_tw.py"), "--check"],
                    capture_output=True, text=True)
if tw.returncode != 0:
    fails.append("css/tw.css has drifted from index.html:\n      "
                 + "\n      ".join(tw.stdout.strip().splitlines()[:12]))
else:
    print("css/tw.css:", tw.stdout.strip().splitlines()[-1])
    print()

print("FAILS:" if fails else "ALL CHECKS PASSED")
for f in fails:
    print("  -", f)
