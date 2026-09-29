/**
 * ResidentialPage — rendered from valvoro-prototype/residential.html (PRD §5.1).
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
       the street address, and "License: RMP45574 EC23851"). Two deliberate
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
        <a href="/" class="text-[12.5px] font-semibold text-ink hover:text-brand xl:text-[15px]">Home</a>
        <a href="/residential" class="inline-flex h-[42px] items-center rounded-[8px] bg-residential px-[15px] text-[12.5px] font-semibold leading-none text-white xl:text-[15px]" aria-current="page">Residential</a>
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
<a href="/" class="border-b border-white/10 py-3 text-[22px] font-semibold hover:pl-2 hover:text-sky">Home</a>
    <a href="/residential" class="border-b border-white/10 py-3 text-[22px] font-semibold hover:pl-2 hover:text-sky text-sky" aria-current="page">Residential</a>
    <a href="/commercial" class="border-b border-white/10 py-3 text-[22px] font-semibold hover:pl-2 hover:text-sky">Commercial</a>
    <a href="/contact" class="border-b border-white/10 py-3 text-[22px] font-semibold hover:pl-2 hover:text-sky">Contact</a>
    <a href="tel:+15126084999" class="mt-6 inline-flex items-center gap-3 font-bold text-sky">
      <img src="/assets/images/call-icon.png" alt="" class="size-5 object-contain"> (512) 608-4999
    </a>
  </nav>
  <div id="menu-backdrop" class="pointer-events-none fixed inset-0 z-40 bg-[rgba(9,14,33,.6)] opacity-0 transition-opacity duration-300 [&.show]:pointer-events-auto [&.show]:opacity-100"></div>

  <!-- ======================= HERO CARD
  <!-- ======================= HERO ======================= -->
  <!-- v1 /residential hero, copy verbatim (bundle \`residentialHero\`). The white
       badge reproduces the one overlapping v1's hero photo.

       The four \`proof[]\` chips (Headquartered / Established / Family owned /
       Local service area) that used to sit above the h1 are gone — client
       direction, 2026-09-21 — replaced by a single \`.hero-eyebrow\` kicker so both
       service heroes open the same way. Nothing factual is lost: the footer and
       the home page's About band both already state the Austin headquarters, the
       2012 founding, and the four-city service area. -->
  <div class="pad-rl">
    <section class="mbox slab slab-photo scrim-hero relative bg-residential pad-140">
      <img src="/assets/images/banner-bg-img.jpg" alt="" aria-hidden="true"
        class="pointer-events-none absolute inset-0 z-0 size-full object-cover">
      <div class="slab-body shell">
        <div class="grid items-center gap-12 lg:grid-cols-[1.02fr_.98fr] lg:gap-[70px]">
          <div class="text-white">
            <span class="hero-eyebrow">RESIDENTIAL &amp; HOME SERVICES</span>
            <h1 class="text-[clamp(38px,4.6vw,64px)] font-extrabold leading-[1.04] tracking-[-.02em]">Love Your Home Forever.</h1>
            <p class="mt-6 max-w-[580px] text-[17px] leading-[28px] text-white/85">Hire our locally licensed and insured home services crews. And join our membership to achieve peace of mind with all things related to your home.</p>
            <div class="mt-8 flex flex-wrap items-center gap-4">
              <a href="/contact" class="pill pill-lg">
                <span>Book an Appointment</span>
                <span class="pill-circle"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17L17 7M9 7h8v8"/></svg></span>
              </a>
              <a href="/commercial" class="pill pill-lg pill-navy">
                <span>Commercial</span>
                <span class="pill-circle"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17L17 7M9 7h8v8"/></svg></span>
              </a>
            </div>
            <a href="tel:+15126084999" class="mt-7 inline-block text-[clamp(18px,1.4vw,22px)] font-bold tracking-[0.16em] text-white/80">CALL FOR A CONSULTATION<br>(512) 608-4999</a>
          </div>
          <div class="relative">
            <img src="/assets/images/repair-img1.jpg" alt="Call Indigo home services crew on a residential job"
              class="h-[320px] w-full rounded-[18px] border-[3px] border-white/25 object-cover md:h-[400px] lg:h-[470px]">
            <div class="absolute bottom-5 left-5 max-w-[300px] rounded-[14px] bg-white p-5 shadow-drop">
              <p class="text-[11px] font-bold uppercase tracking-[0.14em] text-body">Serving Hays, Travis, and Williamson counties</p>
              <a href="tel:+15126084999" class="mt-1.5 block text-[22px] font-extrabold tracking-[-.02em] text-ink">(512) 608-4999</a>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>

  <div class="spacer"></div>

  <!-- ======================= VALUE PROP ======================= -->
  <section class="band pad-140">
    <div class="shell">
      <div class="reveal mx-auto mb-12 max-w-[780px] text-center">
        <!-- CLIENT round 4, F10 — the h2 here ("Love your residence forever with
             our Indigo Home Membership.") was deleted as redundant, and the
             eyebrow was PROMOTED to the heading role rather than left stranded:
             deleting the h2 alone would have opened the band on a bare eyebrow
             with no title. The eyebrow's own words are already a correct title
             for this band, so no new copy was invented.
             The paragraph below is unchanged. -->
        <h2 class="h-section">Residential Services</h2>
        <p class="mt-4">One team for the whole property — from the membership that plans ahead to the one-off repair.</p>
      </div>
      <div class="grid gap-7 lg:grid-cols-2">
        <article class="reveal rounded-panel bg-topbar p-8 text-white md:p-10">
          <span class="eyebrow">Membership</span>
          <h3 class="text-[26px] font-bold leading-tight">Indigo Home Membership</h3>
          <a href="/contact" class="pill mt-7">
            <span>Become a Member</span>
            <span class="pill-circle"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17L17 7M9 7h8v8"/></svg></span>
          </a>
          <p class="mt-6 text-[15px] leading-[26px] text-white/75">All new customers are given a free inspection of their entire address to identify all options to maximize property value over time. Our homes membership also involves our turn-key STR and LTR services to increase rental income for property owners. Please inquire to learn more.</p>
        </article>
        <article class="reveal rounded-panel bg-mist p-8 md:p-10">
          <span class="eyebrow">Licensed &amp; Insured</span>
          <h3 class="text-[26px] font-bold leading-tight text-ink">Indigo Home Services</h3>
          <p class="mt-4 text-[15px] leading-[26px]">Locally licensed and insured home services including plumbing, electrical, HVAC, carpentry, make-readies, painting, flooring, landscaping, remodeling, construction, handyman services, repairs, and more. We offer discounted rates for all of our services to senior citizens, military, and members.</p>
          <a href="/commercial" class="mt-7 inline-block text-sm font-bold text-brand">Explore commercial services &rarr;</a>
        </article>
      </div>
    </div>
  </section>

  <div class="spacer"></div>

  <!-- ======================= SERVICES GRID ======================= -->
  <!-- Identical markup to index.html#services — v1 ships the same
       \`residentialServicesGrid\` object on both routes. -->
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

  <!-- ======================= BENEFITS ======================= -->
  <div class="pad-rl">
    <section class="mbox slab bg-mist pad-140">
    <div class="shell grid grid-cols-[1.05fr_.95fr] items-center gap-[70px] max-lg:grid-cols-1 max-lg:gap-11">
      <div class="reveal">
        <span class="eyebrow">Why Call Indigo</span>
        <h2 class="h-section">All new customers receive a free inspection</h2>
        <p class="mt-4">Four reasons to make us your first call for the property.</p>
        <div class="mt-7 grid gap-6">
          <div class="reveal flex gap-4.5">
            <img src="/assets/images/choose-icon1.png" alt="" class="size-[54px] shrink-0 object-contain">
            <div><strong class="text-lg font-bold text-ink">Free property inspection</strong><p class="mt-1 text-sm">We look at the whole address, not only the room you called about.</p></div>
          </div>
          <div class="reveal flex gap-4.5">
            <img src="/assets/images/choose-icon2.png" alt="" class="size-[54px] shrink-0 object-contain">
            <div><strong class="text-lg font-bold text-ink">Discounted rates</strong><p class="mt-1 text-sm">Reduced rates for senior citizens, military, and members.</p></div>
          </div>
          <div class="reveal flex gap-4.5">
            <img src="/assets/images/choose-icon3.png" alt="" class="size-[54px] shrink-0 object-contain">
            <div><strong class="text-lg font-bold text-ink">One call, any service</strong><p class="mt-1 text-sm">From plumbing to remodeling — one phone call covers every service your home or property needs.</p></div>
          </div>
          <div class="reveal flex gap-4.5">
            <img src="/assets/images/choose-icon4.png" alt="" class="size-[54px] shrink-0 object-contain">
            <div><strong class="text-lg font-bold text-ink">Local &amp; trusted</strong><p class="mt-1 text-sm">Licensed and insured for every service we offer.</p></div>
          </div>
        </div>
        <a href="/contact" class="pill mt-8">
          <span>Schedule Inspection</span>
          <span class="pill-circle"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17L17 7M9 7h8v8"/></svg></span>
        </a>
      </div>
      <div class="reveal">
        <img src="/assets/images/choose-img1.jpg" alt="Call Indigo technician inspecting a property" class="rounded-panel shadow-lift">
      </div>
    </div>
    </section>
  </div>

  <div class="spacer"></div>

  <!-- ======================= FINAL CTA ======================= -->
  <div class="pad-rl">
    <section class="mbox slab slab-photo scrim-blue bg-img-cta pad-30 relative bg-residential">
    <div class="slab-body shell">
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
          <span class="eyebrow">Contact</span>
          <h2 class="h-section text-white">Call Indigo For Your Residential Property.</h2>
          <p class="mt-4 max-w-[520px] text-[#dfe7fb]">Tell us what kind of property you have and what needs to be repaired, scoped, or coordinated.</p>
          <div class="mt-7 flex flex-wrap items-center gap-5">
            <a href="tel:+15126084999" class="pill pill-lg">
              <span>Call (512) 608-4999</span>
              <span class="pill-circle"><img src="/assets/images/call-icon.png" alt=""></span>
            </a>
            <a href="/contact" class="pill pill-lg pill-navy">
                <span>Book an Appointment</span>
                <span class="pill-circle"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17L17 7M9 7h8v8"/></svg></span>
              </a>
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
        <p class="mt-3 text-[13px] text-white/60">Indigo Home &amp; Facility Services<br>License: RMP45574 EC23851</p>
        <div class="mt-4 flex gap-3">
          <img src="/assets/images/trust-icon1.png" alt="" class="size-11 object-contain">
          <img src="/assets/images/trust-icon2.png" alt="" class="size-11 object-contain">
        </div>
      </div>
      <div>
        <h2 class="mb-4 text-lg font-bold text-white">Services</h2>
        <a href="/#services" class="block py-1 hover:text-sky">Plumbing</a>
        <a href="/#services" class="block py-1 hover:text-sky">Electrical</a>
        <a href="/#services" class="block py-1 hover:text-sky">HVAC</a>
        <a href="/#services" class="block py-1 hover:text-sky">Carpentry &amp; Remodeling</a>
        <a href="/#services" class="block py-1 hover:text-sky">Painting &amp; Make-Readies</a>
        <a href="/#services" class="block py-1 hover:text-sky">Handyman &amp; Repairs</a>
      </div>
      <div>
        <h2 class="mb-4 text-lg font-bold text-white">Company</h2>
        <a href="/#top" class="block py-1 hover:text-sky">Home</a>
        <a href="/#about" class="block py-1 hover:text-sky">About Us</a>
        <a href="/residential" class="block py-1 hover:text-sky">Residential</a>
        <a href="/commercial" class="block py-1 hover:text-sky">Commercial</a>
        <a href="/#process" class="block py-1 hover:text-sky">How It Works</a>
        <a href="/#faq" class="block py-1 hover:text-sky">FAQ</a>
        <a href="/#estimate" class="block py-1 hover:text-sky">Membership</a>
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
       bar above. Deliberately BUTTONS and not \`<a href="/#terms">\`: a control that
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

export default function ResidentialPage() {
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
      className="min-h-screen bg-white page-residential"
      dangerouslySetInnerHTML={{ __html: BODY_HTML }}
    />
  )
}
