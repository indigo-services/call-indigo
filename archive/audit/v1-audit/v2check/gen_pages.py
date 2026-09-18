# Generates residential.html and commercial.html from index.html, so the shared
# design system (the inline Tailwind @theme/@layer block), header, drawer and
# footer are byte-identical across the three pages.
#
# Deliberately avoids nested f-strings: every block is built as its own string and
# the page is assembled by concatenation.
import pathlib

BASE = pathlib.Path("C:/tmp/indigo/valvoro-prototype")
src = (BASE / "index.html").read_text(encoding="utf-8")


def upto(text, marker):
    return text[: text.index(marker)]


def block(text, start, end):
    i = text.index(start)
    j = text.index(end, i) + len(end)
    return text[i:j]


HEAD = upto(src, "</head>") + "</head>"
HEADER = block(src, "<!-- ======================= TOP UTILITY BAR", "</header>")
DRAWER = block(src, "<!-- ======================= MENU DRAWER", "<!-- ======================= HERO CARD")
FOOTER = block(src, "<!-- ======================= FOOTER", "</html>")
SERVICES_BLOCK = block(src, '<section id="services"', "</section>")
OLD_NAV = block(HEADER, '<nav class="ml-[38px]', "</nav>")
OLD_DRAWER_LINKS = block(
    DRAWER,
    '    <a href="#top" class="border-b',
    '</a>\n    <a href="#contact" class="border-b border-white/10 py-3 text-[22px] font-semibold hover:pl-2 hover:text-sky">Contact</a>',
)

ARROW = ('<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" '
         'stroke-linecap="round" stroke-linejoin="round"><path d="M7 17L17 7M9 7h8v8"/></svg>')

NAV_ACTIVE = ("inline-flex h-[42px] items-center rounded-[8px] bg-sky px-[15px] text-[12.5px] "
              "font-semibold leading-none text-white xl:text-[15px]")
NAV_IDLE = "text-[12.5px] font-semibold text-ink hover:text-brand xl:text-[15px]"
NAV_SHELL = ('<nav class="ml-[38px] hidden items-center gap-[22px] whitespace-nowrap md:flex md:gap-[16px] '
             'lg:ml-[84px] lg:gap-[22px] xl:gap-[34px] 2xl:gap-[52px] max-md:ml-0" aria-label="Main">')
DRAWER_BASE = "border-b border-white/10 py-3 text-[22px] font-semibold hover:pl-2 hover:text-sky"

ITEMS = [("home", "Home", "{home}"), ("residential", "Residential", "residential.html"),
         ("commercial", "Commercial", "commercial.html"), ("contact", "Contact", "{contact}")]


def nav(active, home, contact):
    rows = []
    for key, label, href in ITEMS:
        href = href.format(home=home, contact=contact)
        if key == active:
            rows.append('<a href="%s" class="%s" aria-current="page">%s</a>' % (href, NAV_ACTIVE, label))
        else:
            rows.append('<a href="%s" class="%s">%s</a>' % (href, NAV_IDLE, label))
    return NAV_SHELL + "\n        " + "\n        ".join(rows) + "\n      </nav>"


def drawer(active, home, contact):
    rows = []
    for key, label, href in ITEMS:
        href = href.format(home=home, contact=contact)
        cls = DRAWER_BASE + (" text-sky" if key == active else "")
        cur = ' aria-current="page"' if key == active else ""
        rows.append('<a href="%s" class="%s"%s>%s</a>' % (href, cls, cur, label))
    return "\n    ".join(rows)


def chip(t):
    return ('<span class="rounded-[10px] bg-white/10 px-3.5 py-2 text-[11px] font-bold uppercase '
            'tracking-[0.16em] text-white/80">%s</span>' % t)


