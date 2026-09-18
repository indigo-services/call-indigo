# Patch 3 — footer restructure + full-page Terms of Service / Privacy Policy modals.
#
# One file, one write. Every hunk is asserted against `src.count(old) == 1` before
# anything is written, because `str.replace` fails silently when its anchor misses
# (and parallel edits to a single file race and lose changes while reporting success).
#
# Run with --dry to print the byte delta per hunk without writing.
import pathlib, sys

BASE = pathlib.Path("C:/tmp/indigo/valvoro-prototype")
P = BASE / "index.html"
src = P.read_text(encoding="utf-8")
before = len(src)
DRY = "--dry" in sys.argv

# ==========================================================================
# HUNK 1 — modal CSS, appended to the components layer
# ==========================================================================
CSS_ANCHOR = "/* ---- Utilities ---- */"

CSS = r'''/* ==========================================================================
   FULL-PAGE LEGAL MODALS — Terms of Service / Privacy Policy
   --------------------------------------------------------------------------
   Same open/close vocabulary as the menu drawer (`#menu-panel` toggles `.open`,
   its scrim toggles `.show`), so the site has one interaction idiom, not two.
   Three deliberate differences from the drawer, each with a reason:

   · The sheet is FULL PAGE — `height: 100%` of the viewport and the full width
     on mobile, capped at 980px and centred from 768px up. The cap is what keeps
     a clickable scrim on desktop; on mobile there is no scrim, so the sticky
     close button and the closing button at the foot of the document carry the
     "easy to close" requirement on their own.
   · `visibility` is delayed by the same .3s as the fade, so the exit animates
     instead of snapping. The drawer gets that for free from its transform; the
     modal has to declare it.
   · The header bar is a flex SIBLING of the scrolling body, not `position:
     sticky`. Pinning it this way does not depend on scroll containment inside a
     transformed ancestor, and the close button is reachable at any scroll depth.
   ========================================================================== */
@layer components {
  .legal { position: fixed; inset: 0; z-index: 60; visibility: hidden; transition: visibility 0s linear .3s; }
  .legal.open { visibility: visible; transition-delay: 0s; }
  .legal-scrim {
    position: absolute; inset: 0; background: rgba(9, 14, 33, .78);
    opacity: 0; transition: opacity .3s;
  }
  .legal.open .legal-scrim { opacity: 1; }
  .legal-sheet {
    position: relative; margin-inline: auto;
    display: flex; flex-direction: column;
    height: 100%; width: 100%; max-width: 980px;
    background: #fff; color: var(--color-body);
    box-shadow: 0 24px 80px rgba(9, 14, 33, .35);
    opacity: 0; transform: translateY(20px);
    transition: opacity .3s, transform .35s cubic-bezier(.7, 0, .2, 1);
  }
  .legal.open .legal-sheet { opacity: 1; transform: none; }

  .legal-bar {
    flex: none; display: flex; align-items: center; gap: 14px;
    padding: 12px clamp(16px, 3vw, 34px);
    background: var(--color-topbar); color: #fff;
  }
  .legal-kicker {
    font-size: 10.5px; font-weight: 700; letter-spacing: .16em;
    text-transform: uppercase; color: var(--color-sky-soft);
  }
  .legal-title { margin-top: 3px; font-size: 17px; font-weight: 700; line-height: 1.2; color: #fff; }
  .legal-x {
    margin-left: auto; flex: none;
    display: inline-flex; align-items: center; justify-content: center;
    width: 44px; height: 44px; border-radius: 10px;
    background: rgba(255, 255, 255, .12); color: #fff;
    font-size: 18px; line-height: 1; cursor: pointer;
    transition: background .2s, color .2s;
  }
  .legal-x:hover { background: var(--color-sky); color: var(--color-topbar); }
  .legal-x:focus-visible { outline: 2px solid var(--color-sky); outline-offset: 2px; }

  .legal-body {
    flex: 1 1 auto; min-height: 0; overflow-y: auto;
    overscroll-behavior: contain;
    padding: clamp(22px, 4vw, 46px) clamp(16px, 3vw, 34px) 0;
  }
  .legal-meta {
    font-size: 12.5px; font-weight: 600; letter-spacing: .02em;
    text-transform: uppercase; color: var(--color-body);
  }
  .legal-note {
    margin-top: 16px; padding: 14px 16px; border-radius: 10px;
    background: var(--color-mist); border: 1px solid var(--color-line);
    font-size: 13px; line-height: 21px;
  }
  .legal-note strong { color: var(--color-ink); font-weight: 700; }
  .legal-body h3 {
    margin-top: 34px; padding-bottom: 8px;
    border-bottom: 1px solid var(--color-line);
    font-size: 17px; font-weight: 700; line-height: 1.3; color: var(--color-ink);
  }
  .legal-body h3:first-of-type { margin-top: 30px; }
  .legal-body p { margin-top: 12px; font-size: 14.5px; line-height: 25px; }
  .legal-body ul { margin-top: 12px; padding-left: 20px; list-style: disc; }
  .legal-body li { margin-top: 7px; font-size: 14.5px; line-height: 25px; }
  .legal-body strong { color: var(--color-ink); font-weight: 700; }
  .legal-body a { color: var(--color-brand); font-weight: 600; }
  .legal-body a:hover { text-decoration: underline; }

  .legal-foot {
    margin-top: 38px; padding: 22px 0 40px;
    border-top: 1px solid var(--color-line);
    display: flex; flex-wrap: wrap; align-items: center; gap: 14px;
  }
  .legal-close {
    display: inline-flex; align-items: center; justify-content: center;
    min-height: 46px; padding: 0 26px; border-radius: 10px;
    background: var(--color-ink-2); color: #fff;
    font-size: 14px; font-weight: 700; cursor: pointer;
    transition: background .2s;
  }
  .legal-close:hover { background: var(--color-brand); }
  .legal-close:focus-visible { outline: 2px solid var(--color-brand); outline-offset: 2px; }
  .legal-foot p { margin: 0; font-size: 13px; }

  /* The footer's two legal triggers sit in a dark slab, so they read as links
     without pretending to be anchors — they are buttons that open a dialog,
     which is also the correct thing for a screen reader to announce. */
  .legal-link {
    font-size: 13px; font-weight: 600; color: rgba(255, 255, 255, .82);
    text-decoration: underline; text-decoration-color: rgba(255, 255, 255, .28);
    text-underline-offset: 4px; cursor: pointer; transition: color .2s;
  }
  .legal-link:hover { color: var(--color-sky); }
  .legal-link:focus-visible { outline: 2px solid var(--color-sky); outline-offset: 3px; border-radius: 3px; }

  @media (prefers-reduced-motion: reduce) {
    .legal, .legal-scrim, .legal-sheet { transition: none; }
    .legal-sheet { opacity: 1; transform: none; }
  }
}

'''

