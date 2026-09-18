from playwright.sync_api import sync_playwright
import pathlib

TPL = pathlib.Path(r"C:/tmp/indigo/_audit/vlv/index.html").as_uri()
PRO = pathlib.Path(r"C:/tmp/indigo/valvoro-prototype/index.html").as_uri()

# Same landmark set, expressed against each document's own class names.
TPL_JS = """
() => {
  const r = el => { if(!el) return null; const b = el.getBoundingClientRect();
    return [Math.round(b.x), Math.round(b.y), Math.round(b.width), Math.round(b.height)]; };
  const q = s => document.querySelector(s);
  return {
    banner: r(q('.banner-con')),
    contentCon: r(q('.banner-content-con')),
    h1: r(q('.banner-con h1')),
    lead: r(q('.banner-content-con p')),
    cta: r(q('.banner-con .primary_btn')),
    img2: r(q('.banner-img2')),
    img2img: r(q('.banner-img2 img')),
    innerWrap: r(q('.inner-wrap')),
    stats: r(q('.statistics-wrapper')),
    bannerBottom: r(q('.banner-bottom')),
    archImg: r(q('.banner-img1 img')),
    plumberImg: r(q('.plumber-img img')),
    navyBox: r(q('.navy-box')),
    dotImg: r(q('.dot-img img')),
    scrol: r(q('.scrol-outer')),
    ring: r(q('.scroll-down-arrow figure')),
    docH: document.documentElement.scrollHeight,
    docW: document.documentElement.scrollWidth,
  };
}
"""

PRO_JS = TPL_JS.replace(".banner-con h1", ".scrim-hero h1") \
               .replace(".banner-con .primary_btn", ".hero-cta") \
               .replace(".banner-img1 img", ".banner-img1 img") \
               .replace(".plumber-img img", ".plumber-img img") \
               .replace(".dot-img img", ".dot-img") \
               .replace(".scroll-down-arrow figure", ".scroll-down-arrow .grid") \
               .replace(".banner-con", ".scrim-hero")

KEYS = ["banner", "contentCon", "h1", "lead", "cta", "img2", "img2img", "innerWrap",
        "stats", "bannerBottom", "archImg", "plumberImg", "navyBox", "dotImg",
        "scrol", "ring", "docH", "docW"]

with sync_playwright() as p:
    b = p.chromium.launch()
    for W in (1440, 1199, 991, 768):
        out = {}
        for label, url, js in (("TPL", TPL, TPL_JS), ("PRO", PRO, PRO_JS)):
            pg = b.new_page(viewport={"width": W, "height": 1000})
            pg.goto(url, wait_until="load")
            pg.wait_for_timeout(2200)
            pg.evaluate("()=>{document.querySelectorAll('.wow,.reveal').forEach(e=>{e.style.visibility='visible';e.classList.add('animated','visible');});}")
            pg.wait_for_timeout(400)
            out[label] = pg.evaluate(js)
            pg.close()
        print(f"\n================ viewport {W} ================")
        print(f"  {'element':13s} {'TEMPLATE':26s} {'PROTOTYPE':26s} delta(w,h)")
        for k in KEYS:
            t = out["TPL"].get(k); pr = out["PRO"].get(k)
            if isinstance(t, list) and isinstance(pr, list):
                dw = pr[2] - t[2]; dh = pr[3] - t[3]
                flag = "" if abs(dw) <= 3 and abs(dh) <= 3 else "   <-- differs"
                print(f"  {k:13s} {str(t):26s} {str(pr):26s} {dw:+d},{dh:+d}{flag}")
            else:
                print(f"  {k:13s} {str(t):26s} {str(pr):26s}")
    b.close()