def benefit(icon, title, body):
    return ('<div class="reveal flex gap-4.5">\n'
            '            <img src="assets/images/%s" alt="" class="size-[54px] shrink-0 object-contain">\n'
            '            <div><strong class="text-lg font-bold text-ink">%s</strong>'
            '<p class="mt-1 text-sm">%s</p></div>\n'
            '          </div>' % (icon, title, body))


def stat(value, label):
    return ('<div class="text-center">\n'
            '          <p class="text-[34px] font-extrabold leading-none tracking-[-.02em] text-ink md:text-[42px]">%s</p>\n'
            '          <p class="mt-2 text-[11.5px] font-bold uppercase tracking-[0.16em] text-body">%s</p>\n'
            '        </div>' % (value, label))


def card_dark(card_label, title, body, cta_label, cta_href):
    return ('<article class="reveal rounded-panel bg-topbar p-8 text-white md:p-10">\n'
            '          <span class="eyebrow">%s</span>\n'
            '          <h3 class="text-[26px] font-bold leading-tight">%s</h3>\n'
            '          <p class="mt-4 text-[15px] leading-[26px] text-white/75">%s</p>\n'
            '          <a href="%s" class="pill mt-7">\n'
            '            <span>%s</span>\n'
            '            <span class="pill-circle">%s</span>\n'
            '          </a>\n'
            '        </article>' % (card_label, title, body, cta_href, cta_label, ARROW))


def card_light(card_label, title, body, link_label, link_href):
    return ('<article class="reveal rounded-panel bg-mist p-8 md:p-10">\n'
            '          <span class="eyebrow eyebrow-brand">%s</span>\n'
            '          <h3 class="text-[26px] font-bold leading-tight text-ink">%s</h3>\n'
            '          <p class="mt-4 text-[15px] leading-[26px]">%s</p>\n'
            '          <a href="%s" class="mt-7 inline-block text-sm font-bold text-brand">%s &rarr;</a>\n'
            '        </article>' % (card_label, title, body, link_href, link_label))


def btn_pill(label, href, navy=False):
    return ('<a href="%s" class="pill pill-lg%s">\n'
            '                <span>%s</span>\n'
            '                <span class="pill-circle">%s</span>\n'
            '              </a>' % (href, " pill-navy" if navy else "", label, ARROW))


def hero(label, chips, h1, body, ctas, phone_line, photo, photo_alt, badge):
    eyebrow = '<span class="eyebrow">%s</span>\n            ' % label if label else ""
    return ('  <div class="pad-rl">\n'
            '    <section class="mbox slab slab-photo scrim-hero relative bg-brand pad-140">\n'
            '      <img src="assets/images/banner-bg-img.jpg" alt="" aria-hidden="true"\n'
            '        class="pointer-events-none absolute inset-0 z-0 size-full object-cover">\n'
            '      <div class="slab-body shell">\n'
            '        <div class="grid items-center gap-12 lg:grid-cols-[1.02fr_.98fr] lg:gap-[70px]">\n'
            '          <div class="text-white">\n'
            '            ' + eyebrow + '<div class="mb-6 flex flex-wrap gap-2.5">\n'
            '              ' + chips + '\n'
            '            </div>\n'
            '            <h1 class="text-[clamp(38px,4.6vw,64px)] font-extrabold leading-[1.04] tracking-[-.02em]">' + h1 + '</h1>\n'
            '            <p class="mt-6 max-w-[580px] text-[17px] leading-[28px] text-white/85">' + body + '</p>\n'
            '            <div class="mt-8 flex flex-wrap items-center gap-4">\n'
            '              ' + ctas + '\n'
            '            </div>\n'
            '            <a href="tel:+15126084999" class="mt-7 inline-block text-[12.5px] font-bold uppercase tracking-[0.16em] text-white/80">' + phone_line + '</a>\n'
            '          </div>\n'
            '          <div class="relative">\n'
            '            <img src="assets/images/' + photo + '" alt="' + photo_alt + '"\n'
            '              class="h-[320px] w-full rounded-[18px] border-[3px] border-white/25 object-cover md:h-[400px] lg:h-[470px]">\n'
            '            <div class="absolute bottom-5 left-5 max-w-[300px] rounded-[14px] bg-white p-5 shadow-drop">\n'
            '              <p class="text-[11px] font-bold uppercase tracking-[0.14em] text-body">' + badge[0] + '</p>\n'
            '              <a href="tel:+15126084999" class="mt-1.5 block text-[22px] font-extrabold tracking-[-.02em] text-ink">' + badge[1] + '</a>\n'
            '            </div>\n'
            '          </div>\n'
            '        </div>\n'
            '      </div>\n'
            '    </section>\n'
            '  </div>')