assert src.count(CSS_ANCHOR) == 1, "CSS anchor not unique"
src = src.replace(CSS_ANCHOR, CSS + CSS_ANCHOR)

# ==========================================================================
# HUNK 2 — footer restructure, and HUNK 3 — the two modals
# ==========================================================================
FOOT_START = "  <!-- ======================= FOOTER"
SCRIPT_TAG = '  <script src="js/main.js"></script>'
i = src.index(FOOT_START)
j = src.index(SCRIPT_TAG)
assert src.count(FOOT_START) == 1 and src.count(SCRIPT_TAG) == 1
old_tail = src[i:j]

FOOTER = '''  <!-- ======================= FOOTER ======================= -->
  <!-- Restructured 2026-09-18 to follow v1's own footer shape
       (`call-indigo-com/index.html:353-395` + `call-indigo-com/css/styles.css`):

         .footer        bg = the dark accent, `border-top: 1px solid rgba(255,255,255,.05)`
         .footer-grid   1 column, then `2fr 1fr 1fr 1.5fr` from the lg query
         .footer-brand  logo + one short paragraph, `max-width: 320px`
         .footer-links  "Services" then "Company" — two separate <ul>s
         .footer-contact address + service area + the phone as the accent link
         .footer-bottom `border-top` INSIDE `.container`, flex row space-between

       v2 keeps the slab it already had (v1's `.footer-con.main-box.bg-accent` ->
       `.mbox.slab.bg-ink-2`, style.css:1474/828) and keeps the two things v1 has no
       room for: the licence line and the trust badges.

       Three real changes, not cosmetics:
         · The old "Navigation" column is gone. It listed Services / About Us / How
           It Works / FAQ / Membership and — unlike the header nav — never linked
           Residential or Commercial at all. It is split into the two columns v1
           actually ships, and the full site map now appears in "Company".
         · "Contact Info" and "Service Area" were two columns for one job. Merged
           into "Contact", which is how v1 groups the same facts.
         · The bottom bar's divider moved INSIDE `.shell`. It used to span the whole
           slab, so the rule ran 100px past the text it was separating; v1 puts
           `.footer-bottom` inside `.container` for exactly this reason. -->
  <div class="pad-rl">
    <footer class="mbox slab bg-ink-2 text-[14.5px] text-[#aebdd2]">
    <div class="shell grid gap-10 pb-[74px] pt-[80px] md:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1.5fr] lg:gap-[54px]">
      <div>
        <div class="mb-4 flex items-center gap-2.5">
          <img src="assets/images/call-indigo-mark-dark.svg" alt="Call Indigo logo" class="size-12 w-auto">
          <span class="font-sans text-[23px] font-bold leading-none tracking-[-.02em] text-white">Call Indigo</span>
        </div>
        <p>Licensed, bonded and insured home and facility services. One call covers plumbing, electrical, HVAC, carpentry, painting, and more — done right the first time.</p>
        <p class="mt-3 text-[13px] text-white/60">Indigo Home &amp; Facility Services<br>License: RMP: 45574</p>
        <div class="mt-4 flex gap-3">
          <img src="assets/images/trust-icon1.png" alt="" class="size-11 object-contain">
          <img src="assets/images/trust-icon2.png" alt="" class="size-11 object-contain">
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
        <a href="residential.html" class="block py-1 hover:text-sky">Residential</a>
        <a href="commercial.html" class="block py-1 hover:text-sky">Commercial</a>
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
      <div class="flex flex-col items-center gap-3 border-t border-white/10 py-5 text-center text-[13px] md:flex-row md:justify-between md:text-left">
        <p>© <span id="year"></span> Call Indigo LLC — prototype reconstruction for demo purposes.</p>
        <div class="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
          <span class="text-white/60">Licensed, bonded, and insured.</span>
          <button type="button" class="legal-link" data-legal="terms">Terms of Service</button>
          <button type="button" class="legal-link" data-legal="privacy">Privacy Policy</button>
        </div>
      </div>
    </div>
    </footer>
  </div>'''

