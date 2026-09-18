{/* ======================= TOP UTILITY BAR ======================= */}

  <div className="pad-rl">
    {/* The BAR is the background layer and spans the full card width, exactly
         like every `.slab` below it. The `.shell` inside is the text layer.
         Previously the bar sat inside the `.shell`, so the bar ITSELF was
         capped at 1417px: measured at 1920 the bar ran x 251.5..1668.5 while the
         hero slab ran x 50..1870 — 201.5px narrower per side, which is the
         defect this fixes. Its text was inset a further `pl-[47px] pr-[43px]`
         from its own edge, landing 47px right of the header brand.
         Now: bar edge = card edge, and `.mbox` puts the text on `--inset`, the
         same line as the brand and every section heading. */}
    <div className="pill-topbar mbox bg-topbar text-[13px] text-slate-200 max-md:text-[12px]">
      <div className="shell flex h-[43px] items-center justify-between gap-4 max-md:h-auto max-md:flex-wrap max-md:gap-2.5 max-md:py-2.5">
        <div className="flex flex-wrap items-center gap-4 max-md:gap-2.5">
          <span className="inline-flex items-center gap-2 font-semibold text-white">
            <svg className="size-4 text-sky" viewbox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" /></svg>
            Residential & commercial services
          </span>
          <span className="inline-flex items-center gap-2 font-semibold text-white">
            <svg className="size-4 text-sky" viewbox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 21s-7-5.5-7-11a7 7 0 1 1 14 0c0 5.5-7 11-7 11z" /><circle cx="12" cy="10" r="2.6" /></svg>
            Hays, Travis, and Williamson counties
          </span>
        </div>
        <div className="flex items-center gap-2.5 max-md:hidden">
          <span>Est. 2012 · Indigo Home & Facility Services</span>
        </div>
      </div>
    </div>
  </div>

  {/* ======================= HEADER ======================= */}

  <header id="top" className="pad-rl sticky top-0 z-40 bg-white/95 py-[25px] shadow-none backdrop-blur transition-shadow max-md:py-[14px] [&.is-scrolled]:shadow-[0_10px_30px_rgba(13,21,49,.08)]">
    {/* The header card is the background layer (full card width) and the
         `.shell` inside is the text layer, so the brand lands on the same line
         as the ribbon text and every section heading.
         The extra `.mbox` wrapper this replaces double-charged the inset: the
         chain was `.pad-rl > .mbox > .shell > .header-card.mbox`, i.e. the card
         edge at 42.6 while the hero slab's edge was at 28.8 (1440), and at 1920
         the brand sat at x 265.7 against the section text's 251.5. */}
    <div className="header-card mbox">
      <div className="shell flex h-[56px] items-center max-md:h-[56px]">

      <a href="#top" className="flex shrink-0 items-center gap-2">
        <img src="/assets/images/call-indigo-mark.svg" alt="Call Indigo logo" className="h-[26px] w-auto max-md:h-[24px] xl:h-[28px]" />
        <span className="font-sans text-[22px] font-extrabold leading-none tracking-[-.045em] text-[#081f3f] max-md:text-[19px] xl:text-[24px]">Call Indigo</span>
      </a>

      <nav className="ml-[38px] hidden items-center gap-[22px] whitespace-nowrap md:flex md:gap-[16px] lg:ml-[84px] lg:gap-[22px] xl:gap-[34px] 2xl:gap-[52px] max-md:ml-0" aria-label="Main">
        <a href="/" className="text-[12.5px] font-semibold text-ink hover:text-brand xl:text-[15px]">Home</a>
        <a href="/residential" className="text-[12.5px] font-semibold text-ink hover:text-brand xl:text-[15px]">Residential</a>
        <a href="/commercial" className="inline-flex h-[42px] items-center rounded-[8px] bg-sky px-[15px] text-[12.5px] font-semibold leading-none text-white xl:text-[15px]" aria-current="page">Commercial</a>
        <a href="index.html#contact" className="text-[12.5px] font-semibold text-ink hover:text-brand xl:text-[15px]">Contact</a>
      </nav>

      <a href="tel:+15126084999" className="ml-auto inline-flex shrink-0 items-center gap-[7px] whitespace-nowrap text-[16.5px] font-bold tracking-[-.01em] text-[#081f3f] max-md:[&>span]:hidden md:[&>span]:hidden lg:[&>span]:inline">
        <img src="/assets/images/call-icon.png" alt="" className="size-[22px] object-contain" />
        <span>(512) 608-4999</span>
      </a>

      <a href="index.html#contact" className="ml-[18px] hidden shrink-0 items-center gap-[7px] whitespace-nowrap rounded-[10px] bg-sky py-[4px] pl-[15px] pr-[4px] text-[12.5px] font-semibold leading-none text-white transition hover:bg-sky-soft lg:inline-flex max-lg:hidden xl:h-[54px] xl:min-w-[216px] xl:justify-center xl:gap-[7px] xl:pl-[26px] xl:pr-[6px] xl:text-[16px] xl:font-bold">
        <span>Schedule Online</span>
        <span className="grid size-[19px] shrink-0 place-items-center rounded-full bg-white text-ink xl:size-[42px]">
          <svg viewbox="0 0 24 24" className="size-[11px] xl:size-[14px]" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M7 17L17 7M9 7h8v8" /></svg>
        </span>
      </a>
      <button id="burger" aria-label="Open menu" aria-expanded="false" className="group ml-auto hidden flex-col items-end gap-1.5 p-2 max-md:flex">
        <span className="block h-[3px] w-8 rounded bg-ink transition group-aria-expanded:translate-y-[9px] group-aria-expanded:rotate-45"></span>
        <span className="block h-[3px] w-8 rounded bg-ink transition group-aria-expanded:opacity-0"></span>
        <span className="block h-[3px] w-8 rounded bg-ink transition group-aria-expanded:-translate-y-[9px] group-aria-expanded:-rotate-45"></span>
      </button>
      </div>
    </div>
  </header>
{/* ======================= MENU DRAWER ======================= */}
  <nav id="menu-panel" aria-hidden="true" className="fixed inset-y-0 right-0 z-50 flex w-[min(380px,88vw)] translate-x-[105%] flex-col overflow-y-auto bg-ink px-8 pb-10 pt-7 text-white transition-transform duration-[400ms] ease-[cubic-bezier(.7,0,.2,1)] [&.open]:translate-x-0">
    <div className="mb-6 flex items-center justify-between">
      <div className="flex items-center gap-2.5">
        <img src="/assets/images/call-indigo-mark-dark.svg" alt="Call Indigo logo" className="size-11 w-auto" />
        <span className="font-sans text-[22px] font-bold leading-none tracking-[-.02em] text-white">Call Indigo</span>
      </div>
      <button id="menu-close" aria-label="Close menu" className="text-2xl leading-none text-white">✕</button>
    </div>