CTA_BLOCK = ('  <div class="pad-rl">\n'
             '    <section class="mbox slab slab-photo scrim-blue bg-img-cta pad-30 relative bg-brand">\n'
             '    <div class="slab-body shell">\n'
             '      <div class="grid items-center gap-10 lg:grid-cols-[.92fr_1.08fr] lg:gap-[100px]">\n'
             '        <div class="relative">\n'
             '          <img src="assets/images/cta-img.jpg" alt="Call Indigo technician on an emergency call" class="w-full rounded-[18px] object-cover">\n'
             '          <img src="assets/images/logo-vector.png" alt="" aria-hidden="true" class="absolute -right-7 top-1/2 hidden w-[110px] -translate-y-1/2 lg:block">\n'
             '        </div>\n'
             '        <div>\n'
             '          <span class="eyebrow">Contact</span>\n'
             '          <h2 class="h-section text-white">{h2}</h2>\n'
             '          <p class="mt-4 max-w-[520px] text-[#dfe7fb]">{sub}</p>\n'
             '          <div class="mt-7 flex flex-wrap items-center gap-5">\n'
             '            <a href="tel:+15126084999" class="pill pill-lg">\n'
             '              <span>Call (512) 608-4999</span>\n'
             '              <span class="pill-circle"><img src="assets/images/call-icon.png" alt=""></span>\n'
             '            </a>\n'
             '            {secondary}\n'
             '          </div>\n'
             '        </div>\n'
             '      </div>\n'
             '    </div>\n'
             '    </section>\n'
             '  </div>')


def benefits_block(lead, body, items, img, img_alt):
    return ('  <div class="pad-rl">\n'
            '    <section class="mbox slab bg-mist pad-140">\n'
            '    <div class="shell grid grid-cols-[1.05fr_.95fr] items-center gap-[70px] max-lg:grid-cols-1 max-lg:gap-11">\n'
            '      <div class="reveal">\n'
            '        <span class="eyebrow eyebrow-brand">Why Call Indigo</span>\n'
            '        <h2 class="h-section">' + lead + '</h2>\n'
            '        <p class="mt-4">' + body + '</p>\n'
            '        <div class="mt-7 grid gap-6">\n'
            '          ' + "\n          ".join(items) + '\n'
            '        </div>\n'
            '        <a href="index.html#contact" class="pill mt-8">\n'
            '          <span>Schedule Inspection</span>\n'
            '          <span class="pill-circle">' + ARROW + '</span>\n'
            '        </a>\n'
            '      </div>\n'
            '      <div class="reveal">\n'
            '        <img src="assets/images/' + img + '" alt="' + img_alt + '" class="rounded-panel shadow-lift">\n'
            '      </div>\n'
            '    </div>\n'
            '    </section>\n'
            '  </div>')


def value_prop_block(eyebrow, h2, sub, dark, light):
    head = ''
    if eyebrow:
        head += '<span class="eyebrow eyebrow-brand">%s</span>\n        ' % eyebrow
    head += '<h2 class="h-section">%s</h2>' % h2
    if sub:
        head += '\n        <p class="mt-4">%s</p>' % sub
    return ('  <section class="band pad-140">\n'
            '    <div class="shell">\n'
            '      <div class="reveal mx-auto mb-12 max-w-[780px] text-center">\n'
            '        ' + head + '\n'
            '      </div>\n'
            '      <div class="grid gap-7 lg:grid-cols-2">\n'
            '        ' + dark + '\n'
            '        ' + light + '\n'
            '      </div>\n'
            '    </div>\n'
            '  </section>')

