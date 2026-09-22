/**
 * GENERATED FILE — DO NOT EDIT BY HAND.
 *
 * The shared marketing chrome, sliced out of `valvoro-prototype/index.html`.
 *
 * These are verbatim copies of the prototype markup with only the link shapes
 * changed (this is a single-page app, the prototype is a folder of files):
 *
 *   href="index.html#about"   ->  href="/#about"
 *   href="residential.html"   ->  href="/residential"
 *   src="assets/images/x.jpg" ->  src="/assets/images/x.jpg"
 *
 * `HEADER_TEMPLATE` and `DRAWER_TEMPLATE` each carry a slot where their
 * navigation goes; `chrome.ts` fills it in so the two presentations cannot
 * disagree about a destination or about which page is current.
 */

/* Class strings for the two nav presentations, read out of the markup. */
export const HEADER_ACTIVE_CLASS = "inline-flex h-[42px] items-center rounded-[8px] bg-sky px-[15px] text-[12.5px] font-semibold leading-none text-white xl:text-[15px]"
export const HEADER_PLAIN_CLASS = "text-[12.5px] font-semibold text-ink hover:text-brand xl:text-[15px]"
export const DRAWER_ACTIVE_CLASS = "border-b border-white/10 py-3 text-[22px] font-semibold text-sky hover:pl-2 hover:text-sky"
export const DRAWER_PLAIN_CLASS = "border-b border-white/10 py-3 text-[22px] font-semibold hover:pl-2 hover:text-sky"

/** Where `chrome.ts` injects the header navigation. */
export const HEADER_NAV_SLOT = "__HEADER_NAV__"

/** Where `chrome.ts` injects the drawer navigation. */
export const DRAWER_NAV_SLOT = "__DRAWER_NAV__"

/** The utility bar above the header. */
export const TOPBAR_HTML = `  <div class="pad-rl">
    <!-- The BAR is the background layer and spans the full card width, exactly
         like every \`.slab\` below it. The \`.shell\` inside is the text layer.
         Previously the bar sat inside the \`.shell\`, so the bar ITSELF was
         capped at 1417px: measured at 1920 the bar ran x 251.5..1668.5 while the
         hero slab ran x 50..1870 — 201.5px narrower per side, which is the
         defect this fixes. Its text was inset a further \`pl-[47px] pr-[43px]\`
         from its own edge, landing 47px right of the header brand.
         Now: bar edge = card edge, and \`.mbox\` puts the text on \`--inset\`, the
         same line as the brand and every section heading. -->
    <div class="pill-topbar mbox bg-topbar text-[13px] text-slate-200 max-md:text-[12px]">
      <div class="shell flex h-[43px] items-center justify-between gap-4 max-md:h-auto max-md:flex-wrap max-md:gap-2.5 max-md:py-2.5">
        <div class="flex flex-wrap items-center gap-4 max-md:gap-2.5">
          <span class="inline-flex items-center gap-2 font-semibold text-white">
            <svg class="size-4 text-sky" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>
            Residential &amp; commercial services
          </span>
          <span class="inline-flex items-center gap-2 font-semibold text-white">
            <svg class="size-4 text-sky" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 21s-7-5.5-7-11a7 7 0 1 1 14 0c0 5.5-7 11-7 11z"/><circle cx="12" cy="10" r="2.6"/></svg>
            Hays, Travis, and Williamson counties
          </span>
        </div>
        <div class="flex items-center gap-2.5 max-md:hidden">
          <span>Est. 2012 · Indigo Home &amp; Facility Services</span>
        </div>
      </div>
    </div>
  </div>`

/** Sticky header — carries `HEADER_NAV_SLOT` where its nav belongs. */
export const HEADER_TEMPLATE = `  <header id="top" class="pad-rl sticky top-0 z-40 bg-white/95 py-[25px] shadow-none backdrop-blur transition-shadow max-md:py-[14px] [&.is-scrolled]:shadow-[0_10px_30px_rgba(13,21,49,.08)]">
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
      __HEADER_NAV__

      <!-- Phone: the number text is dropped in the md–lg band so the nav + CTA
           both fit at the reference's 960 canvas; the icon stays tappable. -->
      <a href="tel:+15126084999" class="ml-auto inline-flex shrink-0 items-center gap-[7px] whitespace-nowrap text-[16.5px] font-bold tracking-[-.01em] text-[#081f3f] max-md:[&>span]:hidden md:[&>span]:hidden lg:[&>span]:inline">
        <img src="/assets/images/call-icon.png" alt="" class="size-[22px] object-contain">
        <span>(512) 608-4999</span>
      </a>
      <!-- CTA: only shown when the full nav + phone also fit (lg and up). At md–lg
           the nav is present but the pill is dropped, so the row cannot overflow.
           Sized from the reference: the cyan pill measures 216 x 54 at x1452,
           against the 27px-tall one this file shipped. -->
      <a href="#contact" class="ml-[18px] hidden shrink-0 items-center gap-[7px] whitespace-nowrap rounded-[10px] bg-sky py-[4px] pl-[15px] pr-[4px] text-[12.5px] font-semibold leading-none text-white transition hover:bg-sky-soft lg:inline-flex max-lg:hidden xl:h-[54px] xl:min-w-[216px] xl:justify-center xl:gap-[7px] xl:pl-[26px] xl:pr-[6px] xl:text-[16px] xl:font-bold">
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
  </header>`