<a href="/" className="border-b border-white/10 py-3 text-[22px] font-semibold hover:pl-2 hover:text-sky">Home</a>
    <a href="/residential" className="border-b border-white/10 py-3 text-[22px] font-semibold hover:pl-2 hover:text-sky">Residential</a>
    <a href="/commercial" className="border-b border-white/10 py-3 text-[22px] font-semibold hover:pl-2 hover:text-sky text-sky" aria-current="page">Commercial</a>
    <a href="index.html#contact" className="border-b border-white/10 py-3 text-[22px] font-semibold hover:pl-2 hover:text-sky">Contact</a>
    <a href="tel:+15126084999" className="mt-6 inline-flex items-center gap-3 font-bold text-sky">
      <img src="/assets/images/call-icon.png" alt="" className="size-5 object-contain" /> (512) 608-4999
    </a>
  </nav>
  <div id="menu-backdrop" className="pointer-events-none fixed inset-0 z-40 bg-[rgba(9,14,33,.6)] opacity-0 transition-opacity duration-300 [&.show]:pointer-events-auto [&.show]:opacity-100"></div>

  {/* ======================= HERO CARD
  <!-- ======================= HERO ======================= */}

  <div className="pad-rl">
    <section className="mbox slab slab-photo scrim-hero relative bg-brand pad-140">
      <img src="/assets/images/banner-bg-img.jpg" alt="" aria-hidden="true" className="pointer-events-none absolute inset-0 z-0 size-full object-cover" />
      <div className="slab-body shell">
        <div className="grid items-center gap-12 lg:grid-cols-[1.02fr_.98fr] lg:gap-[70px]">
          <div className="text-white">
            <span className="eyebrow">Commercial & facility services</span>
            <div className="mb-6 flex flex-wrap gap-2.5">
              <span className="rounded-[10px] bg-white/10 px-3.5 py-2 text-[11px] font-bold uppercase tracking-[0.16em] text-white/80">National facility management</span> <span className="rounded-[10px] bg-white/10 px-3.5 py-2 text-[11px] font-bold uppercase tracking-[0.16em] text-white/80">Licensed, bonded & insured in all 50 states</span>
            </div>
            <h1 className="text-[clamp(38px,4.6vw,64px)] font-extrabold leading-[1.04] tracking-[-.02em]">Love Your Facility Forever.</h1>
            <p className="mt-6 max-w-[580px] text-[17px] leading-[28px] text-white/85">Hire our national and insured facility services partners. And join our membership to achieve peace of mind with all things related to your facility.</p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <a href="index.html#contact" className="pill pill-lg">
                <span>Book an Appointment</span>
                <span className="pill-circle"><svg viewbox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M7 17L17 7M9 7h8v8" /></svg></span>
              </a>
              <a href="/residential" className="pill pill-lg pill-navy">
                <span>Residential</span>
                <span className="pill-circle"><svg viewbox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M7 17L17 7M9 7h8v8" /></svg></span>
              </a>
            </div>
            <a href="tel:+15126084999" className="mt-7 inline-block text-[12.5px] font-bold uppercase tracking-[0.16em] text-white/80">Call for a Consultation: (512) 608-4999</a>
          </div>
          <div className="relative">
            <img src="/assets/images/repair-img2.jpg" alt="Call Indigo facility services crew on a commercial job" className="h-[320px] w-full rounded-[18px] border-[3px] border-white/25 object-cover md:h-[400px] lg:h-[470px]" />
            <div className="absolute bottom-5 left-5 max-w-[300px] rounded-[14px] bg-white p-5 shadow-drop">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-body">National coverage · Austin, TX</p>
              <a href="tel:+15126084999" className="mt-1.5 block text-[22px] font-extrabold tracking-[-.02em] text-ink">(512) 608-4999</a>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>

  <div className="spacer"></div>

  {/* ======================= DATA RIBBON ======================= */}

  <div className="pad-rl">
    <section className="mbox slab bg-mist pad-30">
      <div className="shell grid grid-cols-2 gap-8 py-7 md:grid-cols-4">
        <div className="text-center">
          <p className="text-[34px] font-extrabold leading-none tracking-[-.02em] text-ink md:text-[42px]">500+</p>
          <p className="mt-2 text-[11.5px] font-bold uppercase tracking-[0.16em] text-body">Crews</p>
        </div>
        <div className="text-center">
          <p className="text-[34px] font-extrabold leading-none tracking-[-.02em] text-ink md:text-[42px]">250+</p>
          <p className="mt-2 text-[11.5px] font-bold uppercase tracking-[0.16em] text-body">Locations</p>
        </div>
        <div className="text-center">
          <p className="text-[34px] font-extrabold leading-none tracking-[-.02em] text-ink md:text-[42px]">All 50</p>
          <p className="mt-2 text-[11.5px] font-bold uppercase tracking-[0.16em] text-body">States serviced daily</p>
        </div>
        <div className="text-center">
          <p className="text-[34px] font-extrabold leading-none tracking-[-.02em] text-ink md:text-[42px]">100%</p>
          <p className="mt-2 text-[11.5px] font-bold uppercase tracking-[0.16em] text-body">Free inspections</p>
        </div>
      </div>
    </section>
  </div>

  <div className="spacer"></div>

  {/* ======================= VALUE PROP ======================= */}
  <section className="band pad-140">
    <div className="shell">
      <div className="reveal mx-auto mb-12 max-w-[780px] text-center">
        <h2 className="h-section">National crews, full range of services</h2>
      </div>
      <div className="grid gap-7 lg:grid-cols-2">
        <article className="reveal rounded-panel bg-topbar p-8 text-white md:p-10">
          <span className="eyebrow">Indigo Facility Management</span>
          <h3 className="text-[26px] font-bold leading-tight">Facility Management</h3>
          <p className="mt-4 text-[15px] leading-[26px] text-white/75">All new customers are given a free inspection of their entire address to identify all options to optimize facility maintenance over time. Our mission is to give our customers peace of mind throughout the continuum of owning, leasing, renting, buying, or selling the address. Our facility membership also involves our FM scope program to plan and predict the current and future demands of your facility's custom maintenance strategy. By getting your FM scope defined and or optimized with us, your team will avoid the frustration and high-costs of navigating facility maintenance alone.</p>
          <a href="index.html#contact" className="pill mt-7">
            <span>Learn More</span>
            <span className="pill-circle"><svg viewbox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M7 17L17 7M9 7h8v8" /></svg></span>
          </a>
        </article>
        <article className="reveal rounded-panel bg-mist p-8 md:p-10">
          <span className="eyebrow eyebrow-brand">Indigo Facility Partners</span>
          <h3 className="text-[26px] font-bold leading-tight text-ink">Facility Services</h3>
          <p className="mt-4 text-[15px] leading-[26px]">In addition to our membership, we provide nationally insured facility services for property teams that need reliable, professional support without a full management commitment.</p>
          <a href="index.html#contact" className="mt-7 inline-block text-sm font-bold text-brand">Contact us →</a>
        </article>
      </div>
    </div>
  </section>

  <div className="spacer"></div>

  {/* ======================= BENEFITS ======================= */}
  <div className="pad-rl">
    <section className="mbox slab bg-mist pad-140">
    <div className="shell grid grid-cols-[1.05fr_.95fr] items-center gap-[70px] max-lg:grid-cols-1 max-lg:gap-11">
      <div className="reveal">
        <span className="eyebrow eyebrow-brand">Why Call Indigo</span>
        <h2 className="h-section">All new customers receive a free inspection</h2>
        <p className="mt-4">Call Indigo provides national facility management with (512) 608-4999. Licensed, bonded, and insured across all 50 states.</p>
        <div className="mt-7 grid gap-6">
          <div className="reveal flex gap-4.5">
            <img src="/assets/images/choose-icon1.png" alt="" className="size-[54px] shrink-0 object-contain" />
            <div><strong className="text-lg font-bold text-ink">Free facility inspection</strong><p className="mt-1 text-sm">Every new customer receives a complete inspection of their entire address to identify options to optimize facility maintenance.</p></div>
          </div>
          <div className="reveal flex gap-4.5">
            <img src="/assets/images/choose-icon2.png" alt="" className="size-[54px] shrink-0 object-contain" />
            <div><strong className="text-lg font-bold text-ink">FM scope program</strong><p className="mt-1 text-sm">Define and optimize your facility maintenance strategy to predict current and future demands.</p></div>
          </div>
          <div className="reveal flex gap-4.5">
            <img src="/assets/images/choose-icon3.png" alt="" className="size-[54px] shrink-0 object-contain" />
            <div><strong className="text-lg font-bold text-ink">National crew network</strong><p className="mt-1 text-sm">500+ crews across 250+ locations ready to service your commercial properties nationwide.</p></div>
          </div>
          <div className="reveal flex gap-4.5">
            <img src="/assets/images/choose-icon4.png" alt="" className="size-[54px] shrink-0 object-contain" />
            <div><strong className="text-lg font-bold text-ink">Insured & licensed</strong><p className="mt-1 text-sm">Nationally insured facility services with professional, vetted crews for every job.</p></div>
          </div>
        </div>
        <a href="index.html#contact" className="pill mt-8">
          <span>Schedule Inspection</span>
          <span className="pill-circle"><svg viewbox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M7 17L17 7M9 7h8v8" /></svg></span>
        </a>
      </div>
      <div className="reveal">
        <img src="/assets/images/about-img2.jpg" alt="Call Indigo facility inspection" className="rounded-panel shadow-lift" />
      </div>
    </div>
    </section>
  </div>

  <div className="spacer"></div>

  {/* ======================= FINAL CTA ======================= */}

  <div className="pad-rl">
    <section className="mbox slab slab-photo scrim-blue bg-img-cta pad-30 relative bg-brand">
    <div className="slab-body shell">
      <div className="grid items-center gap-10 lg:grid-cols-[.92fr_1.08fr] lg:gap-[100px]">
        <div className="relative">
          <img src="/assets/images/cta-img.jpg" alt="Call Indigo technician on an emergency call" className="w-full rounded-[18px] object-cover" />
          <img src="/assets/images/logo-vector.png" alt="" aria-hidden="true" className="absolute -right-7 top-1/2 hidden w-[110px] -translate-y-1/2 lg:block" />
        </div>
        <div>
          <span className="eyebrow">Contact</span>
          <h2 className="h-section text-white">Call Call Indigo for your commercial property</h2>
          <p className="mt-4 max-w-[520px] text-[#dfe7fb]">Tell us about your facility and we will build a custom maintenance strategy with a free inspection.</p>
          <div className="mt-7 flex flex-wrap items-center gap-5">
            <a href="tel:+15126084999" className="pill pill-lg">
              <span>Call (512) 608-4999</span>
              <span className="pill-circle"><img src="/assets/images/call-icon.png" alt="" /></span>
            </a>
            <a href="/residential" className="pill pill-lg pill-navy">
                <span>Residential</span>
                <span className="pill-circle"><svg viewbox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M7 17L17 7M9 7h8v8" /></svg></span>
              </a>
          </div>
        </div>
      </div>
    </div>
    </section>
  </div>
  <div className="spacer"></div>