# --------------------------------------------------------------------------
# RESIDENTIAL
# --------------------------------------------------------------------------
RES_HERO = hero(
    None,
    " ".join([
        chip("Headquartered: Austin, TX"),
        chip("Established: 2012"),
        chip("Family owned, Locally operated"),
        chip("Local Service Area: Hays, Travis, and Williamson counties (Austin, Buda, Kyle, San Marcos)"),
    ]),
    "Love Your Home Forever.",
    "Hire our locally licensed and insured home services crews. And join our membership to achieve peace of mind with all things related to your home.",
    btn_pill("Book an Appointment", "index.html#contact") + "\n              " + btn_pill("Commercial", "commercial.html", navy=True),
    "Call for a Consultation: (512) 608-4999",
    "repair-img1.jpg",
    "Call Indigo home services crew on a residential job",
    ("Serving Hays, Travis, and Williamson counties", "(512) 608-4999"),
)

RES_VALUE = value_prop_block(
    "Residential Services",
    "Love your residence forever with our Indigo Home Management membership.",
    "Our local crews provide all home services so your family can achieve peace of mind with everything related to your home.",
    card_dark("Membership", "Indigo Home Management",
              "All new customers are given a free inspection of their entire address to identify all options to maximize property value over time. Our mission is to give our customers peace of mind throughout the continuum of owning, leasing, renting, buying, or selling the address. Our homes membership also involves our turn-key STR and LTR services to increase rental income for property owners. Please inquire to learn more.",
              "Book an Inspection", "index.html#contact"),
    card_light("Licensed &amp; Insured", "Indigo Home Services",
               "Locally licensed and insured home services including plumbing, electrical, HVAC, carpentry, make-readies, painting, flooring, landscaping, remodeling, construction, handyman services, repairs, and more. We offer discounted rates for all of our services to senior citizens, military, and members.",
               "Explore commercial services", "commercial.html"),
)

RES_BENEFITS = benefits_block(
    "All new customers receive a free inspection",
    "A complete inspection of your entire address to identify all options to maximize property value over time.",
    [benefit("choose-icon1.png", "Free property inspection", "Every new customer receives a free inspection of their entire address to identify all options to maximize property value over time."),
     benefit("choose-icon2.png", "Discounted rates", "We offer discounted rates for all of our services to senior citizens, military, and members."),
     benefit("choose-icon3.png", "One call, any service", "From plumbing to remodeling — one phone call covers every service your home or property needs."),
     benefit("choose-icon4.png", "Local &amp; trusted", "Headquartered in Austin, TX. Family owned and locally operated since 2012. Licensed, bonded, and insured.")],
    "choose-img1.jpg", "Call Indigo technician inspecting a property",
)

RES_MAIN = "\n\n".join([
    "  <!-- ======================= HERO ======================= -->\n"
    "  <!-- v1 /residential hero, copy verbatim (bundle `residentialHero`). The four\n"
    "       proof chips are its `proof[]` array; the white badge reproduces the one\n"
    "       overlapping v1's hero photo. -->\n" + RES_HERO,
    '  <div class="spacer"></div>',
    "  <!-- ======================= VALUE PROP ======================= -->\n" + RES_VALUE,
    '  <div class="spacer"></div>',
    "  <!-- ======================= SERVICES GRID ======================= -->\n"
    "  <!-- Identical markup to index.html#services — v1 ships the same\n"
    "       `residentialServicesGrid` object on both routes. -->\n" + SERVICES_BLOCK,
    '  <div class="spacer"></div>',
    "  <!-- ======================= BENEFITS ======================= -->\n" + RES_BENEFITS,
    '  <div class="spacer"></div>',
    "  <!-- ======================= FINAL CTA ======================= -->\n" + CTA_BLOCK.format(
        h2="Call Indigo for the address that needs attention",
        sub="Tell us what kind of property you have and what needs to be repaired, scoped, or coordinated.",
        secondary=btn_pill("Book an Appointment", "index.html#contact", navy=True)),
])

