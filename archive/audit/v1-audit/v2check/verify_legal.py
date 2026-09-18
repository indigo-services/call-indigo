# Behavioural proof for the full-page legal modals + the restructured footer.
# Asserts observable state (computed visibility, geometry, focus, body lock), not
# the presence of markup — a class name in the HTML proves nothing about whether
# the dialog can actually be opened or closed.
from playwright.sync_api import sync_playwright
import json, pathlib

OUT = pathlib.Path("C:/tmp/indigo/_audit/v2check")
BASE = "file:///C:/tmp/indigo/valvoro-prototype/"

# --- state probe -----------------------------------------------------------
STATE = """(id) => {
  const m = document.getElementById(id);
  const s = m.querySelector('.legal-sheet');
  const b = m.querySelector('.legal-body');
  const x = m.querySelector('[data-legal-x]');
  const r = s.getBoundingClientRect();
  const xr = x.getBoundingClientRect();
  const cs = getComputedStyle(m);
  return {
    cls: m.classList.contains('open'),
    ariaHidden: m.getAttribute('aria-hidden'),
    visibility: cs.visibility,
    sheetTop: Math.round(r.top), sheetBottom: Math.round(r.bottom),
    sheetLeft: Math.round(r.left), sheetRight: Math.round(r.right),
    sheetW: Math.round(r.width), sheetH: Math.round(r.height),
    bodyScrollable: b.scrollHeight > b.clientHeight + 4,
    bodyScrollTop: Math.round(b.scrollTop),
    xInView: xr.top >= 0 && xr.bottom <= window.innerHeight && xr.width >= 40 && xr.height >= 40,
    focusIsX: document.activeElement === x,
    bodyOverflow: document.body.style.overflow,
  };
}"""

FOOTER = """() => {
  const f = document.querySelector('footer.slab');
  const heads = [...f.querySelectorAll('.shell > div > h2')].map(h => h.textContent.trim());
  const cols = f.querySelector('.shell.grid');
  const bar = f.querySelector('.legal-link').closest('.border-t');
  return {
    headings: heads,
    gridCols: getComputedStyle(cols).gridTemplateColumns.split(' ').length,
    triggers: [...f.querySelectorAll('[data-legal]')].map(b => b.tagName + ':' + b.getAttribute('data-legal')),
    // the divider must sit inside .shell, not span the whole slab
    barInsideShell: !!bar.closest('.shell'),
    barW: Math.round(bar.getBoundingClientRect().width),
    shellW: Math.round(f.querySelector('.shell').getBoundingClientRect().width),
    serviceLinks: [...f.querySelectorAll('a')].map(a => a.textContent.trim()).filter(t => t),
    hrefs: [...f.querySelectorAll('a')].map(a => a.getAttribute('href')),
  };
}"""

fails = []
report = {}

