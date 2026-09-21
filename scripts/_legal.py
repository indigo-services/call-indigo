"""Correct the Privacy Policy where it describes things the site does not do.

The client asked for the old site's legal pages. That site has no Terms page and its
Privacy Policy is unedited WordPress boilerplate, so it cannot be the source. What CAN
be fixed without a lawyer is the same class of defect in our own copy: statements that
are demonstrably false about this build.

Audited against the code, 2026-09-20:

  1. "service address" — the inquiry form collects name, phone, email, property type,
     service, urgency and message. `Inquiry` in src/lib/data/types.ts has NO address
     field, and no form input is named for one.                    -> claim is FALSE
  2. "We collect automatically: IP address, browser and device type, the pages you
     view, and how you arrived at the site." — there is no analytics, advertising or
     tracking script anywhere in src/ or index.html.               -> claim is FALSE
  3. "Improve our site" — nothing measures the site.               -> unsupported
  4. "software providers who host our scheduling, payment, and email tools" — no
     scheduling or payment integration exists in rc1.             -> unsupported
  5. "This site uses cookies ... to understand which pages are useful" — the public
     site sets NO cookie at all. The only cookie in the codebase is shadcn's
     `sidebar_state`, written by src/components/ui/sidebar.tsx on /admin. -> FALSE
  6. "you agree that we may contact you ... including by text message ... reply STOP"
     — the form carries no SMS or marketing consent; its own text says "We use your
     details only to answer this request." The policy contradicts the form, and
     asserting blanket marketing consent the form never obtained is a TCPA exposure.
                                                                  -> CONTRADICTION

The "Sample language — not legal advice" warning is deliberately KEPT: these are
correctness fixes, not a legal review, and removing the warning would make unreviewed
text look reviewed.

The legal copy is duplicated four times — `chrome-markup.ts` (which serves /contact
through the chrome.ts seam) plus an inline copy on each of the three mirror pages — so
every replacement asserts its count per file and fails loudly otherwise.

`newline="\\n"` is required: without it `write_text` translates every `\\n` to
`os.linesep` on Windows and flips the whole file LF -> CRLF.
"""
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
TARGETS = [
    ROOT / "src" / "marketing" / "chrome-markup.ts",
    ROOT / "src" / "marketing" / "pages" / "HomePage.tsx",
    ROOT / "src" / "marketing" / "pages" / "ResidentialPage.tsx",
    ROOT / "src" / "marketing" / "pages" / "CommercialPage.tsx",
]

REPLACEMENTS = [
    (
        "you give us — drop the address the form never asks for",
        """          <li><strong>You give us:</strong> name, phone number, email address, service address, property
            type, and the description of the work you need.</li>""",
        """          <li><strong>You give us:</strong> your name, phone number, and email address, whether the
            property is residential or commercial, the service you need, how soon you need it, and your
            description of the work.</li>""",
    ),
    (
        "automatic collection — there is no analytics",
        """          <li><strong>We collect automatically:</strong> IP address, browser and device type, the pages
            you view, and how you arrived at the site.</li>""",
        """          <li><strong>Our hosting provider logs:</strong> the IP address, browser type, and pages
            requested in standard server logs, which are kept for security and to keep the site running.
            This site runs no analytics, advertising, or third-party tracking scripts.</li>""",
    ),
    (
        "how we use it — nothing measures the site",
        """          <li>Improve our site, services, and crew routing.</li>""",
        """          <li>Improve our services and how we route crews.</li>""",
    ),
    (
        "sharing — no scheduling or payment integration exists",
        """          the crews and trade partners assigned to your job, with software providers who host our
          scheduling, payment, and email tools, and with insurers, auditors, or authorities when the law
          requires it. Vendors are expected to protect your information and to use it only for the service
          they provide to us.</p>""",
        """          the crews and trade partners assigned to your job, with the software providers who host our
          website, email, and record-keeping tools, and with insurers, auditors, or authorities when the
          law requires it. Vendors are expected to protect your information and to use it only for the
          service they provide to us.</p>""",
    ),
    (
        "cookies — the public site sets none",
        """        <h3>5. Cookies and Analytics</h3>
        <p>This site uses cookies and similar technologies to remember your preferences and to understand
          which pages are useful. You can block or delete cookies in your browser settings; some parts of
          the site may work less smoothly if you do.</p>""",
        """        <h3>5. Cookies and Analytics</h3>
        <p>This public site sets no cookies and runs no analytics, advertising, or third-party tracking
          scripts. Our private admin dashboard sets a single cookie recording whether its sidebar is open;
          it carries no personal information and is not used to track you. You can block or delete cookies
          in your browser settings at any time.</p>""",
    ),
    (
        "calls and texts — match what the form actually says",
        """        <h3>6. Calls, Texts, and Email</h3>
        <p>When you give us your phone number or email address, you agree that we may contact you about
          your request, your appointment, and your account, including by text message. Message and data
          rates may apply. You can opt out of marketing messages at any time by replying STOP to a text,
          using the unsubscribe link in an email, or calling us. You may still receive messages about an
          active job or an unpaid invoice.</p>""",
        """        <h3>6. Calls, Texts, and Email</h3>
        <p>We use the contact details you give us to answer your request and to arrange the work — that is
          what the form promises, and it is all we do with them. We do not add you to a marketing list,
          and we do not send marketing texts or emails on the basis of that form. If we ever want to send
          you a marketing message, we will ask for your consent separately first. You can ask us to stop
          contacting you at any time using the details below.</p>""",
    ),
]

failures = []
for path in TARGETS:
    src = path.read_text(encoding="utf-8")
    applied = 0
    for name, old, new in REPLACEMENTS:
        n = src.count(old)
        if n != 1:
            failures.append("%s: %s — expected 1 occurrence, found %d" % (path.name, name, n))
            continue
        src = src.replace(old, new)
        applied += 1
    if applied == len(REPLACEMENTS):
        path.write_text(src, encoding="utf-8", newline="\n")
    print("%-24s %d/%d corrections applied" % (path.name, applied, len(REPLACEMENTS)))

for f in failures:
    print("  FAIL " + f)
sys.exit(1 if failures else 0)