# --------------------------------------------------------------------------
# COMMERCIAL
# --------------------------------------------------------------------------
COM_HERO = hero(
    "Commercial &amp; facility services",
    chip("National facility management") + " " + chip("Licensed, bonded &amp; insured in all 50 states"),
    "Love Your Facility Forever.",
    "Hire our national and insured facility services partners. And join our membership to achieve peace of mind with all things related to your facility.",
    btn_pill("Book an Appointment", "index.html#contact") + "\n              " + btn_pill("Residential", "residential.html", navy=True),
    "Call for a Consultation: (512) 608-4999",
    "repair-img2.jpg",
    "Call Indigo facility services crew on a commercial job",
    ("National coverage · Austin, TX", "(512) 608-4999"),
)

COM_RIBBON = ('  <div class="pad-rl">\n'
              '    <section class="mbox slab bg-mist pad-30">\n'
              '      <div class="shell grid grid-cols-2 gap-8 py-7 md:grid-cols-4">\n'
              '        ' + "\n        ".join([stat("500+", "Crews"), stat("250+", "Locations"),
                                         stat("All 50", "States serviced daily"), stat("100%", "Free inspections")]) + '\n'
              '      </div>\n'
              '    </section>\n'
              '  </div>')

COM_VALUE = value_prop_block(
    None,
    "National crews, full range of services",
    None,
    card_dark("Indigo Facility Management", "Facility Management",
              "All new customers are given a free inspection of their entire address to identify all options to optimize facility maintenance over time. Our mission is to give our customers peace of mind throughout the continuum of owning, leasing, renting, buying, or selling the address. Our facility membership also involves our FM scope program to plan and predict the current and future demands of your facility's custom maintenance strategy. By getting your FM scope defined and or optimized with us, your team will avoid the frustration and high-costs of navigating facility maintenance alone.",
              "Learn More", "index.html#contact"),
    card_light("Indigo Facility Partners", "Facility Services",
               "In addition to our membership, we provide nationally insured facility services for property teams that need reliable, professional support without a full management commitment.",
               "Contact us", "index.html#contact"),
)

COM_BENEFITS = benefits_block(
    "All new customers receive a free inspection",
    "Call Indigo provides national facility management with (512) 608-4999. Licensed, bonded, and insured across all 50 states.",
    [benefit("choose-icon1.png", "Free facility inspection", "Every new customer receives a complete inspection of their entire address to identify options to optimize facility maintenance."),
     benefit("choose-icon2.png", "FM scope program", "Define and optimize your facility maintenance strategy to predict current and future demands."),
     benefit("choose-icon3.png", "National crew network", "500+ crews across 250+ locations ready to service your commercial properties nationwide."),
     benefit("choose-icon4.png", "Insured &amp; licensed", "Nationally insured facility services with professional, vetted crews for every job.")],
    "about-img2.jpg", "Call Indigo facility inspection",
)

