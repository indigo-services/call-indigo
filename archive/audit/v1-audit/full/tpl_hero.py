from playwright.sync_api import sync_playwright
import pathlib, json

TPL = pathlib.Path(r"C:/tmp/indigo/_audit/vlv/index.html").as_uri()

JS = """
() => {
  const r = el => { if(!el) return null; const b = el.getBoundingClientRect();
    return {x:Math.round(b.x), y:Math.round(b.y), w:Math.round(b.width), h:Math.round(b.height),
            bottom:Math.round(b.bottom), right:Math.round(b.right)}; };
  const cs = el => el ? getComputedStyle(el) : {};
  const q = s => document.querySelector(s);
  const out = {};
  const banner = q('.banner-con');
  out.banner = r(banner);
  out.bannerPad = banner ? cs(banner).padding : null;

  // the two hero columns
  const cols = [...document.querySelectorAll('.banner-con .col-lg-6, .banner-con [class*="col-lg-6"]')];
  out.cols = cols.map(c => ({ cls: c.className.slice(0,40), ...r(c) }));

  const bc = q('.banner-content-con');
  out.contentCon = r(bc);
  out.contentConPad = bc ? cs(bc).padding : null;

  const bt = q('.banner-top');
  out.bannerTop = r(bt);
  out.bannerTopPad = bt ? cs(bt).paddingLeft : null;

  const h1 = q('.banner-con h1');
  out.h1 = r(h1);
  if (h1) out.h1font = cs(h1).fontSize + '/' + cs(h1).lineHeight;

  const p = q('.banner-content-con p');
  out.lead = r(p);
  if (p) {
    out.leadFont = cs(p).fontSize + '/' + cs(p).lineHeight;
    out.leadPadLeft = cs(p).paddingLeft;
    out.leadWidth = cs(p).width;
    out.leadMaxW = cs(p).maxWidth;
    out.leadMargin = cs(p).margin;
    out.leadText = p.textContent.trim().slice(0, 120);
    // count rendered lines via client rects
    const range = document.createRange();
    range.selectNodeContents(p);
    out.leadLines = [...range.getClientRects()].map(x => Math.round(x.top) + ':' + Math.round(x.width)).slice(0, 8);
  }

  const cta = q('.banner-content-con .primary_btn, .banner-con .primary_btn');
  out.cta = r(cta);
  if (cta) out.ctaStyle = 'ml ' + cs(cta).marginLeft + ' mb ' + cs(cta).marginBottom
                          + ' pad ' + cs(cta).padding;

  const img2 = q('.banner-img2');
  out.img2 = r(img2);
  if (img2) out.img2Style = cs(img2).flex + ' | ' + cs(img2).width + ' | ' + cs(img2).margin;

  const iw = q('.inner-wrap');
  out.innerWrap = r(iw);
  if (iw) out.innerWrapStyle = cs(iw).flex + ' | ' + cs(iw).width + ' | ' + cs(iw).margin;

  const bb = q('.banner-bottom');
  out.bannerBottom = r(bb);
  if (bb) out.bannerBottomStyle = cs(bb).display + ' gap ' + cs(bb).gap + ' margin ' + cs(bb).margin;

  const st = q('.statistics-wrapper');
  out.stats = r(st);
  if (st) out.statsMargin = cs(st).margin;

  const stb = q('.statistics-box');
  out.statBox = r(stb);
  if (stb) out.statBoxStyle = 'pad ' + cs(stb).padding + ' | border ' + cs(stb).borderRight;

  const stn = q('.statistics-box b, .statistics-box .counter, .statistics-box h3, .statistics-box span');
  out.statNum = r(stn);
  if (stn) { out.statNumFont = cs(stn).fontSize + '/' + cs(stn).lineHeight; out.statNumTag = stn.tagName + '.' + stn.className; }

  const nav = q('.banner-img-con');
  out.imgCon = r(nav);
  const a1 = q('.banner-img1');
  out.arch = r(a1);
  const a1i = q('.banner-img1 img');
  out.archImg = r(a1i);
  if (a1i) out.archImgStyle = cs(a1i).width + ' pad ' + cs(a1i).padding + ' br ' + cs(a1i).borderRadius;
  const pl = q('.plumber-img');
  out.plumber = r(pl);
  const pli = q('.plumber-img img');
  out.plumberImg = r(pli);
  if (pli) out.plumberImgStyle = cs(pli).width;
  const nb = q('.navy-box');
  out.navyBox = r(nb);
  if (nb) out.navyBoxStyle = cs(nb).top + ' | ' + cs(nb).right + ' | pad ' + cs(nb).padding;
  const sc = q('.scrol-outer');
  out.scrol = r(sc);
  if (sc) out.scrolStyle = cs(sc).bottom;

  out.docH = document.documentElement.scrollHeight;
  out.docW = document.documentElement.scrollWidth;
  return out;
}
"""

with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={"width": 1920, "height": 1000})
    pg.goto(TPL, wait_until="load")
    pg.wait_for_timeout(2500)
    # reveal wow animations
    pg.evaluate("()=>{document.querySelectorAll('.wow').forEach(e=>{e.style.visibility='visible';e.style.animation='none';e.classList.add('animated');});}")
    pg.wait_for_timeout(500)
    m = pg.evaluate(JS)
    b.close()

print("=========== REAL TEMPLATE @1920 (DOM-measured) ===========")
for k, v in m.items():
    print(f"  {k:16s} {v}")
