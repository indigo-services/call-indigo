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
        <a href="#top" className="inline-flex h-[42px] items-center rounded-[8px] bg-sky px-[15px] text-[12.5px] font-semibold leading-none text-white xl:text-[15px]" aria-current="page">Home</a>
        <a href="/residential" className="text-[12.5px] font-semibold text-ink hover:text-brand xl:text-[15px]">Residential</a>
        <a href="/commercial" className="text-[12.5px] font-semibold text-ink hover:text-brand xl:text-[15px]">Commercial</a>
        <a href="#contact" className="text-[12.5px] font-semibold text-ink hover:text-brand xl:text-[15px]">Contact</a>
      </nav>

      <a href="tel:+15126084999" className="ml-auto inline-flex shrink-0 items-center gap-[7px] whitespace-nowrap text-[16.5px] font-bold tracking-[-.01em] text-[#081f3f] max-md:[&>span]:hidden md:[&>span]:hidden lg:[&>span]:inline">
        <img src="/assets/images/call-icon.png" alt="" className="size-[22px] object-contain" />
        <span>(512) 608-4999</span>
      </a>

      <a href="#contact" className="ml-[18px] hidden shrink-0 items-center gap-[7px] whitespace-nowrap rounded-[10px] bg-sky py-[4px] pl-[15px] pr-[4px] text-[12.5px] font-semibold leading-none text-white transition hover:bg-sky-soft lg:inline-flex max-lg:hidden xl:h-[54px] xl:min-w-[216px] xl:justify-center xl:gap-[7px] xl:pl-[26px] xl:pr-[6px] xl:text-[16px] xl:font-bold">
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
    <a href="#top" className="border-b border-white/10 py-3 text-[22px] font-semibold text-sky hover:pl-2 hover:text-sky" aria-current="page">Home</a>
    <a href="/residential" className="border-b border-white/10 py-3 text-[22px] font-semibold hover:pl-2 hover:text-sky">Residential</a>
    <a href="/commercial" className="border-b border-white/10 py-3 text-[22px] font-semibold hover:pl-2 hover:text-sky">Commercial</a>
    <a href="#contact" className="border-b border-white/10 py-3 text-[22px] font-semibold hover:pl-2 hover:text-sky">Contact</a>
    <a href="tel:+15126084999" className="mt-6 inline-flex items-center gap-3 font-bold text-sky">
      <img src="/assets/images/call-icon.png" alt="" className="size-5 object-contain" /> (512) 608-4999
    </a>
  </nav>
  <div id="menu-backdrop" className="pointer-events-none fixed inset-0 z-40 bg-[rgba(9,14,33,.6)] opacity-0 transition-opacity duration-300 [&.show]:pointer-events-auto [&.show]:opacity-100"></div>

  {/* ======================= HERO CARD ======================= */}

  <div className="pad-rl">
    <section className="mbox slab slab-photo scrim-hero hero-card relative bg-brand">
      <img src="/assets/images/banner-bg-img.jpg" alt="" aria-hidden="true" className="pointer-events-none absolute inset-0 z-0 size-full object-cover" />

      <div className="slab-body hero-wrap">
      <div className="relative max-md:px-0">
        <div className="hero-row grid grid-cols-2 items-start gap-0">

          <div className="hero-inner px-[15px] text-white">
            <div className="banner-content-con pt-[50px]">

          <div className="banner-top">

          <div className="rating-con flex items-center">
            <span className="ml-[6px] grid size-[58px] shrink-0 place-items-center rounded-full bg-white">
              <svg viewbox="0 0 48 48" className="size-[40px]">
                <path fill="#4285F4" d="M45 24c0-1.6-.1-2.7-.4-4H24v8.5h12C35.7 31 34 33.6 31.3 35.4v5.6h6.2C41.3 37.4 45 31.3 45 24z" />
                <path fill="#34A853" d="M24 46c5.9 0 10.9-2 14.5-5.3l-7.1-5.6C29.4 36.4 27 37 24 37c-5.8 0-10.7-3.9-12.4-9.2H5v5.8C8.6 40.9 15.7 46 24 46z" />
                <path fill="#FBBC05" d="M11.6 27.8A13.2 13.2 0 0 1 10.9 24c0-1.3.2-2.7.7-3.8v-5.8H5A22 22 0 0 0 2 24c0 3.5.9 6.9 2.9 9.8l6.7-6z" />
                <path fill="#EA4335" d="M24 10.8c3.3 0 6.2 1.1 8.5 3.3l5.4-5.4C34.8 5.2 29.9 3 24 3 15.7 3 8.6 8.1 5 15.4l6.6 5.2C13.3 15.4 18.2 10.8 24 10.8z" />
              </svg>
            </span>
            <b className="rating-num font-bold tracking-[-.02em]">4.9</b>
            <div>
              <span className="mb-1.5 block text-[13px] text-white/95">4.9/5 Reviews</span>
              <div className="flex gap-[3px]">
                <svg viewbox="0 0 24 24" className="size-[15px] fill-star"><path d="M12 2l3 6.6 7 .7-5.2 4.7 1.5 7L12 17.4 5.7 21l1.5-7L2 9.3l7-.7z" /></svg>
                <svg viewbox="0 0 24 24" className="size-[15px] fill-star"><path d="M12 2l3 6.6 7 .7-5.2 4.7 1.5 7L12 17.4 5.7 21l1.5-7L2 9.3l7-.7z" /></svg>
                <svg viewbox="0 0 24 24" className="size-[15px] fill-star"><path d="M12 2l3 6.6 7 .7-5.2 4.7 1.5 7L12 17.4 5.7 21l1.5-7L2 9.3l7-.7z" /></svg>
                <svg viewbox="0 0 24 24" className="size-[15px] fill-star"><path d="M12 2l3 6.6 7 .7-5.2 4.7 1.5 7L12 17.4 5.7 21l1.5-7L2 9.3l7-.7z" /></svg>
                <svg viewbox="0 0 24 24" className="size-[15px] fill-star"><path d="M12 2l3 6.6 7 .7-5.2 4.7 1.5 7L12 17.4 5.7 21l1.5-7L2 9.3l7-.7z" /></svg>
              </div>
            </div>
          </div>

          <h1 className="hero-h1 mb-[28px] font-sans font-extrabold uppercase text-white">Expert <br /> Plumbing.</h1>
          </div>

          <div className="banner-bottom flex">

            <figure className="banner-img2 m-0 hidden md:block">

              <img src="/assets/images/repair-img2.jpg" alt="Call Indigo technician fitting a sink trap" className="rounded-[188px] border-[3px] border-white object-cover p-[12px]" />
            </figure>

            <div className="inner-wrap">

              <p className="banner-lead relative font-medium text-white">Fast, licensed, and local. From leaks to clogs to <br />heater failures—our experts fix it today.</p>
              <a href="#contact" className="pill pill-lg hero-cta">
                <span>Book Appointment</span>
                <span className="pill-circle">
                  <svg viewbox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M7 17L17 7M9 7h8v8" /></svg>
                </span>
              </a>

              <div className="statistics-wrapper flex items-center">
                <div className="statistics-box">
                  <b className="stat-num">15<span className="stat-k uppercase">k</span><sup>+</sup></b>
                  <span className="span-text">Satisfied Clients</span>
                </div>
                <div className="statistics-box var2">
                  <b className="stat-num">250<sup>+</sup></b>
                  <span className="span-text">Projects Completed</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        </div>

        <div className="banner-col relative px-[15px]">
        <div className="banner-img-con relative">

          <figure className="banner-img1 relative m-0 max-md:mx-auto">
            <img src="/assets/images/hero-arch.jpg" alt="Call Indigo technician on a residential service call" className="block h-auto max-w-full rounded-[258px] border-[3px] border-sky object-cover p-[12px]" />
          </figure>

          <figure className="plumber-img pointer-events-none absolute right-0 top-0 m-0">
            <img src="/assets/images/banner-plumber-img.png" alt="" aria-hidden="true" className="max-w-none object-contain" />
          </figure>

          <img src="/assets/images/dots.png" alt="" aria-hidden="true" className="dot-img pointer-events-none absolute left-0 opacity-90" />

          <a href="tel:+15126084999" className="navy-box absolute z-20 flex flex-col items-center justify-center rounded-[12px] bg-topbar text-center text-white shadow-[16px_2px_13px_rgb(0_0_0/11%)] transition hover:bg-[#1c2c4e] max-md:hidden">
            <img src="/assets/images/emergency-icon.png" alt="" aria-hidden="true" className="mb-[9px] w-[32px] object-contain" />
            <b className="mb-[6px] block text-[20px] font-bold leading-[24px]">Emergency</b>
            <span className="mb-1 block text-[14px] font-medium leading-[20px] text-white">Typical arrival<br />30–60 min</span>
            <span className="inline-block h-[26px] leading-[26px]"><img src="/assets/images/white-up-right-arrow.png" alt="" aria-hidden="true" className="inline h-[9px] w-[10px] align-middle object-contain" /></span>
          </a>
        </div>
        </div>
      </div>
      </div>

      <div className="scrol-outer pointer-events-none absolute inset-x-0 bottom-[60px] z-20 text-center max-md:hidden">
        <span className="block text-[14px] font-medium leading-[20px] text-white">Scroll Down</span>
        <a href="#about" aria-label="Scroll down to the next section" className="scroll-down-arrow pointer-events-auto absolute inset-x-0 flex items-center justify-center text-white">
          <span className="grid place-items-center rounded-full border border-white/30">
            <svg viewbox="0 0 24 24" className="size-[12px]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M6 13l6 6 6-6" /></svg>
          </span>
        </a>
      </div>
    </section>
  </div>

  <div className="spacer"></div>

  {/* ======================= ABOUT ======================= */}

  <div className="pad-rl">
    <section id="about" className="mbox slab bg-mist pad-30">

      <div className="grid grid-cols-2 items-center gap-[70px] max-lg:grid-cols-1 max-lg:gap-11 lg:grid-cols-[45%_1fr] lg:gap-[120px]">
      <div className="reveal flex items-center gap-[30px] max-lg:justify-center max-md:gap-0">

        <figure className="m-0 min-w-0 flex-[372] max-w-[372px] max-lg:w-[280px] max-lg:flex-none max-lg:max-w-none max-md:w-1/2 max-md:pr-[8px]">
          <img src="/assets/images/about-img1.jpg" alt="Call Indigo technician at work" className="w-full rounded-[18px]" />
        </figure>
        <div className="relative min-w-0 flex-[347] max-w-[347px] max-lg:w-[260px] max-lg:flex-none max-lg:max-w-none max-md:w-1/2 max-md:pl-[8px]">
          <figure className="m-0">
            <img src="/assets/images/about-img2.jpg" alt="Property inspection" className="w-full rounded-[18px]" />
          </figure>

          <div className="absolute -right-[29%] top-0 bottom-0 my-auto grid h-[301px] w-[205px] place-content-center rounded-[104px] bg-white text-center shadow-lift max-md:hidden">
            <span className="mx-auto mb-[10px] grid size-[106px] place-items-center rounded-full bg-topbar">
              <img src="/assets/images/about-icon.png" alt="" aria-hidden="true" className="w-[54px]" />
            </span>
            <strong className="block text-[56px] font-extrabold leading-[56px] text-sky">15<sup>+</sup></strong>
            <span className="text-[15px] leading-[1.35] text-ink">Years of<br />Experience</span>
          </div>
        </div>
      </div>
      <div className="reveal">
        <span className="eyebrow">About Us</span>
        <h2 className="h-section">Family Owned, Locally Operated</h2>
        <p className="mb-6 mt-4">Call Indigo is your single phone call for any address. Licensed, insured, and headquartered in Austin, Texas since 2012 — serving homes and facilities across Hays, Travis, and Williamson counties.</p>

        <ul className="mb-8 grid gap-x-8 gap-y-3 sm:grid-cols-2">
          <li className="relative pl-9 font-medium text-[#3c4656] before:absolute before:left-0 before:top-0.5 before:grid before:size-[23px] before:place-items-center before:rounded-full before:bg-sky before:text-xs before:font-bold before:text-white before:content-['✓']">Free inspection of your entire address for every new customer</li>
          <li className="relative pl-9 font-medium text-[#3c4656] before:absolute before:left-0 before:top-0.5 before:grid before:size-[23px] before:place-items-center before:rounded-full before:bg-sky before:text-xs before:font-bold before:text-white before:content-['✓']">Discounted rates for senior citizens, military, and members</li>
          <li className="relative pl-9 font-medium text-[#3c4656] before:absolute before:left-0 before:top-0.5 before:grid before:size-[23px] before:place-items-center before:rounded-full before:bg-sky before:text-xs before:font-bold before:text-white before:content-['✓']">Licensed, bonded, and insured — one call covers every service</li>
        </ul>
        <div className="flex flex-wrap items-center gap-6">
          <a href="#services" className="pill">
            <span>Explore Services</span>
            <span className="pill-circle">
              <svg viewbox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M7 17L17 7M9 7h8v8" /></svg>
            </span>
          </a>
          <a href="#contact" className="font-bold text-ink hover:text-brand">Meet the team →</a>
        </div>
      </div>
    </div>
    </section>
  </div>

  <div className="spacer"></div>

  {/* ======================= SERVICES ======================= */}

  <section id="services" className="band pad-140">
    <div className="shell">
      <div className="reveal mb-12 max-w-[660px]">
        <span className="eyebrow eyebrow-brand">Our Services</span>
        <h2 className="h-section">Full-service home & property support</h2>
        <p className="mt-4">Licensed and insured services for Hays, Travis, and Williamson counties. One call covers plumbing, electrical, HVAC, carpentry, painting, and more.</p>
      </div>
      <div className="grid gap-7 md:grid-cols-2 lg:grid-cols-3">
        <article className="card card-hover reveal relative overflow-visible">
          <div className="h-[210px] overflow-hidden rounded-t-panel"><img src="/assets/images/services-img1.jpg" alt="Plumbing services" className="size-full object-cover transition duration-500 hover:scale-[1.07]" /></div>
          <img src="/assets/images/services-icon1.png" alt="" className="-mt-8 ml-6 size-[62px] rounded-[10px] border-[3px] border-white bg-sky object-contain p-3.5 shadow-lift" />
          <h3 className="mb-1.5 mt-4 px-6 text-[21px] font-bold text-ink">Plumbing</h3>
          <p className="px-6 text-[14.5px]">Emergency plumbing, water heaters, leak detection, sinks, faucets, toilets, gas lines, and more.</p>
          <span className="mb-[22px] inline-block px-6 pt-1 text-sm font-bold text-brand">Learn more →</span>
        </article>
        <article className="card card-hover reveal relative overflow-visible">
          <div className="h-[210px] overflow-hidden rounded-t-panel"><img src="/assets/images/services-img2.jpg" alt="Electrical services" className="size-full object-cover transition duration-500 hover:scale-[1.07]" /></div>
          <img src="/assets/images/services-icon2.png" alt="" className="-mt-8 ml-6 size-[62px] rounded-[10px] border-[3px] border-white bg-sky object-contain p-3.5 shadow-lift" />
          <h3 className="mb-1.5 mt-4 px-6 text-[21px] font-bold text-ink">Electrical</h3>
          <p className="px-6 text-[14.5px]">Residential and commercial electrical, wiring, lighting, ceiling fans, exhaust fans, and panel work.</p>
          <span className="mb-[22px] inline-block px-6 pt-1 text-sm font-bold text-brand">Learn more →</span>
        </article>
        <article className="card card-hover reveal relative overflow-visible">
          <div className="h-[210px] overflow-hidden rounded-t-panel"><img src="/assets/images/services-img3.jpg" alt="HVAC services" className="size-full object-cover transition duration-500 hover:scale-[1.07]" /></div>
          <img src="/assets/images/services-icon3.png" alt="" className="-mt-8 ml-6 size-[62px] rounded-[10px] border-[3px] border-white bg-sky object-contain p-3.5 shadow-lift" />
          <h3 className="mb-1.5 mt-4 px-6 text-[21px] font-bold text-ink">HVAC</h3>
          <p className="px-6 text-[14.5px]">Heating, ventilation, and air conditioning installation, repair, and maintenance for homes and properties.</p>
          <span className="mb-[22px] inline-block px-6 pt-1 text-sm font-bold text-brand">Learn more →</span>
        </article>
        <article className="card card-hover reveal relative overflow-visible">
          <div className="h-[210px] overflow-hidden rounded-t-panel"><img src="/assets/images/services-img4.jpg" alt="Carpentry and remodeling" className="size-full object-cover transition duration-500 hover:scale-[1.07]" /></div>
          <img src="/assets/images/services-icon4.png" alt="" className="-mt-8 ml-6 size-[62px] rounded-[10px] border-[3px] border-white bg-sky object-contain p-3.5 shadow-lift" />
          <h3 className="mb-1.5 mt-4 px-6 text-[21px] font-bold text-ink">Carpentry & Remodeling</h3>
          <p className="px-6 text-[14.5px]">Doors, decks, fences, drywall, siding, flooring, full remodeling, and construction projects.</p>
          <span className="mb-[22px] inline-block px-6 pt-1 text-sm font-bold text-brand">Learn more →</span>
        </article>
        <article className="card card-hover reveal relative overflow-visible">
          <div className="h-[210px] overflow-hidden rounded-t-panel"><img src="/assets/images/services-img5.jpg" alt="Painting and make-readies" className="size-full object-cover transition duration-500 hover:scale-[1.07]" /></div>
          <img src="/assets/images/services-icon5.png" alt="" className="-mt-8 ml-6 size-[62px] rounded-[10px] border-[3px] border-white bg-sky object-contain p-3.5 shadow-lift" />
          <h3 className="mb-1.5 mt-4 px-6 text-[21px] font-bold text-ink">Painting & Make-Readies</h3>
          <p className="px-6 text-[14.5px]">Interior and exterior painting, make-ready services for rentals, and property turnover coordination.</p>
          <span className="mb-[22px] inline-block px-6 pt-1 text-sm font-bold text-brand">Learn more →</span>
        </article>
        <article className="card card-hover reveal relative overflow-visible">
          <div className="h-[210px] overflow-hidden rounded-t-panel"><img src="/assets/images/services-img6.jpg" alt="Handyman and repairs" className="size-full object-cover transition duration-500 hover:scale-[1.07]" /></div>
          <img src="/assets/images/services-icon6.png" alt="" className="-mt-8 ml-6 size-[62px] rounded-[10px] border-[3px] border-white bg-sky object-contain p-3.5 shadow-lift" />
          <h3 className="mb-1.5 mt-4 px-6 text-[21px] font-bold text-ink">Handyman & Repairs</h3>
          <p className="px-6 text-[14.5px]">General repairs, handyman services, landscaping, and ongoing property maintenance.</p>
          <span className="mb-[22px] inline-block px-6 pt-1 text-sm font-bold text-brand">Learn more →</span>
        </article>
      </div>
    </div>
  </section>

  <div className="spacer"></div>

  {/* ======================= WHY CHOOSE US ======================= */}

  <div className="pad-rl">
    <section id="choose" className="mbox slab bg-mist pad-140">
    <div className="shell grid grid-cols-[1.05fr_.95fr] items-center gap-[70px] max-lg:grid-cols-1 max-lg:gap-11">
      <div className="reveal">
        <span className="eyebrow eyebrow-brand">Why Call Indigo</span>
        <h2 className="h-section">Why choose Call Indigo</h2>
        <p className="mt-4">Serving Hays, Travis, and Williamson counties since 2012. Licensed, bonded, and insured for your peace of mind.</p>
        <div className="mt-7 grid gap-6">
          <div className="reveal flex gap-4.5">
            <img src="/assets/images/choose-icon1.png" alt="" className="size-[54px] shrink-0 object-contain" />
            <div><strong className="text-lg font-bold text-ink">Free property inspection</strong><p className="mt-1 text-sm">Every new customer receives a free inspection of their entire address.</p></div>
          </div>
          <div className="reveal flex gap-4.5">
            <img src="/assets/images/choose-icon2.png" alt="" className="size-[54px] shrink-0 object-contain" />
            <div><strong className="text-lg font-bold text-ink">Discounted rates</strong><p className="mt-1 text-sm">Discounted rates for senior citizens, military, and members.</p></div>
          </div>
          <div className="reveal flex gap-4.5">
            <img src="/assets/images/choose-icon3.png" alt="" className="size-[54px] shrink-0 object-contain" />
            <div><strong className="text-lg font-bold text-ink">One call, any service</strong><p className="mt-1 text-sm">From plumbing to remodeling — one phone call covers every service your property needs.</p></div>
          </div>
          <div className="reveal flex gap-4.5">
            <img src="/assets/images/choose-icon4.png" alt="" className="size-[54px] shrink-0 object-contain" />
            <div><strong className="text-lg font-bold text-ink">Local & trusted</strong><p className="mt-1 text-sm">Headquartered in Austin, TX. Family owned and locally operated since 2012.</p></div>
          </div>
        </div>
      </div>
      <div className="reveal">
        <img src="/assets/images/choose-img1.jpg" alt="Why choose Call Indigo" className="rounded-panel shadow-lift" />
      </div>
    </div>
    </section>
  </div>

  <div className="spacer"></div>

  {/* ======================= PRICE ESTIMATOR ======================= */}

  <div className="pad-rl">
    <section id="estimate" className="mbox slab slab-photo scrim-blue bg-img-estimate pad-140 relative bg-brand">
    <div className="slab-body shell">

      <div className="reveal mx-auto mb-12 max-w-[860px] text-center">
        <span className="eyebrow">Membership</span>
        <h2 className="h-section text-white">Indigo Home Management</h2>
        <p className="mx-auto mt-4 max-w-[720px] text-[#dfe7fb]">All new customers are given a free inspection of their entire address to identify all options to maximize property value over time. Our membership also involves turn-key STR and LTR services to increase rental income for property owners.</p>
      </div>
      <div className="reveal rounded-panel bg-white p-8 text-body shadow-drop md:p-[46px]">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_.8fr] lg:gap-14">
          <div>
            <h3 className="mb-4 text-[20px] font-semibold text-ink">What membership includes:</h3>
            <ul className="grid gap-2.5">
              <li className="flex justify-between gap-5 rounded-[10px] border border-line bg-mist px-5 py-3 text-[14.5px] text-body"><span>Free whole-address inspection</span><b className="text-sky">Included</b></li>
              <li className="flex justify-between gap-5 rounded-[10px] border border-line bg-mist px-5 py-3 text-[14.5px] text-body"><span>All home services, local crews</span><b className="text-sky">Included</b></li>
              <li className="flex justify-between gap-5 rounded-[10px] border border-line bg-mist px-5 py-3 text-[14.5px] text-body"><span>Turn-key STR & LTR services</span><b className="text-sky">Included</b></li>
              <li className="flex justify-between gap-5 rounded-[10px] border border-line bg-mist px-5 py-3 text-[14.5px] text-body"><span>Senior, military & member rates</span><b className="text-sky">Discounted</b></li>
            </ul>
          </div>
          <div>
            <span className="eyebrow">Free Inspection</span>
            <h3 className="mb-2 text-[24px] font-bold text-ink">Book your free inspection</h3>
            <p className="mb-6 text-sm">Every new customer receives a complete inspection of their entire address. Tell us where to look and the Indigo team will coordinate the next opening.</p>
            <div className="grid gap-3.5">
              <a href="tel:+15126084999" className="pill pill-block pill-navy">
                <span>Call (512) 608-4999</span>
                <span className="pill-circle">
                  <svg viewbox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M7 17L17 7M9 7h8v8" /></svg>
                </span>
              </a>
              <a href="mailto:support@call-indigo.com" className="pill pill-block">
                <span>support@call-indigo.com</span>
                <span className="pill-circle">
                  <svg viewbox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M7 17L17 7M9 7h8v8" /></svg>
                </span>
              </a>
              <p className="mt-1 text-center text-[13px]">Serving Hays, Travis & Williamson counties</p>
            </div>
          </div>
        </div>
      </div>
    </div>
    </section>
  </div>

  <div className="spacer"></div>

  {/* ======================= PROCESS ======================= */}

  <section id="process" className="band pad-140">
    <div className="shell">
      <div className="reveal mb-12 max-w-[660px]">
        <span className="eyebrow eyebrow-brand">How It Works</span>
        <h2 className="h-section">A clear path from first call to scheduled work</h2>
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card card-hover reveal relative p-[30px]">
          <b className="absolute right-5 top-4 text-[34px] font-bold text-mist">01</b>
          <img src="/assets/images/work-icon1.png" alt="" className="mb-3.5 size-[54px] object-contain" />
          <strong className="mb-1.5 block text-[17px] font-bold text-ink">Call Indigo</strong>
          <p className="text-[13.5px]">Start with one phone call and the address that needs service.</p>
        </div>
        <div className="card card-hover reveal relative p-[30px]">
          <b className="absolute right-5 top-4 text-[34px] font-bold text-mist">02</b>
          <img src="/assets/images/work-icon2.png" alt="" className="mb-3.5 size-[54px] object-contain" />
          <strong className="mb-1.5 block text-[17px] font-bold text-ink">Define the scope</strong>
          <p className="text-[13.5px]">Simple work may be estimated by phone. Larger jobs get a walk-through or detailed proposal.</p>
        </div>
        <div className="card card-hover reveal relative p-[30px]">
          <b className="absolute right-5 top-4 text-[34px] font-bold text-mist">03</b>
          <img src="/assets/images/work-icon3.png" alt="" className="mb-3.5 size-[54px] object-contain" />
          <strong className="mb-1.5 block text-[17px] font-bold text-ink">Schedule the work</strong>
          <p className="text-[13.5px]">Approved estimates are coordinated by the Indigo team and scheduled around your property needs.</p>
        </div>
        <div className="card card-hover reveal relative p-[30px]">
          <b className="absolute right-5 top-4 text-[34px] font-bold text-mist">04</b>
          <img src="/assets/images/work-icon4.png" alt="" className="mb-3.5 size-[54px] object-contain" />
          <strong className="mb-1.5 block text-[17px] font-bold text-ink">Maintain the address</strong>
          <p className="text-[13.5px]">Use Indigo as your ongoing service partner for recurring home and property needs.</p>
        </div>
      </div>
    </div>
  </section>

  <div className="spacer"></div>

  {/* ======================= RESULTS GALLERY ======================= */}

  <div className="pad-rl">
    <section id="results" className="mbox slab bg-mist pad-140">
    <div className="shell">
      <div className="reveal mb-12 max-w-[760px]">
        <span className="eyebrow eyebrow-brand">Recent Work</span>
        <h2 className="h-section">Real repairs. Real results. Done right.</h2>
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <figure className="reveal relative m-0 overflow-hidden rounded-panel">
          <img src="/assets/images/repair-img1.jpg" alt="" className="h-[250px] w-full object-cover transition duration-500 hover:scale-[1.08]" />
          <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/88 to-transparent px-4 pb-4 pt-8 font-semibold text-white">Kitchen Line Re-pipe</figcaption>
        </figure>
        <figure className="reveal relative m-0 overflow-hidden rounded-panel">
          <img src="/assets/images/repair-img2.jpg" alt="" className="h-[250px] w-full object-cover transition duration-500 hover:scale-[1.08]" />
          <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/88 to-transparent px-4 pb-4 pt-8 font-semibold text-white">Bathroom Remodel Fit-out</figcaption>
        </figure>
        <figure className="reveal relative m-0 overflow-hidden rounded-panel">
          <img src="/assets/images/repair-img3.jpg" alt="" className="h-[250px] w-full object-cover transition duration-500 hover:scale-[1.08]" />
          <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/88 to-transparent px-4 pb-4 pt-8 font-semibold text-white">Water Heater Swap</figcaption>
        </figure>
        <figure className="reveal relative m-0 overflow-hidden rounded-panel">
          <img src="/assets/images/repair-img4.jpg" alt="" className="h-[250px] w-full object-cover transition duration-500 hover:scale-[1.08]" />
          <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/88 to-transparent px-4 pb-4 pt-8 font-semibold text-white">Emergency Leak Repair</figcaption>
        </figure>
      </div>
    </div>
    </section>
  </div>

  <div className="spacer"></div>

  {/* ======================= TESTIMONIALS ======================= */}

  <section id="reviews" className="band pad-140">
    <div className="shell">
      <div className="reveal mb-12 max-w-[660px]">
        <span className="eyebrow eyebrow-brand">Testimonials</span>
        <h2 className="h-section">Trusted Reviews from Homeowners & Businesses</h2>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <article className="card card-hover reveal p-[30px]">
          <img src="/assets/images/quote-icon.png" alt="" className="mb-3.5 w-[38px]" />
          <img src="/assets/images/stars.png" alt="5 stars" className="mb-3 h-4 w-auto" />
          <p className="mb-5 font-medium text-[#3c4656]">“Fast, reliable, and courteous service. Highly recommend!”</p>
          <footer className="flex items-center gap-3">
            <img src="/assets/images/testimonial-icon1.jpg" alt="Amanda R." className="size-[46px] rounded-full object-cover" />
            <div><strong className="block text-[15px] font-bold text-ink">Amanda R.</strong><span className="text-[13px]">Homeowner</span></div>
          </footer>
        </article>
        <article className="card card-hover reveal p-[30px]">
          <img src="/assets/images/quote-icon.png" alt="" className="mb-3.5 w-[38px]" />
          <img src="/assets/images/stars.png" alt="5 stars" className="mb-3 h-4 w-auto" />
          <p className="mb-5 font-medium text-[#3c4656]">“Professional team, arrived on time, and fixed the issue quickly.”</p>
          <footer className="flex items-center gap-3">
            <img src="/assets/images/testimonial-icon2.jpg" alt="Michael S." className="size-[46px] rounded-full object-cover" />
            <div><strong className="block text-[15px] font-bold text-ink">Michael S.</strong><span className="text-[13px]">Business Owner</span></div>
          </footer>
        </article>
        <article className="card card-hover reveal p-[30px]">
          <img src="/assets/images/quote-icon.png" alt="" className="mb-3.5 w-[38px]" />
          <img src="/assets/images/stars.png" alt="5 stars" className="mb-3 h-4 w-auto" />
          <p className="mb-5 font-medium text-[#3c4656]">“Clear pricing, tidy work, and the leak hasn't come back since.”</p>
          <footer className="flex items-center gap-3">
            <img src="/assets/images/testimonial-icon3.jpg" alt="Derrick M." className="size-[46px] rounded-full object-cover" />
            <div><strong className="block text-[15px] font-bold text-ink">Derrick M.</strong><span className="text-[13px]">Property Manager</span></div>
          </footer>
        </article>
      </div>
    </div>
  </section>

  <div className="spacer"></div>

  {/* ======================= SERVICE AREA ======================= */}

  <div className="pad-rl">
    <section id="area" className="mbox slab slab-photo scrim-blue bg-img-area pad-78 relative bg-brand">
    <div className="slab-body mx-auto max-w-[1578px]">
      <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-[1fr_1.5fr_1fr]">
        <div className="relative hidden lg:block">
          <img src="/assets/images/check-small-img1.jpg" alt="" className="ml-auto w-[64%] rounded-[14px]" />
          <img src="/assets/images/dots2.png" alt="" aria-hidden="true" className="absolute right-[10%] top-[44%] w-[72px] opacity-90" />
          <img src="/assets/images/check-big-img1.jpg" alt="" className="mt-5 w-[80%] rounded-[14px]" />
        </div>
        {/* `grid-cols-1` is not decoration. With no explicit template the single
             implicit column is `auto`, which is sized to its items' MIN-CONTENT —
             and `#zip-form`'s min-content is 368.5px (the text input's intrinsic
             width plus the button's max-content). The track therefore grew past
             its 358px container and the form painted 10.5px outside the section's
             content box, where `body { overflow-x: hidden }` hid it.
             `minmax(0,1fr)` caps the track at the container and `min-w-0` lets the
             item shrink; the input, already `min-w-0 flex-1`, absorbs the
             difference. Verified with _audit/v2check/mincontent.py. */}
        <div className="min-w-0 text-center">
          <span className="eyebrow">Service Area</span>
          <h2 className="h-section text-white">Check Service Availability<br />in Your Area</h2>
          <p className="mx-auto mt-4 max-w-[430px] text-[18px] leading-[28px] text-white">Enter your ZIP to check availability and earliest arrival.</p>
          <form id="zip-form" className="mx-auto mt-6 flex max-w-[470px] gap-3">
            <input id="zip-input" type="text" placeholder="Enter ZIP code (e.g., 78701)" maxLength="10" aria-label="ZIP code" className="min-w-0 flex-1 rounded-[10px] border-0 bg-white px-6 py-4 font-medium text-ink placeholder:text-body focus:outline-2 focus:outline-sky" />
            <button type="submit" className="pill pill-sm">
              <span>Check Now</span>
              <span className="pill-circle">
                <svg viewbox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M7 17L17 7M9 7h8v8" /></svg>
              </span>
            </button>
          </form>
          <p id="zip-result" hidden className="mt-4 font-semibold text-white">✓ Great news — we cover your area with same-day service!</p>
          <p className="mt-5 text-[14px] leading-[20px] text-white">Proudly serving Austin, Round Rock, Cedar Park, Pflugerville, and Georgetown.</p>
        </div>
        <div className="relative hidden lg:block">
          <img src="/assets/images/check-small-img2.jpg" alt="" className="w-[64%] rounded-[14px]" />
          <img src="/assets/images/dots.png" alt="" aria-hidden="true" className="absolute left-[10%] top-[44%] w-[72px] opacity-90" />
          <img src="/assets/images/check-big-img2.jpg" alt="" className="ml-auto mt-5 w-[80%] rounded-[14px]" />
        </div>
      </div>
    </div>
    </section>
  </div>

  <div className="spacer"></div>

  {/* ======================= FAQ ======================= */}

  <div className="pad-rl">
    <section id="faq" className="mbox slab bg-mist pad-140">
    <div className="shell max-w-[840px]">
      <div className="reveal mb-12">
        <span className="eyebrow eyebrow-brand">FAQ</span>
        <h2 className="h-section">Answers to Your Frequently Asked Questions</h2>
      </div>
      <div className="reveal grid gap-3.5">
        <details open className="rounded-[10px] border border-line bg-white px-6 py-1.5 transition-colors open:border-sky">
          <summary className="flex cursor-pointer items-center justify-between gap-4 py-4 text-[16.5px] font-bold text-ink [&::-webkit-details-marker]:hidden">
            What services does Call Indigo provide?<span className="chev"></span>
          </summary>
          <p className="max-w-[660px] pb-4">One call covers plumbing, electrical, HVAC, carpentry and remodeling, painting and make-readies, plus general handyman and repair work — for both homes and commercial facilities.</p>
        </details>
        <details className="rounded-[10px] border border-line bg-white px-6 py-1.5 transition-colors open:border-sky">
          <summary className="flex cursor-pointer items-center justify-between gap-4 py-4 text-[16.5px] font-bold text-ink [&::-webkit-details-marker]:hidden">
            What areas do you serve?<span className="chev"></span>
          </summary>
          <p className="max-w-[660px] pb-4">We serve Hays, Travis, and Williamson counties — including Austin, Buda, Kyle, and San Marcos. Commercial facility services are available nationwide.</p>
        </details>
        <details className="rounded-[10px] border border-line bg-white px-6 py-1.5 transition-colors open:border-sky">
          <summary className="flex cursor-pointer items-center justify-between gap-4 py-4 text-[16.5px] font-bold text-ink [&::-webkit-details-marker]:hidden">
            Is the inspection really free?<span className="chev"></span>
          </summary>
          <p className="max-w-[660px] pb-4">Yes. Every new customer receives a free inspection of their entire address to identify all options to maximize property value over time.</p>
        </details>
        <details className="rounded-[10px] border border-line bg-white px-6 py-1.5 transition-colors open:border-sky">
          <summary className="flex cursor-pointer items-center justify-between gap-4 py-4 text-[16.5px] font-bold text-ink [&::-webkit-details-marker]:hidden">
            Do you offer any discounts?<span className="chev"></span>
          </summary>
          <p className="max-w-[660px] pb-4">We offer discounted rates for all of our services to senior citizens, military, and members.</p>
        </details>
        <details className="rounded-[10px] border border-line bg-white px-6 py-1.5 transition-colors open:border-sky">
          <summary className="flex cursor-pointer items-center justify-between gap-4 py-4 text-[16.5px] font-bold text-ink [&::-webkit-details-marker]:hidden">
            Are you licensed and insured?<span className="chev"></span>
          </summary>
          <p className="max-w-[660px] pb-4">Yes — Call Indigo is licensed, bonded, and insured. We are family owned and locally operated, headquartered in Austin, TX since 2012.</p>
        </details>
      </div>
    </div>
  </section>
  </div>

  <div className="spacer"></div>

  {/* ======================= BRANDS ======================= */}

  <section id="brands" className="band py-14">
    <div className="shell">
      <h2 className="reveal mb-8 text-center text-lg font-bold uppercase tracking-[.08em] text-[#8b97a8]">Trusted By Leading Brands</h2>
      <div className="reveal flex flex-wrap items-center justify-center gap-11">
        <img src="/assets/images/tc-logo1.png" alt="Brand 1" className="h-10 w-auto object-contain opacity-55 grayscale transition hover:opacity-100 hover:grayscale-0" />
        <img src="/assets/images/tc-logo2.png" alt="Brand 2" className="h-10 w-auto object-contain opacity-55 grayscale transition hover:opacity-100 hover:grayscale-0" />
        <img src="/assets/images/tc-logo3.png" alt="Brand 3" className="h-10 w-auto object-contain opacity-55 grayscale transition hover:opacity-100 hover:grayscale-0" />
        <img src="/assets/images/tc-logo4.png" alt="Brand 4" className="h-10 w-auto object-contain opacity-55 grayscale transition hover:opacity-100 hover:grayscale-0" />
        <img src="/assets/images/tc-logo5.png" alt="Brand 5" className="h-10 w-auto object-contain opacity-55 grayscale transition hover:opacity-100 hover:grayscale-0" />
        <img src="/assets/images/tc-logo6.png" alt="Brand 6" className="h-10 w-auto object-contain opacity-55 grayscale transition hover:opacity-100 hover:grayscale-0" />
      </div>
    </div>
  </section>

  <div className="spacer"></div>

  {/* ======================= EMERGENCY CTA ======================= */}

  <div className="pad-rl">
    <section id="contact" className="mbox slab slab-photo scrim-blue bg-img-cta pad-30 relative bg-brand">
    <div className="slab-body">
      <div className="grid items-center gap-10 lg:grid-cols-[.92fr_1.08fr] lg:gap-[100px]">
        <div className="relative">
          <img src="/assets/images/cta-img.jpg" alt="Call Indigo technician on an emergency call" className="w-full rounded-[18px] object-cover" />
          <img src="/assets/images/logo-vector.png" alt="" aria-hidden="true" className="absolute -right-7 top-1/2 hidden w-[110px] -translate-y-1/2 lg:block" />
        </div>
        <div>
          <span className="eyebrow">Get in Touch</span>
          <h2 className="h-section text-white">Need Help Right Now?<br />Call Our Emergency Line.</h2>
          <div className="mt-7 flex flex-wrap items-center gap-6">
            <a href="tel:+15126084999" className="pill pill-lg">
              <span>(512) 608-4999</span>
              <span className="pill-circle"><img src="/assets/images/call-icon.png" alt="" /></span>
            </a>
            <span className="max-w-[235px] text-[14px] leading-[20px] text-white">Typical arrival in 30–60 minutes, depending on demand and location.</span>
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
        <a href="#services" className="block py-1 hover:text-sky">Plumbing</a>
        <a href="#services" className="block py-1 hover:text-sky">Electrical</a>
        <a href="#services" className="block py-1 hover:text-sky">HVAC</a>
        <a href="#services" className="block py-1 hover:text-sky">Carpentry & Remodeling</a>
        <a href="#services" className="block py-1 hover:text-sky">Painting & Make-Readies</a>
        <a href="#services" className="block py-1 hover:text-sky">Handyman & Repairs</a>
      </div>
      <div>
        <h2 className="mb-4 text-lg font-bold text-white">Company</h2>
        <a href="#top" className="block py-1 hover:text-sky">Home</a>
        <a href="#about" className="block py-1 hover:text-sky">About Us</a>
        <a href="/residential" className="block py-1 hover:text-sky">Residential</a>
        <a href="/commercial" className="block py-1 hover:text-sky">Commercial</a>
        <a href="#process" className="block py-1 hover:text-sky">How It Works</a>
        <a href="#faq" className="block py-1 hover:text-sky">FAQ</a>
        <a href="#estimate" className="block py-1 hover:text-sky">Membership</a>
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