# Valvoro template — real structure (extracted, not inferred)

## Provenance

The ThemeForest preview URL is behind Cloudflare Turnstile and returns 403 to every
automated fetch (verified: Playwright headless Chrome 153 with `--no-sandbox`, real UA,
stealth init script, 30 s poll — still `Just a moment...`). The local file
`Valvoro - Plumbing Services HTML Template Preview.html` (5.35 MB) is **not** template
markup — it is Envato's preview shell. Every `section`/`footer` string in it belongs to
Envato's own `.e-modal__*` marketplace CSS. It embeds the real demo in an iframe:

    <iframe class="full-screen-preview__frame"
            src="https://html.designingmedia.com/valvoro/" ...>

**That iframe src is the authoritative source.** `index.html` was downloaded from it
(99,330 bytes) and everything below is read out of that file directly.

## Tech stack (declared on the ThemeForest listing + confirmed in the markup)

| | |
|---|---|
| Framework | **Bootstrap 4.6.2** |
| Animation | wow.js (on-load), AOS |
| Fonts | **Archivo**, Oswald |
| Icons | Font Awesome |
| jQuery | 3.7.1 |
| Templates | 29 HTML5 pages, 3 home layouts |

### Declared design tokens vs. measured reality

The listing states primary `#30c3eb` / accent `#091f41`. The **rendered** demo uses a
different scheme. Measured by sampling the render:

| Role | Listing | Measured in render |
|---|---|---|
| Hero card bg | `#30c3eb` | **`#4a5ea3`** |
| Accent / utility bar | `#091f41` | **`#152040`** |
| Active nav pill | — | **`#7ec1e9`** |
| Body text | `#696969` | — |

The listing's `#30c3eb` is the raw default; the demo ships a recoloured scheme. The
prototype follows the **measured** values, which is what "clone the design" means here.

## Nav breakpoint — the key structural fact

    <nav class="navbar navbar-expand-lg navbar-light">

`navbar-expand-lg` in Bootstrap 4 means the horizontal menu appears at **≥992px**.
Below that it collapses to the hamburger. So the screenshot showing a full desktop nav
was captured at **≥992px**, and the demo canvas is therefore **wider than 960 CSS** —
consistent with measuring the hero card spanning x 6 → 940 inside a ~1000 CSS canvas.

The prototype gates its nav at Tailwind `md` (768px). That is *more* permissive than the
template, not less. It is not a fidelity claim to 992 — see "Open items".