/** Off-canvas mobile drawer — carries `DRAWER_NAV_SLOT`. */
export const DRAWER_TEMPLATE = `  <nav id="menu-panel" aria-hidden="true"
    class="fixed inset-y-0 right-0 z-50 flex w-[min(380px,88vw)] translate-x-[105%] flex-col overflow-y-auto bg-ink px-8 pb-10 pt-7 text-white transition-transform duration-[400ms] ease-[cubic-bezier(.7,0,.2,1)] [&.open]:translate-x-0">
    <div class="mb-6 flex items-center justify-between">
      <div class="flex items-center gap-2.5">
        <div class="shrink-0 rounded-full bg-white p-2"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-[#1e1b4b]" aria-hidden="true"><path d="M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384"></path></svg></div>
        <span class="font-sans text-[22px] font-bold leading-none tracking-[-0.06em] text-white">Call Indigo</span>
      </div>
      <button id="menu-close" aria-label="Close menu" class="text-2xl leading-none text-white">✕</button>
    </div>
__DRAWER_NAV__
    <a href="tel:+15126084999" class="mt-6 inline-flex items-center gap-3 font-bold text-sky">
      <img src="/assets/images/call-icon.png" alt="" class="size-5 object-contain"> (512) 608-4999
    </a>
  </nav>
  <div id="menu-backdrop" class="pointer-events-none fixed inset-0 z-40 bg-[rgba(9,14,33,.6)] opacity-0 transition-opacity duration-300 [&.show]:pointer-events-auto [&.show]:opacity-100"></div>`

/** Site footer, including the bottom bar with the legal buttons. */
export const FOOTER_HTML = `  <div class="pad-rl">
    <footer class="mbox slab bg-ink-2 text-[14.5px] text-[#aebdd2]">
    <div class="shell grid gap-8 pb-[46px] pt-[52px] md:grid-cols-2 md:gap-10 md:pb-[74px] md:pt-[80px] lg:grid-cols-[2fr_1fr_1fr_1.5fr] lg:gap-[54px]">
      <div>
        <div class="mb-4 flex items-center gap-2.5">
          <div class="shrink-0 rounded-full bg-white p-2"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-[#1e1b4b]" aria-hidden="true"><path d="M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384"></path></svg></div>
          <span class="font-sans text-[23px] font-bold leading-none tracking-[-0.06em] text-white">Call Indigo</span>
        </div>
        <p>Licensed, bonded and insured home and facility services. One call covers plumbing, electrical, HVAC, carpentry, painting, and more — done right the first time.</p>
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
        <span class="block py-1">1005 Meredith Drive<br>Austin, TX 78748</span>
        <span class="block py-1">Serving Hays, Travis &amp; Williamson counties</span>
        <span class="block py-1 text-white/60">Service area: Austin · Buda · Kyle · San Marcos</span>
      </div>
    </div>
    <div class="shell">
      <div class="flex flex-col items-center gap-3 border-t border-white/10 py-5 text-center text-[13px] lg:flex-row lg:justify-between lg:text-left">
        <p>© <span id="year"></span> Call Indigo LLC — prototype reconstruction for demo purposes.</p>
        <div class="flex flex-col items-center gap-2.5 md:flex-row md:flex-wrap md:justify-center md:gap-x-5 md:gap-y-2">
          <span class="text-white/60">Licensed, bonded, and insured.</span>
          <button type="button" class="legal-link" data-legal="terms">Terms of Service</button>
          <button type="button" class="legal-link" data-legal="privacy">Privacy Policy</button>
        </div>
      </div>
    </div>
    </footer>
  </div>`

/** Terms of Service + Privacy Policy dialogs, driven by `useSiteChrome`. */
export const LEGAL_MODALS_HTML = `  <div id="legal-terms" class="legal" data-legal-modal role="dialog" aria-modal="true"
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
  </div>`