with sync_playwright() as p:
    b = p.chromium.launch()
    for page_name in ["index.html", "residential.html", "commercial.html"]:
        for w, h in [(1440, 900), (390, 844)]:
            tag = "%s@%d" % (page_name, w)
            pg = b.new_page(viewport={"width": w, "height": h})
            errs = []
            pg.on("pageerror", lambda e: errs.append("pageerror: " + str(e)))
            pg.on("console", lambda m: errs.append("console.error: " + m.text) if m.type == "error" else None)
            pg.goto(BASE + page_name, wait_until="load", timeout=60000)
            pg.wait_for_timeout(2600)
            r = {}

            r["footer"] = pg.evaluate(FOOTER)

            # --- 1. closed on load -------------------------------------------
            r["closed_terms"] = pg.evaluate(STATE, "legal-terms")
            r["closed_privacy"] = pg.evaluate(STATE, "legal-privacy")

            # --- 2. open Terms from the footer button ------------------------
            pg.click('footer [data-legal="terms"]')
            pg.wait_for_timeout(500)
            r["open_terms"] = pg.evaluate(STATE, "legal-terms")
            r["open_terms_privacy_still"] = pg.evaluate(STATE, "legal-privacy")

            # --- 3. pinned bar survives a scroll to the bottom ---------------
            pg.eval_on_selector("#legal-terms .legal-body", "el => el.scrollTop = el.scrollHeight")
            pg.wait_for_timeout(350)
            r["scrolled"] = pg.evaluate(STATE, "legal-terms")
            r["bottom_btn"] = pg.evaluate("""() => {
              const b = document.querySelector('#legal-terms .legal-close');
              const rr = b.getBoundingClientRect();
              return { visible: rr.top >= 0 && rr.bottom <= window.innerHeight,
                       w: Math.round(rr.width), h: Math.round(rr.height) };
            }""")
            pg.screenshot(path=str(OUT / ("legal_terms_bottom_%d.png" % w)))

            # --- 4. close with the foot-of-document button -------------------
            pg.click("#legal-terms .legal-close")
            pg.wait_for_timeout(500)
            r["after_foot_close"] = pg.evaluate(STATE, "legal-terms")
            r["after_foot_focus"] = pg.evaluate(
                "() => document.activeElement.getAttribute('data-legal')")

            # --- 5. Escape ----------------------------------------------------
            pg.click('footer [data-legal="terms"]')
            pg.wait_for_timeout(420)
            pg.keyboard.press("Escape")
            pg.wait_for_timeout(500)
            r["after_escape"] = pg.evaluate(STATE, "legal-terms")

            # --- 6. scrim click (desktop only: the sheet is full width on mobile)
            if w >= 768:
                pg.click('footer [data-legal="privacy"]')
                pg.wait_for_timeout(420)
                pg.mouse.click(6, int(h / 2))
                pg.wait_for_timeout(500)
                r["after_scrim"] = pg.evaluate(STATE, "legal-privacy")

            # --- 7. a hashchange swaps one dialog for the other --------------
            # NOT via the footer: while a dialog is open the footer is behind the
            # scrim, which is the whole point of a modal. The swap path is the
            # deep link, so that is what gets exercised.
            pg.evaluate("() => { location.hash = '#terms'; }")
            pg.wait_for_timeout(560)
            pg.evaluate("() => { location.hash = '#privacy'; }")
            pg.wait_for_timeout(620)
            r["swap_terms"] = pg.evaluate(STATE, "legal-terms")
            r["swap_privacy"] = pg.evaluate(STATE, "legal-privacy")
            pg.screenshot(path=str(OUT / ("legal_privacy_top_%d.png" % w)))
            pg.keyboard.press("Escape")
            pg.wait_for_timeout(420)

            # --- 8. deep link -------------------------------------------------
            pg2 = b.new_page(viewport={"width": w, "height": h})
            pg2.on("pageerror", lambda e: errs.append("pageerror(deep): " + str(e)))
            pg2.goto(BASE + page_name + "#terms", wait_until="load", timeout=60000)
            pg2.wait_for_timeout(2600)
            r["deeplink"] = pg2.evaluate(STATE, "legal-terms")
            r["deeplink_privacy"] = pg2.evaluate(STATE, "legal-privacy")
            pg2.close()

            r["errors"] = errs
            report[tag] = r
            pg.close()
    b.close()

# --- assertions ------------------------------------------------------------
def chk(cond, msg):
    if not cond:
        fails.append(msg)