## Header structure (verbatim, top level)

    header.header-con
      nav.navbar.navbar-expand-lg
        a.navbar-brand > figure > img[logo.png]
        button.navbar-toggler[data-target=#navbarSupportedContent]   (3 spans)
        div#navbarSupportedContent.collapse.navbar-collapse
          ul.navbar-nav.ml-auto
            li.nav-item.dropdown  > a.nav-link.dropdown-toggle.active "Home"
                 └ 3 items: Plumbing Services(index) / Repair & Maintenance(index2) / Industrial Plumbing(index3)
            li.nav-item           > a "About"        → about.html
            li.nav-item.dropdown  > a "Services"     → services.html / single-service.html
            li.nav-item.dropdown  > a "Pages"        → 13 items
            li.nav-item.dropdown  > a "Blog"         → 9 items
            li.nav-item           > a "Contact"      → contact.html
        div.header-contact
          ul.list-unstyled
            li > figure.header-phone > img[call-icon.png] + a[href=tel:+568925896325] "+5689 2589 6325"
            li > a.contact-btn[href=…add-to-cart=37903] "Buy Now for $12" + img[up-right-arrow.png]

**Note:** the marked-active item is **Home**, and its dropdown lists the three home
layouts. The desktop nav therefore reads: Home ▾ · About · Services ▾ · Pages ▾ · Blog ▾ · Contact.

The 6th item is **Blog ▾**. An earlier capture at a narrower width appeared to read
"Pricing" — that was a misread of the compressed glyphs; `pricing.html` exists but is a
*Pages* dropdown child, not a top-level item.

The header CTA is **"Buy Now for $12"** — a ThemeForest purchase link
(`designingmedia.com/checkout/?add-to-cart=37903`). It is marketplace chrome, not part of
the product design. Replaced in the prototype with a real CTA.

## Hero CSS — read out of `assets/css/style.css` + `responsive.css`

This supersedes the earlier *inferred* hero geometry. The template sizes the arch and
the plumber overlay in **fixed pixels per breakpoint**, not by aspect ratio. The
`.banner-img1` element is a plain container; the *image inside it* carries the size,
the `12px` padding and the `3px` border:

    .banner-img1 img { padding: 12px; border: 3px solid var(--primary--color); }
    .plumber-img    { top: 0; right: 0; }          /* pinned top-right, not centred */
    .banner-con .navy-box   { position:absolute; right:50px; top:126px; padding:19px 25px; }
    .banner-con .dot-img    { bottom: 0; }
    .banner-con .scrol-outer{ bottom: 60px; }
    .banner-con .banner-inner-con a.scroll-down-arrow {
        position:absolute; left:0; right:0; text-align:center; }
    .banner-con .banner-inner-con a.scroll-down-arrow figure {
        width:80px; height:80px; border-radius:100%; border:1px solid rgb(255 255 255 / 30%); }

`.banner-content-con p` is `font-size:22px; line-height:29px; padding-left:54px` with a
`::before` dash of `36 x 3px` at `top:12px` — i.e. **the dash is a CSS pseudo-element on
the paragraph, not a separate flex item.** `.banner-bottom { gap: 31px }`.

### Responsive cascade (the authoritative table)

| Element | ≥1200 base | ≤1440 | ≤1199 | ≤991 | ≤767 |
|---|---|---|---|---|---|
| `.banner-img1 img` | natural | **350px** | 350px | **320px** | 320px |
| `.plumber-img img` | natural | **440px** | 440px | **390px** | 390px |
| `.navy-box` | r:50 t:126 p:19/25 | r:0 t:39 p:13/20 | same | same | r:0 t:28 p:10/15 |
| `.dot-img` | bottom:0 | bottom:15px, img 40px | — | img 34px | — |
| scroll `figure` | 80×80 | **60×60** | 60×60 | **40×40** | 40×40 |
| `.scrol-outer` | bottom:60px | bottom:60px | — | bottom:30px | bottom:30px |

The supplied screenshot is ~1000 CSS wide, so the **≤1440 branch is the live one**:
arch image **350px**, plumber overlay **440px**, scroll ring **60×60**.

### Measured geometry (viewport 1440, banner 1383 × 643)

    bannerImgCon / bannerImg1   647.7 x 503.2   w/banner=0.468  aspect=1.287
    plumberImg                  440.0 x 577.0   abs=(942.7,173)  -> 74px BELOW the arch
    bannerImg2 (oval photo)     168.4 x 244.0   aspect=0.690
    innerWrap                   459.3 x 244.0   abs=(245.7,492)
    navyBox                     149.0 x 167.0   abs=(1233.6,212)
    h1                          647.7 x 160.0   abs=(57.3,304)
    ratingCon                   647.7 x  58.0   abs=(57.3,223)
    scrollAbs                   x=13.8 y=521 w=1355.3 h=22   (banner-relative)

**Two structural facts this pins down:**

1. The plumber overlay is **taller than the arch and hangs 74px below it** (577 vs 503).
   Containment is not the goal — the figure is `position-absolute; top:0; right:0` and
   deliberately overflows the arch's bottom edge.
2. The scroll cue is a **full-width centred strip** (1355 of 1383) sitting at ~81% of the
   banner's height — it is *not* pinned to the banner's bottom edge and *not* a
   left-offset element inside `col-lg-6`.

### Breakpoint confirmation from the render

    viewport 1440 / 1200 / 992  ->  nav=flex     toggler=none
    viewport  960 /  768        ->  nav=none     toggler=block

This confirms Bootstrap's `navbar-expand-lg` gate at **992px** exactly.

    section.banner-con.br-50.main-box
      div.wrapper1711 > div.banner-inner-con
        div.row
          div.col-lg-6                                   ← LEFT
            div.banner-content-con
              div.banner-top
                div.rating-con.d-flex
                  figure > img[google-icon.png]
                  span.rating-text.oswald-font "4.9"
                  div > span.text-size-14 "4.9/5 Reviews" + img[stars.png]
                h1.text-size-126.text-uppercase "Expert <br> Plumbing."
              div.banner-bottom.d-flex
                figure.banner-img2 > img[banner-img2.jpg].br-188     ← circular work photo
                div.inner-wrap
                  p.text-white
                  a.primary_btn "Book Appointment" + img[up-right-arrow.png]
                  div.statistics-wrapper.d-flex
                    div.statistics-box    : counter "15" + "k" + sup "+" + "Satisfied Clients"
                    div.statistics-box.var2: counter "250" + sup "+" + "Projects Completed"
          div.col-lg-6                                   ← RIGHT
            div.banner-img-con.position-relative
              figure.banner-img1 > img[banner-img1.jpg].br-258      ← the arch
              figure.position-absolute.plumber-img > img[banner-plumber-img.png]   ← overlay
              figure.position-absolute.dot-img > img[dots.png]
              div.navy-box.bg-accent.br-20.text-center              ← Emergency card
                img[emergency-icon.png].emrgncy-img
                span.text-size-20 "Emergency"
                span.text-size-14 "Typical arrival <br> 30–60 min"
                a > img[white-up-right-arrow.png]
        div.scrol-outer.position-absolute.text-center
          span "Scroll Down"
          a.scroll-down-arrow[href=#about] > figure > img[arrow-down.png]

**Three corrections this proves:**

1. The circular work photo (`banner-img2`, radius `br-188`) is the **first child of
   `banner-bottom`**, i.e. it sits left of the paragraph + CTA + stats block — not beside
   the stats alone.
2. The arch is **two layered images**: `banner-img1.jpg` (the arch with `br-258`) *plus*
   `banner-plumber-img.png` absolutely positioned over it. A single-image arch cannot
   reproduce the reference.
3. `h1` is `text-size-126` — the template declares h1 = **126**, i.e. an extremely large
   display size. The demo renders it far smaller at this width, so 126 is a max, not a
   fixed value.

## Full page section order (13 sections)

| # | id | classes | heading |
|---|---|---|---|
| 1 | — | `banner-con br-50 main-box` | Expert Plumbing. |
| 2 | `about` | `about-us-con bg-grey main-box br-50` | Delivering Quality Plumbing Solutions |
| 3 | — | `services-con padding-top padding-bottom main-box` | Provides Professional Plumbing Services for Every Need |
| 4 | — | `why-choose-us-con bg-grey main-box br-50` | Committed to Your Comfort & Safety. |
| 5 | — | `price-estimation-con padding-top padding-bottom br-50 main-box` | Instant Price Estimate |
| 6 | — | `how-it-works-con padding-top padding-bottom main-box text-center` | How Our Simple & Reliable Plumbing Process Works |
| 7 | — | `before-after-gallery-con bg-grey main-box br-50 padding-top padding-bottom` | Real Repairs. Real Results. Done Right. |
| 8 | — | `client-reviews-con position-relative padding-top padding-bottom main-box` | Trusted Reviews from Homeowners & Businesses |
| 9 | — | `check-availability-con position-relative main-box br-50` | Check Service Availability in Your Area |
| 10 | — | `faq-con main-box bg-grey br-50 padding-top padding-bottom` | Answers to Your Frequently Asked Questions |
| 11 | — | `trusted-companies-con padding-top padding-bottom main-box` | Trusted By Leading Brands |
| 12 | — | `cta-con main-box br-50 padding-rl-30` | Need Help Right Now? Call Our Emergency Line. |
| 13 | — | `footer-con main-box bg-accent br-50` | Navigation / Contact Info / Open Hours |

**Rhythm rule:** the template alternates `bg-grey` and white, and every second band
carries `br-50` (a 50px radius on the *section*, not on a nested card). Sections 2, 4, 5,
7, 9, 10, 12, 13 are `br-50`; the page is a stack of large rounded slabs, not flat bands.

## The 26 page templates referenced from index.html

    404.html                about.html              blog.html
    coming-soon.html        contact.html            cookie-policy.html
    faq.html                four-column.html        gallery.html
    index.html              index2.html             index3.html
    load-more.html          one-column.html         pricing.html
    privacy-policy.html     services.html           single-blog.html
    single-service.html     six-colum-full-wide.html
    team.html               term-of-use.html        testimonials.html
    three-column-sidebar.html  three-column.html    two-column.html

(26 linked from the homepage; the listing states 29 shipped. `index2`/`index3` are the
alternate home layouts named in the Home dropdown.)

## Open items

- The prototype gates the desktop nav at 768px; the template's real gate is **992px**.
  Closing that gap means moving the nav/CTA gates to a 992-aligned breakpoint.
- Section 13's footer is `bg-accent` (`#091f41` measured as `#152040` in render).
- The prototype collapses several `br-50` section slabs into flat bands; the reference
  stacks rounded slabs at every alternating band.