# --------------------------------------------------------------------------
MODALS = '''  <!-- ======================= LEGAL MODALS ======================= -->
  <!-- Full-page dialogs, opened by the two `.legal-link` buttons in the footer
       bar above. Deliberately BUTTONS and not `<a href="#terms">`: a control that
       opens a dialog is a button, and an anchor here would also have to be
       rewritten to `index.html#terms` by gen_pages.py — which would send a
       residential.html reader to the home page instead of opening the dialog on
       the page they are already on. `js/main.js` still honours a `#terms` /
       `#privacy` hash on load, so the deep links remain shareable.
       Everything outside `.legal-body` closes: the scrim, the ✕ in the pinned
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
        <p class="legal-note"><strong>Sample language.</strong> This text is placeholder copy written to
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
        <p class="legal-note"><strong>Sample language.</strong> This text is placeholder copy written to
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
        <p>Call Indigo LLC, 1005 Meredith Drive, Austin, TX 78748.<br>
          Phone: <a href="tel:+15126084999">(512) 608-4999</a><br>
          Email: <a href="mailto:support@call-indigo.com">support@call-indigo.com</a></p>

        <div class="legal-foot">
          <button type="button" class="legal-close" data-legal-close>Close</button>
          <p class="text-body">You can also close this window with the ✕ above or the Escape key.</p>
        </div>
      </div>
    </div>
  </div>'''

new_tail = FOOTER + "\n\n" + MODALS + "\n\n"
assert old_tail.endswith("  </div>\n\n"), repr(old_tail[-40:])
src = src[:i] + new_tail + src[j:]

# ==========================================================================
# report / write
# ==========================================================================
print("index.html  %d -> %d bytes  (%+d)" % (before, len(src), len(src) - before))
print("  hunk 1  modal CSS      : +%d bytes" % len(CSS))
print("  hunk 2  footer         : %d -> %d bytes" % (len(old_tail.split("<!-- ======================= FOOTER")[0]) + 0, len(FOOTER)))
print("  hunk 3  legal modals   : +%d bytes" % len(MODALS))
for probe in ['id="legal-terms"', 'id="legal-privacy"', 'data-legal="terms"', 'data-legal="privacy"',
              'lg:grid-cols-[2fr_1fr_1fr_1.5fr]', 'class="legal-link"', 'legal-terms-title',
              'legal-privacy-title', 'data-legal-modal']:
    assert src.count(probe) >= 1, "missing after patch: " + probe
print("  all 9 probes present")
if DRY:
    print("DRY RUN — nothing written")
else:
    P.write_text(src, encoding="utf-8", newline="\n")
    print("WRITTEN", P)