for tag, r in report.items():
    chk(not r["errors"], "%s: errors %s" % (tag, r["errors"]))

    # closed on load
    for k in ("closed_terms", "closed_privacy"):
        chk(r[k]["visibility"] == "hidden", "%s: %s not hidden (%s)" % (tag, k, r[k]["visibility"]))
        chk(r[k]["ariaHidden"] == "true", "%s: %s aria-hidden=%s" % (tag, k, r[k]["ariaHidden"]))
    chk(r["closed_terms"]["bodyOverflow"] == "", "%s: body locked on load" % tag)

    # opened
    o = r["open_terms"]
    chk(o["visibility"] == "visible", "%s: terms not visible" % tag)
    chk(o["ariaHidden"] == "false", "%s: terms aria-hidden=%s" % (tag, o["ariaHidden"]))
    chk(o["focusIsX"], "%s: focus did not move to the close button" % tag)
    chk(o["bodyOverflow"] == "hidden", "%s: body not locked while open" % tag)
    chk(o["bodyScrollable"], "%s: legal body is not scrollable (content may be cut off)" % tag)
    chk(o["xInView"], "%s: close button not in view" % tag)
    chk(r["open_terms_privacy_still"]["visibility"] == "hidden", "%s: privacy also opened" % tag)

    # full-page geometry: fills the viewport height, and the width is the viewport
    # capped at 980 (that cap is what leaves a clickable scrim on desktop)
    want_w = min(980, 1440 if tag.endswith("@1440") else 390)
    chk(o["sheetH"] == (900 if tag.endswith("@1440") else 844),
        "%s: sheet height %d is not the viewport height" % (tag, o["sheetH"]))
    chk(o["sheetW"] == want_w, "%s: sheet width %d, expected %d" % (tag, o["sheetW"], want_w))
    chk(o["sheetTop"] == 0, "%s: sheet top %d, expected 0" % (tag, o["sheetTop"]))
    if tag.endswith("@1440"):
        chk(o["sheetLeft"] > 0 and o["sheetRight"] < 1440,
            "%s: no scrim left/right of the sheet (%d..%d)" % (tag, o["sheetLeft"], o["sheetRight"]))

    # pinned bar + bottom button after scrolling
    s = r["scrolled"]
    chk(s["bodyScrollTop"] > 100, "%s: legal body did not scroll (%d)" % (tag, s["bodyScrollTop"]))
    chk(s["xInView"], "%s: close button scrolled away with the content" % tag)
    chk(s["focusIsX"], "%s: focus lost on scroll" % tag)
    chk(r["bottom_btn"]["visible"], "%s: foot-of-document Close not reachable" % tag)
    chk(r["bottom_btn"]["h"] >= 44, "%s: foot Close tap target %dpx" % (tag, r["bottom_btn"]["h"]))

    # every close path works
    chk(r["after_foot_close"]["visibility"] == "hidden", "%s: foot Close did not close" % tag)
    chk(r["after_foot_close"]["bodyOverflow"] == "", "%s: body still locked after foot Close" % tag)
    chk(r["after_foot_focus"] == "terms", "%s: focus not returned to the trigger (%s)" % (tag, r["after_foot_focus"]))
    chk(r["after_escape"]["visibility"] == "hidden", "%s: Escape did not close" % tag)
    if "after_scrim" in r:
        chk(r["after_scrim"]["visibility"] == "hidden", "%s: scrim click did not close" % tag)

    # swap
    chk(r["swap_privacy"]["visibility"] == "visible", "%s: privacy did not open" % tag)
    chk(r["swap_terms"]["visibility"] == "hidden", "%s: terms stayed open behind privacy" % tag)

    # deep link
    chk(r["deeplink"]["visibility"] == "visible", "%s: #terms deep link did not open" % tag)
    chk(r["deeplink_privacy"]["visibility"] == "hidden", "%s: #terms opened the wrong dialog" % tag)

    # footer structure
    f = r["footer"]
    chk(f["headings"] == ["Services", "Company", "Contact"],
        "%s: footer headings %s" % (tag, f["headings"]))
    chk(f["gridCols"] == (4 if tag.endswith("@1440") else 1),
        "%s: footer grid has %d columns at this width" % (tag, f["gridCols"]))
    chk(f["triggers"] == ["BUTTON:terms", "BUTTON:privacy"],
        "%s: legal triggers %s" % (tag, f["triggers"]))
    chk(f["barInsideShell"], "%s: footer divider is not inside .shell" % tag)
    chk(f["barW"] == f["shellW"],
        "%s: divider %dpx vs shell %dpx" % (tag, f["barW"], f["shellW"]))
    for want in ["Home", "About Us", "Residential", "Commercial", "How It Works", "FAQ", "Membership"]:
        chk(want in f["serviceLinks"], "%s: footer Company column missing %r" % (tag, want))
    for want in ["Plumbing", "Electrical", "HVAC", "Carpentry & Remodeling",
                 "Painting & Make-Readies", "Handyman & Repairs"]:
        chk(want in f["serviceLinks"], "%s: footer Services column missing %r" % (tag, want))
    chk(any(h.startswith("residential") for h in f["hrefs"]),
        "%s: footer has no link to the Residential page" % tag)

print(json.dumps({k: v["footer"]["headings"] for k, v in report.items()}, indent=1))
print()
print("geometry @1440 :", {k: (v["open_terms"]["sheetW"], v["open_terms"]["sheetH"]) for k, v in report.items() if k.endswith("@1440")})
print("geometry @390  :", {k: (v["open_terms"]["sheetW"], v["open_terms"]["sheetH"]) for k, v in report.items() if k.endswith("@390")})
print("footer cols    :", {k: v["footer"]["gridCols"] for k, v in report.items()})
print()
print("FAILS:" if fails else "ALL LEGAL/FOOTER CHECKS PASSED")
for f in fails:
    print("  -", f)