{/* ======================= FOOTER ======================= */}

  <div className="pad-rl">
    <footer className="mbox slab bg-ink-2 text-[14.5px] text-[#aebdd2]">
    <div className="shell grid gap-8 pb-[46px] pt-[52px] md:grid-cols-2 md:gap-10 md:pb-[74px] md:pt-[80px] lg:grid-cols-[2fr_1fr_1fr_1.5fr] lg:gap-[54px]">
      <div>
        <div className="mb-4 flex items-center gap-2.5">
          <img src="/assets/images/call-indigo-mark-dark.svg" alt="Call Indigo logo" className="size-12 w-auto" />
          <span className="font-sans text-[23px] font-bold leading-none tracking-[-.02em] text-white">Call Indigo</span>
        </div>
        <p>Licensed, bonded and insured home and facility services. One call covers plumbing, electrical, HVAC, carpentry, painting, and more — done right the first time.</p>
        <p className="mt-3 text-[13px] text-white/60">Indigo Home & Facility Services<br />License: RMP: 45574</p>
        <div className="mt-4 flex gap-3">
          <img src="/assets/images/trust-icon1.png" alt="" className="size-11 object-contain" />
          <img src="/assets/images/trust-icon2.png" alt="" className="size-11 object-contain" />
        </div>
      </div>
      <div>
        <h2 className="mb-4 text-lg font-bold text-white">Services</h2>
        <a href="index.html#services" className="block py-1 hover:text-sky">Plumbing</a>
        <a href="index.html#services" className="block py-1 hover:text-sky">Electrical</a>
        <a href="index.html#services" className="block py-1 hover:text-sky">HVAC</a>
        <a href="index.html#services" className="block py-1 hover:text-sky">Carpentry & Remodeling</a>
        <a href="index.html#services" className="block py-1 hover:text-sky">Painting & Make-Readies</a>
        <a href="index.html#services" className="block py-1 hover:text-sky">Handyman & Repairs</a>
      </div>
      <div>
        <h2 className="mb-4 text-lg font-bold text-white">Company</h2>
        <a href="index.html#top" className="block py-1 hover:text-sky">Home</a>
        <a href="index.html#about" className="block py-1 hover:text-sky">About Us</a>
        <a href="/residential" className="block py-1 hover:text-sky">Residential</a>
        <a href="/commercial" className="block py-1 hover:text-sky">Commercial</a>
        <a href="index.html#process" className="block py-1 hover:text-sky">How It Works</a>
        <a href="index.html#faq" className="block py-1 hover:text-sky">FAQ</a>
        <a href="index.html#estimate" className="block py-1 hover:text-sky">Membership</a>
      </div>
      <div>
        <h2 className="mb-4 text-lg font-bold text-white">Contact</h2>
        <a href="tel:+15126084999" className="block py-1 font-bold text-sky-soft hover:text-sky">(512) 608-4999</a>
        <a href="mailto:support@call-indigo.com" className="block py-1 hover:text-sky">support@call-indigo.com</a>
        <span className="block py-1">1005 Meredith Drive<br />Austin, TX 78748</span>
        <span className="block py-1">Serving Hays, Travis & Williamson counties</span>
        <span className="block py-1 text-white/60">Service area: Austin · Buda · Kyle · San Marcos</span>
      </div>
    </div>
    <div className="shell">
      <div className="flex flex-col items-center gap-3 border-t border-white/10 py-5 text-center text-[13px] lg:flex-row lg:justify-between lg:text-left">
        <p>© <span id="year"></span> Call Indigo LLC — prototype reconstruction for demo purposes.</p>
        <div className="flex flex-col items-center gap-2.5 md:flex-row md:flex-wrap md:justify-center md:gap-x-5 md:gap-y-2">
          <span className="text-white/60">Licensed, bonded, and insured.</span>
          <button type="button" className="legal-link" data-legal="terms">Terms of Service</button>
          <button type="button" className="legal-link" data-legal="privacy">Privacy Policy</button>
        </div>
      </div>
    </div>
    </footer>
  </div>

  {/* ======================= LEGAL MODALS ======================= */}

  <div id="legal-terms" className="legal" data-legal-modal role="dialog" aria-modal="true" aria-labelledby="legal-terms-title" aria-hidden="true">
    <div className="legal-scrim" data-legal-close></div>
    <div className="legal-sheet">
      <header className="legal-bar">
        <div className="min-w-0">
          <p className="legal-kicker">Call Indigo LLC · Austin, TX</p>
          <h2 id="legal-terms-title" className="legal-title">Terms of Service</h2>
        </div>
        <button type="button" className="legal-x" data-legal-x data-legal-close aria-label="Close Terms of Service">✕</button>
      </header>
      <div className="legal-body">
        <p className="legal-meta">Effective September 18, 2026 · Last updated September 18, 2026</p>
        <p className="legal-note"><strong>Sample language.</strong> This text is placeholder copy written to
          show the layout of a standard service-company agreement. It is not legal advice and has not been
          reviewed by counsel. Replace it before this site is published.</p>

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
        <p>Membership plans, including Indigo Home Management and our facility membership, are billed on the
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
        <p>Call Indigo LLC, 1005 Meredith Drive, Austin, TX 78748.<br />
          Phone: <a href="tel:+15126084999">(512) 608-4999</a><br />
          Email: <a href="mailto:support@call-indigo.com">support@call-indigo.com</a></p>

        <div className="legal-foot">
          <button type="button" className="legal-close" data-legal-close>Close</button>
          <p className="text-body">You can also close this window with the ✕ above or the Escape key.</p>
        </div>
      </div>
    </div>
  </div>

  <div id="legal-privacy" className="legal" data-legal-modal role="dialog" aria-modal="true" aria-labelledby="legal-privacy-title" aria-hidden="true">
    <div className="legal-scrim" data-legal-close></div>
    <div className="legal-sheet">
      <header className="legal-bar">
        <div className="min-w-0">
          <p className="legal-kicker">Call Indigo LLC · Austin, TX</p>
          <h2 id="legal-privacy-title" className="legal-title">Privacy Policy</h2>
        </div>
        <button type="button" className="legal-x" data-legal-x data-legal-close aria-label="Close Privacy Policy">✕</button>
      </header>
      <div className="legal-body">
        <p className="legal-meta">Effective September 18, 2026 · Last updated September 18, 2026</p>
        <p className="legal-note"><strong>Sample language.</strong> This text is placeholder copy written to
          show the layout of a standard service-company privacy policy. It is not legal advice and has not
          been reviewed by counsel. Replace it before this site is published.</p>

        <h3>1. Overview</h3>
        <p>Call Indigo LLC respects your privacy. This policy explains what we collect when you call us,
          submit a form, or browse this site; how we use it; and the choices you have. It applies to
          call-indigo.com and to the services we provide across Hays, Travis, and Williamson counties.</p>

        <h3>2. Information We Collect</h3>
        <ul>
          <li><strong>You give us:</strong> name, phone number, email address, service address, property
            type, and the description of the work you need.</li>
          <li><strong>We create:</strong> inspection notes, photos of the work area, estimates, invoices,
            and service history for your property.</li>
          <li><strong>We collect automatically:</strong> IP address, browser and device type, the pages
            you view, and how you arrived at the site.</li>
        </ul>

        <h3>3. How We Use Information</h3>
        <ul>
          <li>Respond to your request, schedule visits, and perform the work.</li>
          <li>Prepare estimates, invoices, and warranty records.</li>
          <li>Confirm, remind, and follow up on appointments.</li>
          <li>Improve our site, services, and crew routing.</li>
          <li>Meet licensing, insurance, tax, and legal obligations.</li>
        </ul>

        <h3>4. How We Share Information</h3>
        <p>We do not sell your personal information. We share it only as needed to run the business: with
          the crews and trade partners assigned to your job, with software providers who host our
          scheduling, payment, and email tools, and with insurers, auditors, or authorities when the law
          requires it. Vendors are expected to protect your information and to use it only for the service
          they provide to us.</p>

        <h3>5. Cookies and Analytics</h3>
        <p>This site uses cookies and similar technologies to remember your preferences and to understand
          which pages are useful. You can block or delete cookies in your browser settings; some parts of
          the site may work less smoothly if you do.</p>

        <h3>6. Calls, Texts, and Email</h3>
        <p>When you give us your phone number or email address, you agree that we may contact you about
          your request, your appointment, and your account, including by text message. Message and data
          rates may apply. You can opt out of marketing messages at any time by replying STOP to a text,
          using the unsubscribe link in an email, or calling us. You may still receive messages about an
          active job or an unpaid invoice.</p>

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
        <p>Call Indigo LLC, 1005 Meredith Drive, Austin, TX 78748.<br />
          Phone: <a href="tel:+15126084999">(512) 608-4999</a><br />
          Email: <a href="mailto:support@call-indigo.com">support@call-indigo.com</a></p>

        <div className="legal-foot">
          <button type="button" className="legal-close" data-legal-close>Close</button>
          <p className="text-body">You can also close this window with the ✕ above or the Escape key.</p>
        </div>
      </div>
    </div>
  </div>

  <script src="js/main.js"></script>