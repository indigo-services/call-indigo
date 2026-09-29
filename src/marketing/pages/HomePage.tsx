/**
 * HomePage — rendered from valvoro-prototype/index.html (PRD §5.1).
 *
 * Uses dangerouslySetInnerHTML to preserve exact markup from the static
 * prototype. This avoids JSX conversion issues with complex nesting and
 * gives pixel-perfect parity for rc1. Post-rc1: refactor into React components.
 */
import { useEffect } from "react"
import { useSiteChrome } from "@/marketing/useSiteChrome"

const BODY_HTML = `<!-- ======================= TOP UTILITY BAR ======================= -->
  <!-- The template's chain is
       \`.padding-rl > .home-outer-wrapper.main-box > .topbar-con.main-box >
        .main-container > .top-bar-inner-content.br-40.bg-accent\`
       so the dark bar is capped by \`.main-container\` (1417px), NOT by the slab.
       01_Home.jpg confirms it exactly: the bar's dark run at y=0 is x 252..1666
       = 1415 wide, i.e. 1417 centred in the 1820 slab. It is 43px tall (dark at
       x=960 for y 0..42) and starts flush at y=0 with no top inset.
       Corners: \`.top-bar-inner-content\` is \`br-40\` PLUS an explicit
       \`border-top-left-radius: 0; border-top-right-radius: 0\` (style.css:433-437).
       Zeroing the top radii is what stops CSS's adjacent-corner rule from
       clamping the authored radius (0 + r < the 43px height), so the bottom arc
       renders at its full value while the top corners stay square. The shape is
       kept in v2; only the value moves, 40px -> 12px (see \`.pill-topbar\`).

       CONTENT — v2 brief, 2026-09-18: "make the top ribbon text/content match
       v1". Sourced verbatim from call-indigo.com's own bundle
       (ci_0lso0f523lp39.js, the \`header\` component), which renders:
         left  : clock icon + "Residential & commercial services"
                 pin   icon + site.serviceArea = "Hays, Travis, and Williamson counties"
         right : "Est. {establishedYear} · {legalName}"
                 = "Est. 2012 · Indigo Home & Facility Services"
       This replaces the previous v2-only copy ("Open 24/7 • Emergency Service",
       the street address, and "License: RMP: 45574"). Two deliberate
       departures from v1's markup: the 1px divider between the two left items
       is dropped, because v1's ribbon has no divider (its left group is just
       \`flex gap-4 md:gap-6\`); and the icons stay \`text-sky\` rather than v1's
       \`#818cf8\`, because this file's palette is the v2 blue/cyan one.
       NOTE the address and licence number now appear only in the footer. -->
  <div class="pad-rl">
    <!-- The BAR is the background layer and spans the full card width, exactly
         like every \`.slab\` below it. The \`.shell\` inside is the text layer.
         Previously the bar sat inside the \`.shell\`, so the bar ITSELF was
         capped at 1417px: measured at 1920 the bar ran x 251.5..1668.5 while the
         hero slab ran x 50..1870 — 201.5px narrower per side, which is the
         defect this fixes. Its text was inset a further \`pl-[47px] pr-[43px]\`
         from its own edge, landing 47px right of the header brand.
         Now: bar edge = card edge, and \`.mbox\` puts the text on \`--inset\`, the
         same line as the brand and every section heading. -->
    <div class="pill-topbar mbox bg-topbar text-[13px] text-slate-200 max-md:text-[14px]">
      <div class="shell flex h-[43px] items-center justify-between gap-4 max-md:h-auto max-md:flex-wrap max-md:gap-2.5 max-md:py-2.5">
        <div class="flex flex-wrap items-center gap-4 max-md:gap-2.5">
          <span class="inline-flex items-center gap-2 font-semibold text-white">
            <svg class="size-4 text-sky" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 21s-7-5.5-7-11a7 7 0 1 1 14 0c0 5.5-7 11-7 11z"/><circle cx="12" cy="10" r="2.6"/></svg>
            Proudly serving: Hays, Travis, and Williamson counties
          </span>
        </div>
        <div class="flex items-center gap-2.5 max-md:hidden">
          <span>Est. 2012 · Indigo Home &amp; Facility Services</span>
        </div>
      </div>
    </div>
  </div>

  <!-- ======================= HEADER ======================= -->
  <!-- \`.header-con { padding: 25px 0; background:#fff }\` (style.css:510) with an
       18px override at ≤1440. It is a \`main-box br-20\` card nested inside a
       \`.main-container\`, which is why the reference's header content lands at
       1355.3 @ x42.3 at 1440 and 1417 at 1920.
       NOTE the header is kept as a BODY-LEVEL sticky element rather than being
       nested inside the outer card as the template does: \`position: sticky\` only
       survives for as long as its parent's box, and the template's outer card
       ends at the hero. The \`pad-rl / mbox / shell / header-card mbox\` chain
       below reproduces the same width cascade without that limitation. -->
  <header id="top" class="pad-rl sticky top-0 z-40 bg-white/95 py-[25px] shadow-none backdrop-blur transition-shadow max-md:py-[14px] [&.is-scrolled]:shadow-[0_10px_30px_rgba(13,21,49,.08)]">
    <!-- The header card is the background layer (full card width) and the
         \`.shell\` inside is the text layer, so the brand lands on the same line
         as the ribbon text and every section heading.
         The extra \`.mbox\` wrapper this replaces double-charged the inset: the
         chain was \`.pad-rl > .mbox > .shell > .header-card.mbox\`, i.e. the card
         edge at 42.6 while the hero slab's edge was at 28.8 (1440), and at 1920
         the brand sat at x 265.7 against the section text's 251.5. -->
    <div class="header-card mbox">
      <div class="shell flex h-[56px] items-center max-md:h-[56px]">
      <!-- Brand. Reference cap height measured off 01_Home.jpg = 17px (VALVORO
           wordmark, src y 88..104), i.e. ~23.4px of Inter at cap-ratio 0.727,
           vs 16px for the 22px size that shipped. Bumped only at \`xl\` (>=1280):
           the header row has ~238px of slack there, but only ~24px at 1024, so
           anything below xl would push the CTA out of the row. -->
      <a href="#top" class="flex shrink-0 items-center gap-2">
        <div class="shrink-0 rounded-full bg-[#1e1b4b] p-2 max-md:p-1.5"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-white max-md:size-[18px]" aria-hidden="true"><path d="M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384"></path></svg></div>
        <span class="font-sans text-[22px] font-bold leading-none tracking-[-0.06em] text-[#1e1b4b] max-md:text-[19px] xl:text-[24px]">Call Indigo</span>
      </a>

      <!-- Desktop horizontal nav (reference shows a full menu, not a burger).
           Breakpoint is md (768), NOT lg (1024): the reference shows the full
           menu at every desktop width, so an lg gate would collapse it to a
           burger on a 960px laptop.
           ITEMS — v2 brief, 2026-09-18: exactly four, Home / Residential /
           Commercial / Contact. The v1 build (call-indigo.com,
           ci_0lso0f523lp39.js \`homePage.navigation\`) carries seven: Home,
           Residential, Commercial, About, Services, Contact and a
           "Call for a Consultation" tel: entry. About / Services / Pricing are
           dropped from the v2 top level. The template's dropdown carets go with
           them — none of the four has children.
           ANCHORS: Residential and Commercial are REAL PAGES in this build —
           residential.html and commercial.html, each reproducing the
           corresponding call-indigo.com route's copy verbatim in the v2 design
           system. They are the only two sub-pages; Contact still resolves to the
           home page's #contact band, because v1's /forms/contact is a form route
           with no equivalent here.
           The \`aria-current="page"\` attribute marks the active item; each page
           moves it to its own entry (see the nav block in residential.html /
           commercial.html).
           Type and pill are quoted from style.css: \`.header-con .nav-link\` is
           \`font-size:15px; color:var(--black--color); font-weight:500\`, and the
           \`.active\` pill is \`background:var(--primary--color); padding:0 15px;
           border-radius:15.5px\`. 01_Home.jpg agrees — the Home pill measures 42px
           tall and the nav's ink rows sit at y 89..104. The 12.5px → 14px bump
           from the previous pass is kept and raised to the template's 15px, gated
           at \`xl\` because the row only has room for it there.
           RADIUS: the pill is no longer the template's 15.5px stadium. v2 drops
           the fully-round corner language globally (see the --radius-* tokens),
           so a 42px-tall item gets an 8px radius. -->
      <!-- \`.navbar-nav { gap: 52px }\` upstream. The four-item row measures ~330px
           of content rather than the template's ~1004px, so the gap ladder no
           longer governs whether the row fits; it is left in place to keep the
           template's rhythm, and the phone block below is \`ml-auto\`. -->
      <nav class="ml-[38px] hidden items-center gap-[22px] whitespace-nowrap md:flex md:gap-[16px] lg:ml-[84px] lg:gap-[22px] xl:gap-[34px] 2xl:gap-[52px] max-md:ml-0" aria-label="Main">
        <a href="#top" class="inline-flex h-[42px] items-center rounded-[8px] bg-sky px-[15px] text-[12.5px] font-semibold leading-none text-white xl:text-[15px]" aria-current="page">Home</a>
        <a href="/residential" class="text-[12.5px] font-semibold text-ink hover:text-brand xl:text-[15px]">Residential</a>
        <a href="/commercial" class="text-[12.5px] font-semibold text-ink hover:text-brand xl:text-[15px]">Commercial</a>
        <a href="/contact" class="text-[12.5px] font-semibold text-ink hover:text-brand xl:text-[15px]">Contact</a>
      </nav>

      <!-- Phone: the number text is dropped in the md–lg band so the nav + CTA
           both fit at the reference's 960 canvas; the icon stays tappable. -->
      <a href="tel:+15126084999" class="ml-auto inline-flex shrink-0 items-center gap-[7px] whitespace-nowrap text-[16.5px] font-bold tracking-[-.01em] text-[#081f3f] max-md:gap-[6px] max-md:text-[15px] md:[&>span]:hidden lg:[&>span]:inline">
        <img src="/assets/images/call-icon.png" alt="" class="size-[22px] object-contain">
        <span>(512) 608-4999</span>
      </a>
      <!-- CTA: only shown when the full nav + phone also fit (lg and up). At md–lg
           the nav is present but the pill is dropped, so the row cannot overflow.
           Sized from the reference: the cyan pill measures 216 x 54 at x1452,
           against the 27px-tall one this file shipped. -->
      <a href="/contact" class="ml-[18px] hidden shrink-0 items-center gap-[7px] whitespace-nowrap rounded-[10px] bg-sky py-[4px] pl-[15px] pr-[4px] text-[12.5px] font-semibold leading-none text-white transition hover:bg-sky-soft lg:inline-flex max-lg:hidden xl:h-[54px] xl:min-w-[216px] xl:justify-center xl:gap-[7px] xl:pl-[26px] xl:pr-[6px] xl:text-[16px] xl:font-bold">
        <span>Schedule Online</span>
        <span class="grid size-[19px] shrink-0 place-items-center rounded-full bg-white text-ink xl:size-[42px]">
          <svg viewBox="0 0 24 24" class="size-[11px] xl:size-[14px]" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17L17 7M9 7h8v8"/></svg>
        </span>
      </a>
      <button id="burger" aria-label="Open menu" aria-expanded="false"
        class="group ml-auto hidden flex-col items-end gap-1.5 p-2 max-md:flex">
        <span class="block h-[3px] w-8 rounded bg-ink transition group-aria-expanded:translate-y-[9px] group-aria-expanded:rotate-45"></span>
        <span class="block h-[3px] w-8 rounded bg-ink transition group-aria-expanded:opacity-0"></span>
        <span class="block h-[3px] w-8 rounded bg-ink transition group-aria-expanded:-translate-y-[9px] group-aria-expanded:-rotate-45"></span>
      </button>
      </div>
    </div>
  </header>

  <!-- ======================= MENU DRAWER ======================= -->
  <nav id="menu-panel" aria-hidden="true"
    class="fixed inset-y-0 right-0 z-50 flex w-[min(380px,88vw)] translate-x-[105%] flex-col overflow-y-auto bg-ink px-8 pb-10 pt-7 text-white transition-transform duration-[400ms] ease-[cubic-bezier(.7,0,.2,1)] [&.open]:translate-x-0">
    <div class="mb-6 flex items-center justify-between">
      <div class="flex items-center gap-2.5">
        <div class="shrink-0 rounded-full bg-white p-2"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-[#1e1b4b]" aria-hidden="true"><path d="M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384"></path></svg></div>
        <span class="font-sans text-[22px] font-bold leading-none tracking-[-0.06em] text-white">Call Indigo</span>
      </div>
      <button id="menu-close" aria-label="Close menu" class="text-2xl leading-none text-white">✕</button>
    </div>
    <a href="#top" class="border-b border-white/10 py-3 text-[22px] font-semibold text-sky hover:pl-2 hover:text-sky" aria-current="page">Home</a>
    <a href="/residential" class="border-b border-white/10 py-3 text-[22px] font-semibold hover:pl-2 hover:text-sky">Residential</a>
    <a href="/commercial" class="border-b border-white/10 py-3 text-[22px] font-semibold hover:pl-2 hover:text-sky">Commercial</a>
    <a href="/contact" class="border-b border-white/10 py-3 text-[22px] font-semibold hover:pl-2 hover:text-sky">Contact</a>
    <a href="tel:+15126084999" class="mt-6 inline-flex items-center gap-3 font-bold text-sky">
      <img src="/assets/images/call-icon.png" alt="" class="size-5 object-contain"> (512) 608-4999
    </a>
  </nav>
  <div id="menu-backdrop" class="pointer-events-none fixed inset-0 z-40 bg-[rgba(9,14,33,.6)] opacity-0 transition-opacity duration-300 [&.show]:pointer-events-auto [&.show]:opacity-100"></div>

  <!-- ======================= HERO CARD ======================= -->
  <!-- \`.banner-con\` (style.css:1095) is \`main-box br-50\` with
       \`padding: 55px 0 80px\`, a \`background-image\` of banner-bg-img.jpg, and a
       \`::before\` carrying \`rgb(25 80 160 / 88%)\` at the same 50px radius. So the
       blue is an 88%-opaque scrim over the photo — not a flat fill. The previous
       build painted \`bg-brand\` and washed a 22%-opacity photo through it with
       \`mix-blend-luminosity\`, which rendered #596db0 against the reference's
       measured #2b5ba3.
       Inside the slab, \`.wrapper1711\` (responsive.css:9) caps content at 1711px,
       which at 1920 puts it at x 104.5 within the 1820 slab. -->
  <div class="pad-rl">
    <section class="mbox slab slab-photo scrim-hero hero-card relative bg-brand">
      <img src="/assets/images/banner-bg-img.jpg" alt="" aria-hidden="true"
        class="pointer-events-none absolute inset-0 z-0 size-full object-cover">

      <!-- col-lg-6 / col-lg-6 => the template's columns stack at ≤991 (Bootstrap
           lg), not at 768. Same gate as the navbar. -->
      <!-- Structure: inside the 1711 wrapper a Bootstrap .row of two col-lg-6
           columns, each with 15px side padding, so the content column measures
           647.7 at 1440. The old single grid with px-[49px] gave 630.5 — 17px
           narrow — because it collapsed the row inset and the column gutter into
           one number. -->
      <div class="slab-body hero-wrap">
      <div class="relative max-md:px-0">
        <div class="hero-row grid grid-cols-2 items-start gap-0">
          <!-- col-lg-6: 677.7 with 15px side padding => 647.7 of content, the
               exact measured value. -->
          <div class="hero-inner px-[15px] text-white">
            <div class="banner-content-con pt-[50px]">
          <!-- banner-top — \`.banner-content-con .banner-top { padding-left:60px }\`
               is the base rule, but responsive.css ZEROES it at ≤1440 (the live
               branch for this canvas). Measured: pl = 0px in the render. -->
          <div class="banner-top">
          <!-- Google rating — \`.rating-con { gap:14px; margin-bottom:23px }\` base,
               then \`gap:12px; margin-bottom:13px\` at ≤991 and \`gap:10px;
               margin-bottom:13px\` at ≤767 (responsive.css:2537 / 3796).
               The disc is the template's \`google-icon.png\`, which is 58x58 — the
               reference measures it 55-57px tall at x 186..240. This build had it
               at 60px with a -4px nudge, i.e. 10px left of the reference. -->
          <div class="rating-con flex items-center">
            <span class="ml-[6px] grid size-[58px] shrink-0 place-items-center rounded-full bg-white">
              <svg viewBox="0 0 48 48" class="size-[40px]">
                <path fill="#4285F4" d="M45 24c0-1.6-.1-2.7-.4-4H24v8.5h12C35.7 31 34 33.6 31.3 35.4v5.6h6.2C41.3 37.4 45 31.3 45 24z"/>
                <path fill="#34A853" d="M24 46c5.9 0 10.9-2 14.5-5.3l-7.1-5.6C29.4 36.4 27 37 24 37c-5.8 0-10.7-3.9-12.4-9.2H5v5.8C8.6 40.9 15.7 46 24 46z"/>
                <path fill="#FBBC05" d="M11.6 27.8A13.2 13.2 0 0 1 10.9 24c0-1.3.2-2.7.7-3.8v-5.8H5A22 22 0 0 0 2 24c0 3.5.9 6.9 2.9 9.8l6.7-6z"/>
                <path fill="#EA4335" d="M24 10.8c3.3 0 6.2 1.1 8.5 3.3l5.4-5.4C34.8 5.2 29.9 3 24 3 15.7 3 8.6 8.1 5 15.4l6.6 5.2C13.3 15.4 18.2 10.8 24 10.8z"/>
              </svg>
            </span>
            <b class="rating-num font-bold tracking-[-.02em]">4.9</b>
            <div>
              <span class="mb-1.5 block text-[13px] text-white/95">4.9/5 Reviews</span>
              <div class="flex gap-[3px]">
                <svg viewBox="0 0 24 24" class="size-[15px] fill-star"><path d="M12 2l3 6.6 7 .7-5.2 4.7 1.5 7L12 17.4 5.7 21l1.5-7L2 9.3l7-.7z"/></svg>
                <svg viewBox="0 0 24 24" class="size-[15px] fill-star"><path d="M12 2l3 6.6 7 .7-5.2 4.7 1.5 7L12 17.4 5.7 21l1.5-7L2 9.3l7-.7z"/></svg>
                <svg viewBox="0 0 24 24" class="size-[15px] fill-star"><path d="M12 2l3 6.6 7 .7-5.2 4.7 1.5 7L12 17.4 5.7 21l1.5-7L2 9.3l7-.7z"/></svg>
                <svg viewBox="0 0 24 24" class="size-[15px] fill-star"><path d="M12 2l3 6.6 7 .7-5.2 4.7 1.5 7L12 17.4 5.7 21l1.5-7L2 9.3l7-.7z"/></svg>
                <svg viewBox="0 0 24 24" class="size-[15px] fill-star"><path d="M12 2l3 6.6 7 .7-5.2 4.7 1.5 7L12 17.4 5.7 21l1.5-7L2 9.3l7-.7z"/></svg>
              </div>
            </div>
          </div>
          <!-- H1 — \`text-size-126\`: 126/119 base, and the template's own
               responsive cascade 90/80 (≤1440), 70/65 (≤1199), 55/60 (≤991). -->
          <h1 class="hero-h1 mb-[28px] font-sans font-extrabold uppercase text-white">Expert <br> <span id="hero-rotate" class="hero-rotate">Plumbing</span>.</h1>
          </div><!-- /banner-top -->

          <!-- banner-bottom: base \`gap:31px\`, but responsive.css sets 20px at ≤1440
               (the live branch). -->
          <div class="banner-bottom flex">
            <!-- CLIENT 2026-09-25: the smaller round frame that used to sit
                 here - a 266x387 white-ringed oval immediately under the
                 headline, next to the much larger arch - is deleted. Against
                 the arch it read as a second, competing picture frame.
                 repair-img2.jpg is now unreferenced. -->
            <!-- Deliberately unclassed. The reference's \`.inner-wrap\` is
                 \`flex: 0 1 auto\` with \`min-width:auto\`, which is already the
                 default for a flex item — it does NOT grow. It is the CONTENT's
                 natural width (250px CTA + the stat row) that sets the
                 distribution. A \`flex-1\` here (flex:1 1 0%) instead swallows
                 the slack and the row stops being content-sized. -->
            <div>
              <!-- \`.banner-content-con p\` is 22px/29px at base but responsive.css
                   overrides to 18px/27px at ≤1440 (with margin-bottom 25px). The
                   dash \`::before\` shrinks 36px → 20px in the same branch. Measured
                   line box: 459.3 wide. -->
              <!-- The HARD \`<br>\` is the template's own markup (index.html:216):
                   \`<p class="text-white">Fast, licensed, and local. From leaks to
                   clogs to <br> heater failures—our experts fix it today.</p>\`.
                   It is what makes the reference exactly two lines; the break is
                   suppressed below 1440 by \`.banner-content-con p br{display:none}\`. -->
              <p class="banner-lead relative font-medium text-white">Fast, licensed, and local. From leaks to clogs to <br>heater failures—our experts fix it today.</p>
              <a href="/contact" class="pill pill-lg hero-cta">
                <span>Book Appointment</span>
                <span class="pill-circle">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17L17 7M9 7h8v8"/></svg>
                </span>
              </a>
              <!-- statistics-wrapper — \`.banner-con .statistics-wrapper {
                   margin-left: 22px }\` (style.css:1173). Each box is
                   \`padding: 0 34px\` and carries a 1px x 68px white/30% divider on
                   its right edge; the second box has \`.var2\`, which turns that
                   divider off. The numerals are 36px/36px weight 800 — the same
                   size as the \`+\` sup and the \`k\` span, which is why the reference
                   reads "15K+" with all three at cap height. The labels are
                   16px/29px solid white (NOT a translucent tint). -->
              <div class="statistics-wrapper flex items-center">
                <div class="statistics-box">
                  <b class="stat-num">15<span class="uppercase">k</span><sup>+</sup></b>
                  <span class="span-text">Satisfied Clients</span>
                </div>
                <div class="statistics-box var2">
                  <b class="stat-num">52,550<sup>+</sup></b>
                  <span class="span-text">Jobs Completed</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        </div>
        <!-- col-lg-6 — the image column. \`.banner-img-con\` has NO side padding in
             the template (measured w=647.7 at x=735, i.e. the same box as the text
             column's content). In the template the arch is its natural-width first
             child pinned to the left edge, with the navy box absolutely placed at
             the far right — which left ~210px of dead space between them at 1920.
             CLIENT 2026-09-25: both are now FLOW items of a centred flex row, so
             the arch is centred in the space left of the card. -->
        <div class="relative px-[15px]">
        <div class="banner-img-con relative">
          <!-- banner-img1 — the arch. The template sizes the IMAGE, not the
               container: \`.banner-img1 img { padding:12px; border:3px solid
               var(--primary--color) }\` (style.css:1221) with NO width above 1440,
               so it renders at banner-img1.jpg's natural 376x556 CONTENT box =>
               406x586 border-box. \`br-258\` is the arch radius. -->
          <figure class="banner-img1 relative m-0">
            <!-- id="hero-arch": useSiteChrome swaps this to the photograph for
                 whichever service #hero-rotate is naming, so the picture and the
                 headline agree. The static src is the FIRST rotation option, so a
                 no-JS or reduced-motion load shows a real photograph rather than
                 an empty frame. The five files are all 376x556 because this slot
                 is NATURAL SIZE - the file's own pixels ARE the rendered box - so
                 a differently-sized swap would move the hero. Built by
                 scripts/_hero_arch_build.cjs, which enforces that.

                 CLIENT 2026-09-25: the arch is no longer pinned to the column's
                 left edge. It is centred in the space left of the Emergency card
                 (see .banner-img-con in src/index.css). This wrapper is what keeps
                 the decorative dots glued to the arch rather than to the column. -->
            <span class="hero-arch-slot">
              <img id="hero-arch" src="/assets/images/hero-arch-plumbing.jpg"
                alt="Call Indigo plumber working on the pipework under a sink"
                class="block h-auto max-w-full rounded-[258px] border-[3px] border-sky object-cover p-[12px]">
              <!-- dot-img - the template puts this at the image column's bottom-left
                   with a 54px width above 1440 and 34px at 1199. It lives inside
                   the arch wrapper now, so bottom-left means the arch's. -->
              <img src="/assets/images/dots.png" alt="" aria-hidden="true"
                class="dot-img pointer-events-none absolute left-0 opacity-90">
            </span>
          </figure>

          <!-- navy-box.bg-accent.br-20 - the template's \`.banner-con .navy-box\`
               was \`position:absolute; right:50px; top:126px\`, measured 159x179,
               and hidden below 768 because that anchoring assumes the two-column
               hero.

               CLIENT 2026-09-25: "the red button is small on desktop, and on
               mobile it is not there". Both were true. The card is now a FLOW
               item in the hero image column (see \`.banner-img-con\` in
               src/index.css), which is what makes it render at every width: an
               earlier \`max-md:static\` attempt had been defeated by a
               \`.navy-box { display:none !important }\` in the <=991 block, so the
               card had never once appeared on a phone. The disc, the label and
               the padding are all larger so it reads as the emergency action
               rather than as a caption. -->
          <a href="tel:+15126084999"
             class="navy-box flex flex-col items-center justify-center rounded-[12px] bg-[#b5534a] text-center text-white shadow-[16px_2px_13px_rgb(0_0_0/11%)] transition hover:bg-[#9d4238]">
            <!-- CLIENT 2026-09-26: the card is RED now, not navy. \`#b5534a\` is
                 the muted tone and \`#6f150e\` below is the dark one; both are the
                 same hue as the old \`#d92d20\` disc, one desaturated and one
                 darkened. The pair is computed, not eyeballed — white on the
                 card is 4.88:1, which the 15px sub-line needs, and a red merely
                 darker than \`#d92d20\` would have failed it. Full arithmetic in
                 \`src/index.css\` under \`.emergency-disc\`. -->
            <!-- CLIENT: a round brand mark here, not the template's siren
                 raster. Same disc-and-glyph lockup as the header - a rounded-full
                 disc holding a lucide phone. Enlarged 2026-09-25 from
                 p-1.5/20px to p-2.5/24px (a 44px disc); CLIENT 2026-09-26 takes
                 it to 58px with a 30px glyph, and \`.emergency-disc\` in
                 \`src/index.css\` sizes it and pulls it up so exactly half of it
                 sits outside the card's top edge. The size lives there, not in a
                 \`p-*\` utility, because the margin that produces the protrusion
                 is derived from it. -->
            <div class="emergency-disc mb-[10px] grid shrink-0 place-items-center rounded-full bg-[#6f150e]" aria-hidden="true"><svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-white"><path d="M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384"></path></svg></div>
            <b class="mb-[6px] block text-[26px] font-bold leading-[30px]">Emergency</b>
            <span class="mb-1.5 block text-[15px] font-medium leading-[21px] text-white">Typical arrival<br>30–60 min</span>
            <span class="inline-block h-[28px] leading-[28px]"><img src="/assets/images/white-up-right-arrow.png" alt="" aria-hidden="true" class="inline h-[11px] w-[12px] align-middle object-contain"></span>
          </a>
        </div>
        </div>
      </div>
      </div>

      <!-- scrol-outer.position-absolute.text-center — \`.banner-con .scrol-outer
           { bottom:60px }\`. The label is a full-width 14px/20px block with
           margin-bottom 12px at base (2px at ≤1440); the arrow is
           \`position:absolute; left:0; right:0; display:flex; justify-content:center\`
           with an 80x80 ring at base (60 at ≤1440, 40 at ≤1199) — so it sits BELOW
           the label but is out of flow, which is why the outer measures only the
           label's height. Measured in 01_Home.jpg: ring occupies y 927-1007. -->
      <div class="scrol-outer pointer-events-none absolute inset-x-0 bottom-[60px] z-20 text-center max-md:hidden">
        <span class="block text-[14px] font-medium leading-[20px] text-white">Scroll Down</span>
        <a href="#about" aria-label="Scroll down to the next section"
           class="scroll-down-arrow pointer-events-auto absolute inset-x-0 flex items-center justify-center text-white">
          <span class="grid place-items-center rounded-full border border-white/30">
            <svg viewBox="0 0 24 24" class="size-[12px]" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M6 13l6 6 6-6"/></svg>
          </span>
        </a>
      </div>
    </section>
  </div>

  <div class="spacer"></div>

  <!-- ======================= ABOUT ======================= -->
  <!-- \`.about-us-con.bg-grey.main-box.br-50\` (style.css:2099) = 30px vertical. -->
  <div class="pad-rl">
    <section id="about" class="mbox slab bg-mist pad-30">
      <!-- \`.about-us-con\` uses \`container-fluid p-0\`, NOT \`.main-container\`, so
           its content spans the full slab (1820 at 1920). \`.about-us-inner-con\`
           is \`grid-template-columns: 45% 49%\` with a 120px gap.
           The photos are rendered at their NATURAL widths — 01_Home.jpg puts
           about-img1 at x 80..451 (372px, its exact intrinsic width) and
           about-img2 at x 479..826 (347px, also intrinsic) with a 28px gap, and
           the slab measures y 1125..1853 = 729 tall, i.e. content 668 tall =
           photo 1's own 669px height. The previous \`w-[88%]\` upscaled photo 1 to
           580px and blew the band out to 1126px — 397px too tall. -->
      <div class="grid grid-cols-2 items-center gap-[70px] max-lg:grid-cols-1 max-lg:gap-11 lg:grid-cols-[45%_1fr] lg:gap-[120px]">
      <div class="reveal flex items-center gap-[30px] max-lg:justify-center max-md:gap-0">
        <!-- The photo row is FLUID up to the natural widths, not fixed at
             them. \`45%\` of the grid container is less than 372+30+347 for any
             container narrower than ~1664px, and the two figures were
             \`shrink-0\`, so they spilled out of their column and painted over
             the text. Measured at 1440: figure 2 ran to x 791.6 while the text
             column started at x 772.3 — a 19.3px overlap (195px at 1024) that
             \`body { overflow-x: hidden }\` hid from every overflow check, because
             the spill never reached the viewport edge. -->
        <!-- CLIENT 2026-09-26 — the two photos SWAP slots. The widths travel
             with them: \`flex-[…]\`/\`max-w-[…]\` are each file's own natural width
             (372 for about-img1, 347 for about-img2), so leaving them behind
             would upscale the 347px source into a 372px box and squeeze the
             other. \`about-img2.jpg\` takes the LEFT slot because the badge now
             sits at the seam between the two — see \`.years-badge\` in
             src/index.css for why that is the safe way round. -->
        <figure class="m-0 min-w-0 flex-[347] max-w-[347px] max-lg:w-[260px] max-lg:flex-none max-lg:max-w-none max-md:w-1/2 max-md:pr-[8px]">
          <img src="/assets/images/about-img2.jpg" alt="Property inspection" class="w-full rounded-[18px]">
        </figure>
        <div class="relative min-w-0 flex-[372] max-w-[372px] max-lg:w-[280px] max-lg:flex-none max-lg:max-w-none max-md:w-1/2 max-md:pl-[8px]">
          <figure class="m-0">
            <img src="/assets/images/about-img1.jpg" alt="Call Indigo technician at work" class="w-full rounded-[18px]">
          </figure>
          <!-- .years-experience-con — the template's 205 x 301 vertical lozenge,
               \`border-radius: 104px\`, badge x 724..929.

               CLIENT 2026-09-26, twice over. First: "between the two photos to
               the left, but with the images swapped so it doesn't overlap the
               left image person's photo" — the template's \`right: -29%\` hung it
               off the photo row's right end, 104px of it on the right photo and
               100px past the row entirely. Then: make it HORIZONTAL, icon left
               and text right, centred at the BOTTOM between the two photos.

               So the geometry moved into \`.years-badge\` in src/index.css, which
               now owns the position, the padding, the gap and — through the
               \`--yb-*\` variables — every dimension below. That is deliberate:
               the photos shrink at <=1440 and the badge has to shrink with them,
               and one variable set is the only way to be sure nothing is left
               behind at the old size. Only the shape and colour utilities stay
               here.

               The radius is 18px now, not 104px: the lozenge was exempt from the
               radius tightening as "a shape rather than a corner", and a
               horizontal icon BOX is a corner. -->
          <div class="years-badge rounded-[18px] bg-white shadow-lift max-md:hidden">
            <span class="years-badge-icon grid shrink-0 place-items-center rounded-full bg-topbar">
              <img src="/assets/images/about-icon.png" alt="" aria-hidden="true">
            </span>
            <span class="block text-left">
              <strong class="years-badge-num block font-extrabold text-sky">15</strong>
              <span class="years-badge-label text-ink">Years of Experience</span>
            </span>
          </div>
        </div>
      </div>
      <div class="reveal">
        <span class="eyebrow">About Us</span>
        <h2 class="h-section">Family Owned, Locally Operated</h2>
        <p class="mb-6 mt-4">Call Indigo is your single phone call for any address. Licensed, insured, and headquartered in Austin, Texas since 2012 — serving homes and facilities across Hays, Travis, and Williamson counties.</p>
        <!-- \`.about-listing-con\` is two side-by-side \`ul\`s, not one column. -->
        <ul class="mb-8 grid gap-x-8 gap-y-3 sm:grid-cols-2">
          <li class="relative pl-9 font-medium text-[#3c4656] before:absolute before:left-0 before:top-0.5 before:grid before:size-[23px] before:place-items-center before:rounded-full before:bg-sky before:text-xs before:font-bold before:text-white before:content-['✓']">Free inspection of your entire address for every new customer</li>
          <li class="relative pl-9 font-medium text-[#3c4656] before:absolute before:left-0 before:top-0.5 before:grid before:size-[23px] before:place-items-center before:rounded-full before:bg-sky before:text-xs before:font-bold before:text-white before:content-['✓']">Discounted rates for senior citizens, military, and members</li>
          <li class="relative pl-9 font-medium text-[#3c4656] before:absolute before:left-0 before:top-0.5 before:grid before:size-[23px] before:place-items-center before:rounded-full before:bg-sky before:text-xs before:font-bold before:text-white before:content-['✓']">Licensed and insured — one call covers every service</li>
        </ul>
        <div class="flex flex-wrap items-center gap-6">
          <a href="#services" class="pill">
            <span>Explore Services</span>
            <span class="pill-circle">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17L17 7M9 7h8v8"/></svg>
            </span>
          </a>
          <a href="/contact" class="font-bold text-ink hover:text-brand">Meet the team →</a>
        </div>
      </div>
    </div>
    </section>
  </div>

  <div class="spacer"></div>

  <!-- ======================= SERVICES ======================= -->
  <!-- \`.services-con.padding-top.padding-bottom.main-box\` — NOT wrapped in a
       \`.padding-rl\`, so it is a plain white band whose content is capped by
       \`.main-container\` (1417) alone.

       THE ICON CHIP IS \`relative\` ON PURPOSE — do not remove it. The chip is a
       bare <img> carrying \`bg-sky\` as its own background, pulled up over the
       photo with \`-mt-8\`. Tailwind preflight sets \`img{display:block}\`, so the
       chip is a block-level box and the photo's wrapper <div> - which is
       \`overflow:hidden\` - painted over the chip's top 32px. Measured in
       Chromium: only 27px of the 62px chip's cyan was visible, and the white
       glyph floated over the photo with no chip behind it. Adding \`relative\`
       makes the chip a positioned box, which paints after in-flow content, and
       the full 56px (62 - 2x3 white border) renders. Verified by measuring the
       rendered pixels, not by reasoning about the spec. -->
  <section id="services" class="band pad-140">
    <div class="shell">
      <div class="reveal mb-12 max-w-[660px]">
        <span class="eyebrow">One Call, All Services</span>
        <h2 class="h-section">Our Home &amp; Facility Services</h2>
        <p class="mt-4">One call covers plumbing, electrical, HVAC, carpentry, painting, and more — all licensed and insured.</p>
      </div>
      <div class="grid gap-7 md:grid-cols-2 lg:grid-cols-3">
        <article class="card card-hover reveal relative overflow-visible">
          <div class="h-[210px] overflow-hidden rounded-t-panel"><img src="/assets/images/services-img1.jpg" alt="Plumbing services" class="size-full object-cover transition duration-500 hover:scale-[1.07]"></div>
          <img src="/assets/images/services-icon1.png" alt="" class="relative -mt-8 ml-6 size-[62px] rounded-[10px] border-[3px] border-white bg-sky object-contain p-3.5 shadow-lift">
          <h3 class="mb-1.5 mt-4 px-6 text-[21px] font-bold text-ink">Plumbing</h3>
          <p class="px-6 text-[14.5px]">Emergency plumbing, water heaters, leak detection, sinks, faucets, toilets, gas lines, and more.</p>
          <a href="/contact" class="mb-[22px] inline-block px-6 pt-1 text-sm font-bold text-brand hover:text-sky">Learn more →</a>
        </article>
        <article class="card card-hover reveal relative overflow-visible">
          <div class="h-[210px] overflow-hidden rounded-t-panel"><img src="/assets/images/services-img2.jpg" alt="Electrical services" class="size-full object-cover transition duration-500 hover:scale-[1.07]"></div>
          <img src="/assets/images/services-icon2.png" alt="" class="relative -mt-8 ml-6 size-[62px] rounded-[10px] border-[3px] border-white bg-sky object-contain p-3.5 shadow-lift">
          <h3 class="mb-1.5 mt-4 px-6 text-[21px] font-bold text-ink">Electrical</h3>
          <p class="px-6 text-[14.5px]">Residential and commercial electrical, wiring, lighting, ceiling fans, exhaust fans, and panel work.</p>
          <a href="/contact" class="mb-[22px] inline-block px-6 pt-1 text-sm font-bold text-brand hover:text-sky">Learn more →</a>
        </article>
        <article class="card card-hover reveal relative overflow-visible">
          <div class="h-[210px] overflow-hidden rounded-t-panel"><img src="/assets/images/services-img3.jpg" alt="HVAC services" class="size-full object-cover transition duration-500 hover:scale-[1.07]"></div>
          <img src="/assets/images/services-icon3.png" alt="" class="relative -mt-8 ml-6 size-[62px] rounded-[10px] border-[3px] border-white bg-sky object-contain p-3.5 shadow-lift">
          <h3 class="mb-1.5 mt-4 px-6 text-[21px] font-bold text-ink">HVAC</h3>
          <p class="px-6 text-[14.5px]">Heating, ventilation, and air conditioning installation, repair, and maintenance for homes and properties.</p>
          <a href="/contact" class="mb-[22px] inline-block px-6 pt-1 text-sm font-bold text-brand hover:text-sky">Learn more →</a>
        </article>
        <article class="card card-hover reveal relative overflow-visible">
          <div class="h-[210px] overflow-hidden rounded-t-panel"><img src="/assets/images/services-img4.jpg" alt="Carpentry and remodeling" class="size-full object-cover transition duration-500 hover:scale-[1.07]"></div>
          <img src="/assets/images/services-icon4.png" alt="" class="relative -mt-8 ml-6 size-[62px] rounded-[10px] border-[3px] border-white bg-sky object-contain p-3.5 shadow-lift">
          <h3 class="mb-1.5 mt-4 px-6 text-[21px] font-bold text-ink">Carpentry &amp; Remodeling</h3>
          <p class="px-6 text-[14.5px]">Doors, decks, fences, drywall, siding, flooring, full remodeling, and construction projects.</p>
          <a href="/contact" class="mb-[22px] inline-block px-6 pt-1 text-sm font-bold text-brand hover:text-sky">Learn more →</a>
        </article>
        <article class="card card-hover reveal relative overflow-visible">
          <div class="h-[210px] overflow-hidden rounded-t-panel"><img src="/assets/images/services-img5.jpg" alt="Painting and make-readies" class="size-full object-cover transition duration-500 hover:scale-[1.07]"></div>
          <img src="/assets/images/services-icon5.png" alt="" class="relative -mt-8 ml-6 size-[62px] rounded-[10px] border-[3px] border-white bg-sky object-contain p-3.5 shadow-lift">
          <h3 class="mb-1.5 mt-4 px-6 text-[21px] font-bold text-ink">Painting &amp; Make-Readies</h3>
          <p class="px-6 text-[14.5px]">Interior and exterior painting, make-ready services for rentals, and property turnover coordination.</p>
          <a href="/contact" class="mb-[22px] inline-block px-6 pt-1 text-sm font-bold text-brand hover:text-sky">Learn more →</a>
        </article>
        <article class="card card-hover reveal relative overflow-visible">
          <div class="h-[210px] overflow-hidden rounded-t-panel"><img src="/assets/images/services-img6.jpg" alt="Handyman and repairs" class="size-full object-cover transition duration-500 hover:scale-[1.07]"></div>
          <img src="/assets/images/services-icon6.png" alt="" class="relative -mt-8 ml-6 size-[62px] rounded-[10px] border-[3px] border-white bg-sky object-contain p-3.5 shadow-lift">
          <h3 class="mb-1.5 mt-4 px-6 text-[21px] font-bold text-ink">Handyman &amp; Repairs</h3>
          <p class="px-6 text-[14.5px]">General repairs, handyman services, landscaping, and ongoing property maintenance.</p>
          <a href="/contact" class="mb-[22px] inline-block px-6 pt-1 text-sm font-bold text-brand hover:text-sky">Learn more →</a>
        </article>
      </div>
    </div>
  </section>

  <div class="spacer"></div>

  <!-- ======================= WHY CHOOSE US ======================= -->
  <!-- \`.why-choose-us-con.bg-grey.main-box.br-50\` — upstream declares no vertical
       padding on this band, so it takes the standard 140px rhythm. -->
  <div class="pad-rl">
    <section id="choose" class="mbox slab bg-mist pad-140">
    <div class="shell grid grid-cols-[1.05fr_.95fr] items-center gap-[70px] max-lg:grid-cols-1 max-lg:gap-11">
      <div class="reveal">
        <span class="eyebrow">Why Call Indigo</span>
        <h2 class="h-section">Why choose Call Indigo</h2>
        <p class="mt-4">Four things every new customer gets, whichever service you call us for.</p>
        <div class="mt-7 grid gap-6">
          <div class="reveal flex gap-4.5">
            <img src="/assets/images/choose-icon1.png" alt="" class="size-[54px] shrink-0 object-contain">
            <div><strong class="text-lg font-bold text-ink">Free property inspection</strong><p class="mt-1 text-sm">We look at the whole address, not only the room you called about.</p></div>
          </div>
          <div class="reveal flex gap-4.5">
            <img src="/assets/images/choose-icon2.png" alt="" class="size-[54px] shrink-0 object-contain">
            <div><strong class="text-lg font-bold text-ink">Discounted rates</strong><p class="mt-1 text-sm">Discounted rates for senior citizens, military, and members.</p></div>
          </div>
          <div class="reveal flex gap-4.5">
            <img src="/assets/images/choose-icon3.png" alt="" class="size-[54px] shrink-0 object-contain">
            <div><strong class="text-lg font-bold text-ink">One call, any service</strong><p class="mt-1 text-sm">From plumbing to remodeling — one phone call covers every service your property needs.</p></div>
          </div>
          <div class="reveal flex gap-4.5">
            <img src="/assets/images/choose-icon4.png" alt="" class="size-[54px] shrink-0 object-contain">
            <div><strong class="text-lg font-bold text-ink">Local &amp; trusted</strong><p class="mt-1 text-sm">Headquartered in Austin, TX. Family owned and locally operated since 2012.</p></div>
          </div>
        </div>
      </div>
      <div class="reveal">
        <img src="/assets/images/choose-img1.jpg" alt="Why choose Call Indigo" class="rounded-panel shadow-lift">
      </div>
    </div>
    </section>
  </div>

  <div class="spacer"></div>

  <!-- ======================= PRICE ESTIMATOR ======================= -->
  <!-- \`.price-estimation-con.padding-top.padding-bottom.br-50.main-box\` with
       \`background-image: price-estimation-bg-img.jpg\` and a \`::before\` of
       \`rgb(42 90 162 / 90%)\` — style.css:1759-1773. The band was previously a
       flat \`bg-brand\` with no photo at all. -->
  <div class="pad-rl">
    <section id="estimate" class="mbox slab slab-photo scrim-blue bg-img-estimate pad-140 relative bg-brand">
    <div class="slab-body shell">
      <!-- The reference centres this band's whole heading block and then puts one
           wide white card under it (\`.heading-title-con.text-center\` followed by
           \`.estimator-box\`), rather than the two-column split this file had. The
           Call Indigo membership copy is unchanged; only the structure moves. -->
      <div class="reveal mx-auto mb-12 max-w-[860px] text-center">
        <span class="eyebrow">Membership</span>
        <h2 class="h-section text-white">Indigo Home &amp; Facility Membership</h2>
        <a href="/contact" class="pill mt-7"><span>BECOME A MEMBER</span><span class="pill-circle"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17L17 7M9 7h8v8"/></svg></span></a>
        <p class="mx-auto mt-6 max-w-[720px] text-[#dfe7fb]">All new customers are given a free inspection of their entire address to identify all options to maximize property value over time. Our membership also involves turn-key STR and LTR services to increase rental income for property owners.</p>
      </div>
      <div class="reveal rounded-panel bg-white p-8 text-body shadow-drop md:p-[46px]">
        <div class="grid gap-10 lg:grid-cols-[1.2fr_.8fr] lg:gap-14">
          <div>
            <h3 class="mb-4 text-[20px] font-semibold text-ink">What membership includes:</h3>
            <ul class="grid gap-2.5">
              <li class="flex justify-between gap-5 rounded-[10px] border border-line bg-mist px-5 py-3 text-[14.5px] text-body"><span>Free whole-address inspection</span><b class="text-sky">Included</b></li>
              <li class="flex justify-between gap-5 rounded-[10px] border border-line bg-mist px-5 py-3 text-[14.5px] text-body"><span>All home services, local crews</span><b class="text-sky">Included</b></li>
              <li class="flex justify-between gap-5 rounded-[10px] border border-line bg-mist px-5 py-3 text-[14.5px] text-body"><span>Turn-key STR &amp; LTR services</span><b class="text-sky">Included</b></li>
              <li class="flex justify-between gap-5 rounded-[10px] border border-line bg-mist px-5 py-3 text-[14.5px] text-body"><span>Senior, military &amp; member rates</span><b class="text-sky">Discounted</b></li>
            </ul>
          </div>
          <div>
            <span class="eyebrow">Free Inspection</span>
            <h3 class="mb-2 text-[24px] font-bold text-ink">Book your free inspection</h3>
            <p class="mb-6 text-sm">Tell us where to look and the Indigo team will coordinate the next opening.</p>
            <div class="grid gap-3.5">
              <a href="tel:+15126084999" class="pill pill-block pill-navy">
                <span>Call (512) 608-4999</span>
                <span class="pill-circle">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17L17 7M9 7h8v8"/></svg>
                </span>
              </a>
              <a href="mailto:support@call-indigo.com" class="pill pill-block">
                <span>support@call-indigo.com</span>
                <span class="pill-circle">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17L17 7M9 7h8v8"/></svg>
                </span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
    </section>
  </div>

  <div class="spacer"></div>

  <!-- ======================= PROCESS ======================= -->
  <!-- \`.how-it-works-con.padding-top.padding-bottom.main-box.text-center\` — again
       NOT wrapped in \`.padding-rl\`, so a plain white band on \`.main-container\`. -->
  <section id="process" class="band pad-140">
    <div class="shell">
      <div class="reveal mb-12 max-w-[660px]">
        <span class="eyebrow">How It Works</span>
        <h2 class="h-section">Clear Path From<br>Start To Finish</h2>
      </div>
      <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div class="card card-hover reveal relative p-[30px]">
          <b class="absolute right-5 top-4 text-[34px] font-bold text-brand">01</b>
          <img src="/assets/images/work-icon1.png" alt="" class="mb-3.5 size-[54px] object-contain">
          <strong class="mb-1.5 block text-[17px] font-bold text-ink">Call Indigo</strong>
          <p class="text-[13.5px]">Start with one phone call and the address that needs service.</p>
        </div>
        <div class="card card-hover reveal relative p-[30px]">
          <b class="absolute right-5 top-4 text-[34px] font-bold text-brand">02</b>
          <img src="/assets/images/work-icon2.png" alt="" class="mb-3.5 size-[54px] object-contain">
          <strong class="mb-1.5 block text-[17px] font-bold text-ink">Define the scope</strong>
          <p class="text-[13.5px]">Simple work may be estimated by phone. Larger jobs get a walk-through or detailed proposal.</p>
        </div>
        <div class="card card-hover reveal relative p-[30px]">
          <b class="absolute right-5 top-4 text-[34px] font-bold text-brand">03</b>
          <img src="/assets/images/work-icon3.png" alt="" class="mb-3.5 size-[54px] object-contain">
          <strong class="mb-1.5 block text-[17px] font-bold text-ink">Schedule the work</strong>
          <p class="text-[13.5px]">Approved estimates are coordinated by the Indigo team and scheduled around your property needs.</p>
        </div>
        <div class="card card-hover reveal relative p-[30px]">
          <b class="absolute right-5 top-4 text-[34px] font-bold text-brand">04</b>
          <img src="/assets/images/work-icon4.png" alt="" class="mb-3.5 size-[54px] object-contain">
          <strong class="mb-1.5 block text-[17px] font-bold text-ink">Maintain the address</strong>
          <p class="text-[13.5px]">Use Indigo as your ongoing service partner for recurring home and property needs.</p>
        </div>
      </div>
    </div>
  </section>

  <div class="spacer"></div>

  <!-- ======================= TESTIMONIALS ======================= -->
  <!-- \`.client-reviews-con\` declares no padding upstream, so it takes the 140px
       band rhythm. Kept on white, matching the reference. -->
  <section id="reviews" class="band pad-140">
    <div class="shell">
      <div class="reveal mb-12 max-w-[660px]">
        <span class="eyebrow">Testimonials</span>
        <h2 class="h-section">Trusted Reviews from Homeowners &amp; Businesses</h2>
      </div>
      <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <article class="card card-hover reveal p-[30px]">
          <img src="/assets/images/quote-icon.png" alt="" class="mb-3.5 w-[38px]">
          <img src="/assets/images/stars.png" alt="5 stars" class="mb-3 h-4 w-auto">
          <p class="mb-5 font-medium text-[#3c4656]">“Fast, reliable, and courteous service. Highly recommend!”</p>
          <footer class="flex items-center gap-3">
            <img src="/assets/images/testimonial-icon1.jpg" alt="Amanda R." class="size-[46px] rounded-full object-cover">
            <div><strong class="block text-[15px] font-bold text-ink">Amanda R.</strong><span class="text-[13px]">Homeowner</span></div>
          </footer>
        </article>
        <article class="card card-hover reveal p-[30px]">
          <img src="/assets/images/quote-icon.png" alt="" class="mb-3.5 w-[38px]">
          <img src="/assets/images/stars.png" alt="5 stars" class="mb-3 h-4 w-auto">
          <p class="mb-5 font-medium text-[#3c4656]">“Professional team, arrived on time, and fixed the issue quickly.”</p>
          <footer class="flex items-center gap-3">
            <img src="/assets/images/testimonial-icon2.jpg" alt="Michael S." class="size-[46px] rounded-full object-cover">
            <div><strong class="block text-[15px] font-bold text-ink">Michael S.</strong><span class="text-[13px]">Business Owner</span></div>
          </footer>
        </article>
        <article class="card card-hover reveal p-[30px]">
          <img src="/assets/images/quote-icon.png" alt="" class="mb-3.5 w-[38px]">
          <img src="/assets/images/stars.png" alt="5 stars" class="mb-3 h-4 w-auto">
          <p class="mb-5 font-medium text-[#3c4656]">“Clear pricing, tidy work, and the leak hasn't come back since.”</p>
          <footer class="flex items-center gap-3">
            <img src="/assets/images/testimonial-icon3.jpg" alt="Derrick M." class="size-[46px] rounded-full object-cover">
            <div><strong class="block text-[15px] font-bold text-ink">Derrick M.</strong><span class="text-[13px]">Property Manager</span></div>
          </footer>
        </article>
      </div>
    </div>
  </section>

  <div class="spacer"></div>

  <!-- Moved 2026-09-25 (client feedback): "Accredited & Reviewed" now sits
       directly under the testimonials. As a trust signal it belongs beside the
       reviews, not underneath the FAQ. -->
  <!-- ======================= CREDENTIALS ======================= -->
  <!-- \`.trusted-companies-con\` — no \`.padding-top/.padding-bottom\` and no
       \`.padding-rl\` upstream, so it stays a plain white band. The reference shows
       no rule above the logo row, so the \`border-t\` this file carried is gone.

       The six \`tc-logo1..6.png\` that used to sit here were stock "Logoipsum"
       placeholders under the heading "Trusted By Leading Brands" — invented
       brands making a claim that was not true. Replaced 2026-09-21 with the
       client's own credential badges, and the heading now describes what is
       actually shown. The section id stays \`brands\` because it is the anchor
       name the prototype used. -->
  <section id="brands" class="band py-14">
    <div class="shell">
      <h2 class="reveal mb-8 text-center text-lg font-bold uppercase tracking-[.08em] text-[#8b97a8]">Accredited &amp; Reviewed</h2>
      <div class="reveal flex flex-wrap items-center justify-center gap-11">
        <img src="/assets/images/credential-bbb-accredited.png" alt="BBB Accredited Business" class="h-10 w-auto object-contain opacity-55 transition hover:opacity-100">
        <img src="/assets/images/credential-angies-list.png" alt="Angie's List Super Service Award 2018" class="h-10 w-auto object-contain opacity-55 transition hover:opacity-100">
        <img src="/assets/images/credential-homeadvisor-elite.png" alt="HomeAdvisor Elite Service" class="h-10 w-auto object-contain opacity-55 transition hover:opacity-100">
        <img src="/assets/images/credential-homeadvisor-top-rated.png" alt="HomeAdvisor Top Rated" class="h-10 w-auto object-contain opacity-55 transition hover:opacity-100">
        <img src="/assets/images/credential-google-reviews.png" alt="Google Reviews" class="h-10 w-auto object-contain opacity-55 transition hover:opacity-100">
        <img src="/assets/images/credential-facebook-reviews.png" alt="Facebook Reviews" class="h-10 w-auto object-contain opacity-55 transition hover:opacity-100">
      </div>
    </div>
  </section>

  <div class="spacer"></div>

  <!-- ======================= FAQ ======================= -->
  <!-- \`.faq-con.main-box.bg-grey.br-50.padding-top.padding-bottom\` (style.css:1255)
       — a mist slab at 140px. -->
  <div class="pad-rl">
    <section id="faq" class="mbox slab bg-mist pad-140">
    <div class="shell max-w-[840px]">
      <div class="reveal mb-12">
        <span class="eyebrow">FAQ</span>
        <h2 class="h-section">Answers to Your Frequently Asked Questions</h2>
      </div>
      <div class="reveal grid gap-3.5">
        <details open class="rounded-[10px] border border-line bg-white px-6 py-1.5 transition-colors open:border-sky">
          <summary class="flex cursor-pointer items-center justify-between gap-4 py-4 text-[16.5px] font-bold text-ink [&::-webkit-details-marker]:hidden">
            What services does Call Indigo provide?<span class="chev"></span>
          </summary>
          <p class="max-w-[660px] pb-4">One call covers plumbing, electrical, HVAC, carpentry and remodeling, painting and make-readies, plus general handyman and repair work — for both homes and commercial facilities.</p>
        </details>
        <details class="rounded-[10px] border border-line bg-white px-6 py-1.5 transition-colors open:border-sky">
          <summary class="flex cursor-pointer items-center justify-between gap-4 py-4 text-[16.5px] font-bold text-ink [&::-webkit-details-marker]:hidden">
            What areas do you serve?<span class="chev"></span>
          </summary>
          <p class="max-w-[660px] pb-4">We serve Hays, Travis, and Williamson counties — including Austin, Buda, Kyle, and San Marcos. Commercial facility services are available nationwide.</p>
        </details>
        <details class="rounded-[10px] border border-line bg-white px-6 py-1.5 transition-colors open:border-sky">
          <summary class="flex cursor-pointer items-center justify-between gap-4 py-4 text-[16.5px] font-bold text-ink [&::-webkit-details-marker]:hidden">
            Is the inspection really free?<span class="chev"></span>
          </summary>
          <p class="max-w-[660px] pb-4">Yes. Every new customer receives a free inspection of their entire address to identify all options to maximize property value over time.</p>
        </details>
        <details class="rounded-[10px] border border-line bg-white px-6 py-1.5 transition-colors open:border-sky">
          <summary class="flex cursor-pointer items-center justify-between gap-4 py-4 text-[16.5px] font-bold text-ink [&::-webkit-details-marker]:hidden">
            Do you offer any discounts?<span class="chev"></span>
          </summary>
          <p class="max-w-[660px] pb-4">We offer discounted rates for all of our services to senior citizens, military, and members.</p>
        </details>
        <details class="rounded-[10px] border border-line bg-white px-6 py-1.5 transition-colors open:border-sky">
          <summary class="flex cursor-pointer items-center justify-between gap-4 py-4 text-[16.5px] font-bold text-ink [&::-webkit-details-marker]:hidden">
            Are you licensed and insured?<span class="chev"></span>
          </summary>
          <p class="max-w-[660px] pb-4">Yes — Call Indigo is licensed and insured. We are family owned and locally operated, headquartered in Austin, TX since 2012.</p>
        </details>
      </div>
    </div>
  </section>
  </div>

  <div class="spacer"></div>

  <!-- ======================= EMERGENCY CTA ======================= -->
  <!-- \`.cta-con.main-box.br-50.padding-rl-30\` (style.css:1008) — 30px vertical,
       \`background-image: cta-bg-img.jpg\` and a \`::before\` of
       \`rgb(42 90 162 / 90%)\`.
       The template's \`.cta-inner-con\` is a two-column flex with the PHOTO ON THE
       LEFT — a \`br-40\` card with a circular badge overlapping its right edge,
       then the heading block on the right, ending in a cyan phone pill plus a
       two-line arrival note beside it.

       A 110px navy disc carrying the client's phone glyph used to hang off
       the photo's right edge here. Deleted 2026-09-25 on client feedback: it
       read as a stray phone logo floating between the photograph and the text
       block rather than as part of either. logo-vector.png - the template's
       demo mark it had replaced, which drew a cyan glyph that read as a "P"
       over the photo - does NOT come back. This file previously ran a centred
       text column with the image on the right over a flat bg-ink. -->
  <div class="pad-rl">
    <section id="contact" class="mbox slab slab-photo scrim-blue bg-img-cta pad-30 relative bg-brand">
    <div class="slab-body">
      <div class="grid items-center gap-10 lg:grid-cols-[.92fr_1.08fr] lg:gap-[100px]">
        <div class="relative">
          <img src="/assets/images/cta-img.jpg" alt="Call Indigo technician on an emergency call" class="w-full rounded-[18px] object-cover">
          <!-- CLIENT 2026-09-25: the 110px navy disc that hung here is
               deleted. It read as a stray phone logo floating between the
               photograph and the text block rather than as part of either.
               logo-vector.png - the template's demo mark it had replaced -
               does NOT come back. -->
        </div>
        <div>
          <span class="eyebrow">Get in Touch</span>
          <h2 class="h-section text-white">Need Help Right Now?<br>Call Our Emergency Line.</h2>
          <div class="mt-7 flex flex-wrap items-center gap-6">
            <a href="tel:+15126084999" class="pill pill-lg">
              <span>(512) 608-4999</span>
              <span class="pill-circle"><img src="/assets/images/call-icon.png" alt=""></span>
            </a>
            <span class="max-w-[235px] text-[14px] leading-[20px] text-white">Typical arrival in 30–60 minutes, depending on demand and location.</span>
          </div>
        </div>
      </div>
    </div>
    </section>
  </div>

  <div class="spacer"></div>

  <!-- ======================= FOOTER ======================= -->
  <!-- Restructured 2026-09-18 to follow v1's own footer shape
       (\`call-indigo-com/index.html:353-395\` + \`call-indigo-com/css/styles.css\`):

         .footer        bg = the dark accent, \`border-top: 1px solid rgba(255,255,255,.05)\`
         .footer-grid   1 column, then \`2fr 1fr 1fr 1.5fr\` from the lg query
         .footer-brand  logo + one short paragraph, \`max-width: 320px\`
         .footer-links  "Services" then "Company" — two separate <ul>s
         .footer-contact address + service area + the phone as the accent link
         .footer-bottom \`border-top\` INSIDE \`.container\`, flex row space-between

       v2 keeps the slab it already had (v1's \`.footer-con.main-box.bg-accent\` ->
       \`.mbox.slab.bg-ink-2\`, style.css:1474/828) and keeps the two things v1 has no
       room for: the licence line and the trust badges.

       Three real changes, not cosmetics:
         · The old "Navigation" column is gone. It listed Services / About Us / How
           It Works / FAQ / Membership and — unlike the header nav — never linked
           Residential or Commercial at all. It is split into the two columns v1
           actually ships, and the full site map now appears in "Company".
         · "Contact Info" and "Service Area" were two columns for one job. Merged
           into "Contact", which is how v1 groups the same facts.
         · The bottom bar's divider moved INSIDE \`.shell\`. It used to span the whole
           slab, so the rule ran 100px past the text it was separating; v1 puts
           \`.footer-bottom\` inside \`.container\` for exactly this reason. -->
  <div class="pad-rl">
    <footer class="mbox slab bg-ink-2 text-[14.5px] text-[#aebdd2]">
    <div class="shell grid gap-8 pb-[46px] pt-[52px] md:grid-cols-2 md:gap-10 md:pb-[74px] md:pt-[80px] lg:grid-cols-[2fr_1fr_1fr_1.5fr] lg:gap-[54px]">
      <div>
        <div class="mb-4 flex items-center gap-2.5">
          <div class="shrink-0 rounded-full bg-white p-2"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-[#1e1b4b]" aria-hidden="true"><path d="M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384"></path></svg></div>
          <span class="font-sans text-[23px] font-bold leading-none tracking-[-0.06em] text-white">Call Indigo</span>
        </div>
        <p>Licensed and insured home and facility services. One call covers plumbing, electrical, HVAC, carpentry, painting, and more — done right the first time.</p>
        <p class="mt-3 text-[13px] text-white/60">Indigo Home &amp; Facility Services<br>License: RMP: 45574</p>
        <div class="mt-4 flex gap-3">
          <img src="/assets/images/trust-icon1.png" alt="" class="size-11 object-contain">
          <img src="/assets/images/trust-icon2.png" alt="" class="size-11 object-contain">
        </div>
      </div>
      <div>
        <h2 class="mb-4 text-lg font-bold text-white">Services</h2>
        <a href="#services" class="block py-1 hover:text-sky">Plumbing</a>
        <a href="#services" class="block py-1 hover:text-sky">Electrical</a>
        <a href="#services" class="block py-1 hover:text-sky">HVAC</a>
        <a href="#services" class="block py-1 hover:text-sky">Carpentry &amp; Remodeling</a>
        <a href="#services" class="block py-1 hover:text-sky">Painting &amp; Make-Readies</a>
        <a href="#services" class="block py-1 hover:text-sky">Handyman &amp; Repairs</a>
      </div>
      <div>
        <h2 class="mb-4 text-lg font-bold text-white">Company</h2>
        <a href="#top" class="block py-1 hover:text-sky">Home</a>
        <a href="#about" class="block py-1 hover:text-sky">About Us</a>
        <a href="/residential" class="block py-1 hover:text-sky">Residential</a>
        <a href="/commercial" class="block py-1 hover:text-sky">Commercial</a>
        <a href="#process" class="block py-1 hover:text-sky">How It Works</a>
        <a href="#faq" class="block py-1 hover:text-sky">FAQ</a>
        <a href="#estimate" class="block py-1 hover:text-sky">Membership</a>
      </div>
      <div>
        <h2 class="mb-4 text-lg font-bold text-white">Contact</h2>
        <a href="tel:+15126084999" class="block py-1 font-bold text-sky-soft hover:text-sky">(512) 608-4999</a>
        <a href="mailto:support@call-indigo.com" class="block py-1 hover:text-sky">support@call-indigo.com</a>
        <a href="/contact" class="block py-1 hover:text-sky">Send an inquiry →</a>
        <span class="block py-1">1005 Meredith Drive<br>Austin, TX 78748</span>
        <span class="block py-1">Serving Hays, Travis &amp; Williamson counties</span>
      </div>
    </div>
    <div class="shell">
      <div class="flex flex-col items-center gap-3 border-t border-white/10 py-5 text-center text-[13px] lg:flex-row lg:justify-between lg:text-left">
        <p>© <span id="year"></span> Call Indigo, LLC. All rights reserved.</p>
        <div class="flex flex-col items-center gap-2.5 md:flex-row md:flex-wrap md:justify-center md:gap-x-5 md:gap-y-2">
          <button type="button" class="legal-link" data-legal="terms">Terms of Service</button>
          <button type="button" class="legal-link" data-legal="privacy">Privacy Policy</button>
          <a href="/admin" class="transition-colors hover:text-sky">Admin</a>
        </div>
      </div>
    </div>
    </footer>
  </div>

  <!-- ======================= LEGAL MODALS ======================= -->
  <!-- Full-page dialogs, opened by the two \`.legal-link\` buttons in the footer
       bar above. Deliberately BUTTONS and not \`<a href="#terms">\`: a control that
       opens a dialog is a button, and an anchor here would also have to be
       rewritten to \`index.html#terms\` by gen_pages.py — which would send a
       residential.html reader to the home page instead of opening the dialog on
       the page they are already on. \`js/main.js\` still honours a \`#terms\` /
       \`#privacy\` hash on load, so the deep links remain shareable.
       Everything outside \`.legal-body\` closes: the scrim, the ✕ in the pinned
       bar, the button at the foot of the document, and Escape. -->
  <div id="legal-terms" class="legal" data-legal-modal role="dialog" aria-modal="true"
    aria-labelledby="legal-terms-title" aria-hidden="true">
    <div class="legal-scrim" data-legal-close></div>
    <div class="legal-sheet">
      <header class="legal-bar">
        <div class="min-w-0">
          <p class="legal-kicker">Call Indigo LLC · Austin, TX</p>
          <h2 id="legal-terms-title" class="legal-title">Terms of Service</h2>
        </div>
        <button type="button" class="legal-x" data-legal-x data-legal-close aria-label="Close Terms of Service">✕</button>
      </header>
      <div class="legal-body">
        <p class="legal-meta">Effective September 18, 2026 · Last updated September 18, 2026</p>

        <h3>1. Agreement to These Terms</h3>
        <p>These Terms of Service govern your access to this website and your use of the home and facility
          services offered by Call Indigo LLC ("Call Indigo," "we," "us," or "our"). By requesting an
          estimate, scheduling work, or using this site, you agree to these terms. If you do not agree,
          please do not use the site or our services.</p>

        <h3>2. Services We Provide</h3>
        <p>Call Indigo provides residential and commercial property services, including plumbing,
          electrical, HVAC, carpentry, remodeling, painting, make-readies, flooring, landscaping, handyman
          work, and general repairs. Services are performed in Hays, Travis, and Williamson counties, and
          through our facility partners on a national basis.</p>
        <p>Availability, crew assignment, and scheduling depend on the scope of work, material lead times,
          permit requirements, and weather. Nothing on this site is an offer to perform work at a fixed
          price.</p>

        <h3>3. Estimates, Pricing, and Payment</h3>
        <ul>
          <li>Estimates are based on the conditions visible at the time of inspection. Concealed damage,
            code corrections, or changed scope may require a written revision before work continues.</li>
          <li>Unless stated otherwise in writing, estimates are valid for 30 days.</li>
          <li>Payment terms are stated on your invoice. Deposits may be required for materials and
            scheduling.</li>
          <li>Invoices are due on receipt unless other terms are agreed in writing. Past-due balances may
            be subject to a late charge where permitted by law.</li>
        </ul>

        <h3>4. Scheduling, Access, and Cancellations</h3>
        <p>You agree to provide safe and reasonable access to the work area, including utilities, parking,
          and any keys, gate codes, or animal containment needed. Please give us at least 24 hours' notice
          to reschedule a confirmed appointment. Missed appointments or inaccessible work areas may result
          in a trip charge.</p>

        <h3>5. Membership Plans</h3>
        <p>Membership plans, including Indigo Home Membership and our facility membership, are billed on the
          cycle stated at enrollment. Members receive the benefits described at sign-up, which may include a
          free initial inspection and discounted rates on services. Benefits are personal to the enrolled
          property, do not guarantee same-day service, and may be updated with reasonable notice. You may
          cancel a membership at the end of the current billing period.</p>

        <h3>6. Workmanship, Warranty, and Callbacks</h3>
        <p>We stand behind our work. If a repair we performed fails because of our workmanship within the
          warranty period stated on your invoice, contact us and we will assess and correct it. This
          warranty does not cover damage caused by third parties, misuse, neglect, normal wear, acts of
          nature, or work you or another contractor modified. Manufacturer warranties on equipment and
          materials pass through to you.</p>

        <h3>7. Your Responsibilities</h3>
        <ul>
          <li>Disclose known hazards, prior work, leaks, asbestos, mold, or other conditions that may
            affect the job.</li>
          <li>Remove valuables and fragile items from the work area before the crew arrives.</li>
          <li>Ensure anyone who needs to authorize changes to the scope is reachable.</li>
          <li>Do not direct our crews to perform work outside the agreed scope.</li>
        </ul>

        <h3>8. Independent Contractors</h3>
        <p>Some work is performed by licensed, insured trade partners and independent contractors. They are
          not our employees, and we remain your point of contact for scheduling, quality, and warranty
          service.</p>

        <h3>9. Limitation of Liability</h3>
        <p>To the fullest extent permitted by law, Call Indigo is not liable for indirect, incidental,
          special, or consequential damages, including lost rent, lost business, or lost profits. Our total
          liability for any claim arising out of the services is limited to the amount you paid us for the
          specific service that gave rise to the claim. Nothing here limits liability that cannot be
          limited by law, and nothing here waives any right you have under applicable Texas law.</p>

        <h3>10. Dispute Resolution and Governing Law</h3>
        <p>These terms are governed by the laws of the State of Texas, without regard to conflict-of-law
          rules. Before filing a claim, please contact us so we can try to resolve the issue directly. Any
          dispute that cannot be resolved informally will be brought in the state or federal courts located
          in Travis County, Texas, and both parties consent to venue there.</p>

        <h3>11. Changes to These Terms</h3>
        <p>We may update these terms from time to time. The revision date at the top of this page will
          change when we do, and the updated terms apply to services requested after that date. Continued
          use of the site or our services means you accept the current version.</p>

        <h3>12. Contact Us</h3>
        <p>Call Indigo LLC, 1005 Meredith Drive, Austin, TX 78748.<br>
          Phone: <a href="tel:+15126084999">(512) 608-4999</a><br>
          Email: <a href="mailto:support@call-indigo.com">support@call-indigo.com</a></p>

        <div class="legal-foot">
          <button type="button" class="legal-close" data-legal-close>Close</button>
          <p class="text-body">You can also close this window with the ✕ above or the Escape key.</p>
        </div>
      </div>
    </div>
  </div>

  <div id="legal-privacy" class="legal" data-legal-modal role="dialog" aria-modal="true"
    aria-labelledby="legal-privacy-title" aria-hidden="true">
    <div class="legal-scrim" data-legal-close></div>
    <div class="legal-sheet">
      <header class="legal-bar">
        <div class="min-w-0">
          <p class="legal-kicker">Call Indigo LLC · Austin, TX</p>
          <h2 id="legal-privacy-title" class="legal-title">Privacy Policy</h2>
        </div>
        <button type="button" class="legal-x" data-legal-x data-legal-close aria-label="Close Privacy Policy">✕</button>
      </header>
      <div class="legal-body">
        <p class="legal-meta">Effective September 18, 2026 · Last updated September 18, 2026</p>

        <h3>1. Overview</h3>
        <p>Call Indigo LLC respects your privacy. This policy explains what we collect when you call us,
          submit a form, or browse this site; how we use it; and the choices you have. It applies to
          call-indigo.com and to the services we provide across Hays, Travis, and Williamson counties.</p>

        <h3>2. Information We Collect</h3>
        <ul>
          <li><strong>You give us:</strong> your name, phone number, and email address, whether the
            property is residential or commercial, the service you need, how soon you need it, and your
            description of the work.</li>
          <li><strong>We create:</strong> inspection notes, photos of the work area, estimates, invoices,
            and service history for your property.</li>
          <li><strong>Our hosting provider logs:</strong> the IP address, browser type, and pages
            requested in standard server logs, which are kept for security and to keep the site running.
            This site runs no analytics, advertising, or third-party tracking scripts.</li>
        </ul>

        <h3>3. How We Use Information</h3>
        <ul>
          <li>Respond to your request, schedule visits, and perform the work.</li>
          <li>Prepare estimates, invoices, and warranty records.</li>
          <li>Confirm, remind, and follow up on appointments.</li>
          <li>Improve our services and how we route crews.</li>
          <li>Meet licensing, insurance, tax, and legal obligations.</li>
        </ul>

        <h3>4. How We Share Information</h3>
        <p>We do not sell your personal information. We share it only as needed to run the business: with
          the crews and trade partners assigned to your job, with the software providers who host our
          website, email, and record-keeping tools, and with insurers, auditors, or authorities when the
          law requires it. Vendors are expected to protect your information and to use it only for the
          service they provide to us.</p>

        <h3>5. Cookies and Analytics</h3>
        <p>This public site sets no cookies and runs no analytics, advertising, or third-party tracking
          scripts. Our private admin dashboard sets a single cookie recording whether its sidebar is open;
          it carries no personal information and is not used to track you. You can block or delete cookies
          in your browser settings at any time.</p>

        <h3>6. Calls, Texts, and Email</h3>
        <p>We use the contact details you give us to answer your request and to arrange the work — that is
          what the form promises, and it is all we do with them. We do not add you to a marketing list,
          and we do not send marketing texts or emails on the basis of that form. If we ever want to send
          you a marketing message, we will ask for your consent separately first. You can ask us to stop
          contacting you at any time using the details below.</p>

        <h3>7. Data Retention</h3>
        <p>We keep job records, estimates, invoices, and warranty documentation for as long as needed to
          serve you and to satisfy our legal, tax, insurance, and licensing obligations, then delete or
          anonymize them.</p>

        <h3>8. Security</h3>
        <p>We use reasonable administrative, technical, and physical safeguards to protect your
          information. No method of transmission or storage is completely secure, so we cannot promise
          absolute security.</p>

        <h3>9. Your Choices and Rights</h3>
        <p>You may ask us to confirm what personal information we hold about you, to correct it, or to
          delete it, and you may ask us to stop sending marketing messages. Contact us using the details
          below and we will respond within the time required by applicable law. We will not discriminate
          against you for exercising these choices.</p>

        <h3>10. Children's Privacy</h3>
        <p>Our site and services are meant for adults. We do not knowingly collect personal information
          from children under 13. If you believe a child has provided information to us, contact us and we
          will delete it.</p>

        <h3>11. Changes to This Policy</h3>
        <p>We may update this policy from time to time. The revision date at the top of this page will
          change when we do. Material changes will be described on this page.</p>

        <h3>12. Contact Us</h3>
        <p>Call Indigo LLC, 1005 Meredith Drive, Austin, TX 78748.<br>
          Phone: <a href="tel:+15126084999">(512) 608-4999</a><br>
          Email: <a href="mailto:support@call-indigo.com">support@call-indigo.com</a></p>

        <div class="legal-foot">
          <button type="button" class="legal-close" data-legal-close>Close</button>
          <p class="text-body">You can also close this window with the ✕ above or the Escape key.</p>
        </div>
      </div>
    </div>
  </div>

  `

export default function HomePage() {
  useSiteChrome()

  useEffect(() => {
    // Scroll to hash anchor on mount
    if (window.location.hash) {
      const el = document.querySelector(window.location.hash)
      el?.scrollIntoView({ behavior: "smooth" })
    }
  }, [])

  return (
    <div
      className="min-h-screen bg-white"
      dangerouslySetInnerHTML={{ __html: BODY_HTML }}
    />
  )
}