COM_MAIN = "\n\n".join([
    "  <!-- ======================= HERO ======================= -->\n"
    "  <!-- v1 /commercial hero, copy verbatim (bundle `commercialHero`). -->\n" + COM_HERO,
    '  <div class="spacer"></div>',
    "  <!-- ======================= DATA RIBBON ======================= -->\n"
    "  <!-- v1 `commercialDataRibbon`, all four items verbatim. -->\n" + COM_RIBBON,
    '  <div class="spacer"></div>',
    "  <!-- ======================= VALUE PROP ======================= -->\n" + COM_VALUE,
    '  <div class="spacer"></div>',
    "  <!-- ======================= BENEFITS ======================= -->\n" + COM_BENEFITS,
    '  <div class="spacer"></div>',
    "  <!-- ======================= FINAL CTA ======================= -->\n"
    "  <!-- NOTE the heading below is v1's own string, verbatim — it renders as\n"
    '       "Call Call Indigo for your commercial property" because v1 interpolates\n'
    "       `Call {brandName}` and `brandName` is itself \"Call Indigo\". Reproduced\n"
    '       as-is per the "exact textual content" brief; drop the leading "Call " to fix. -->\n'
    + CTA_BLOCK.format(
        h2="Call Call Indigo for your commercial property",
        sub="Tell us about your facility and we will build a custom maintenance strategy with a free inspection.",
        secondary=btn_pill("Residential", "residential.html", navy=True)),
])


def page(title, desc, nav_html, drawer_html, main):
    head = HEAD.replace(
        "<title>Call Indigo — Home &amp; Facility Services | Austin TX</title>",
        "<title>" + title + "</title>").replace(
        'content="Call Indigo — licensed, bonded and insured home and facility services in Austin, TX. '
        'Serving Hays, Travis and Williamson counties since 2012. One call covers plumbing, electrical, '
        'HVAC, carpentry, painting and more."',
        'content="' + desc + '"')
    header = HEADER.replace(OLD_NAV, nav_html)
    # The header's "Schedule Online" CTA points at #contact, which only exists on
    # the home page. The brand link stays "#top" — the <header> itself carries
    # id="top", so it resolves on every page.
    header = header.replace('href="#contact"', 'href="index.html#contact"')
    body_drawer = DRAWER.replace(OLD_DRAWER_LINKS, drawer_html)
    assert OLD_NAV not in header, "nav not replaced"
    assert OLD_DRAWER_LINKS not in body_drawer, "drawer links not replaced"
    # The footer's "Navigation" column points at in-page anchors that only exist on
    # the home page (#about / #process / #faq / #estimate / #services). Rewriting
    # them to index.html#… keeps them live on the sub-pages. The sub-page bodies
    # contain no bare "#" links of their own, so this touches the footer only.
    footer = FOOTER.replace('href="#', 'href="index.html#')
    return (head + '\n<body class="bg-white">\n\n' + header + "\n" + body_drawer + "\n" + main
            + '\n  <div class="spacer"></div>\n\n' + footer + "\n")


RES_TITLE = "Indigo Homes — Residential Home Services & Membership | Austin TX"
RES_DESC = ("Locally licensed and insured home services including plumbing, electrical, HVAC, carpentry, "
            "remodeling, painting, flooring, landscaping, handyman services, repairs, and more. Serving Hays, "
            "Travis, and Williamson counties since 2012.")
COM_TITLE = "Indigo Facilities — Commercial & Facility Services | National Coverage"
COM_DESC = ("Indigo Facilities provides national facility management, commercial maintenance, and insured facility "
            "partner services. 500+ crews, 250+ locations, all 50 states.")

(BASE / "residential.html").write_text(
    page(RES_TITLE, RES_DESC, nav("residential", "index.html", "index.html#contact"),
         drawer("residential", "index.html", "index.html#contact"), RES_MAIN),
    encoding="utf-8", newline="\n")

(BASE / "commercial.html").write_text(
    page(COM_TITLE, COM_DESC, nav("commercial", "index.html", "index.html#contact"),
         drawer("commercial", "index.html", "index.html#contact"), COM_MAIN),
    encoding="utf-8", newline="\n")

for f in ["residential.html", "commercial.html"]:
    p = BASE / f
    print(f, p.stat().st_size, "bytes,", p.read_text(encoding="utf-8").count("\n") + 1, "lines")
