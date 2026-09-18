from playwright.sync_api import sync_playwright

JS = """() => {
  const out = [];
  const r = (el) => { const b = el.getBoundingClientRect(); return [Math.round(b.left), Math.round(b.right)]; };
  // every direct child of body that is a band (pad-rl wrapper or a bare section)
  for (const el of document.body.children) {
    const cls = typeof el.className === 'string' ? el.className : '';
    if (!/pad-rl|mbox/.test(cls)) continue;
    const band = el;                       // outer wrapper OR the section itself
    const inner = band.querySelector(':scope > .shell, :scope > .mbox > .shell, :scope > .slab-body, :scope > .mbox.slab > .shell');
    const content = band.querySelector('.shell, .hero-wrap, .slab-body');
    out.push({
      tag: el.tagName.toLowerCase(),
      id: el.id || '',
      cls: cls.slice(0, 46),
      band: r(band),
      content: content ? r(content) : null,
      contentCls: content ? (content.className || '').slice(0, 30) : '',
    });
  }
  return out;
}"""

with sync_playwright() as p:
    b = p.chromium.launch()
    for w in [1440, 1920]:
        pg = b.new_page(viewport={"width": w, "height": 900})
        pg.goto("file:///C:/tmp/indigo/valvoro-prototype/index.html", wait_until="load", timeout=60000)
        pg.wait_for_timeout(2800)
        print("################ viewport %d ################" % w)
        for d in pg.evaluate(JS):
            print("  %-8s %-14s band=%-14s content=%-14s %s" % (
                d["tag"], ("#" + d["id"]) if d["id"] else d["cls"][:12],
                str(d["band"]), str(d["content"]), d["contentCls"]))
        pg.close()
    b.close()
