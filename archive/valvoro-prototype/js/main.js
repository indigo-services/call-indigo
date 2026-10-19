// Call Indigo prototype interactions
(function () {
  'use strict';

  /* ---------- Footer year ---------- */
  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- Sticky header shadow ---------- */
  var header = document.getElementById('top');
  function onScroll() {
    if (header) header.classList.toggle('is-scrolled', window.scrollY > 8);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Scroll lock ----------
     Two independent layers can be open (the menu drawer and a legal modal), so the
     body lock is derived from their state instead of being set and cleared by each
     one. Previously the drawer wrote `document.body.style.overflow` directly, which
     would have unlocked the page as soon as either layer closed. */
  var panel = document.getElementById('menu-panel');
  var legalModals = Array.prototype.slice.call(document.querySelectorAll('[data-legal-modal]'));

  function syncScrollLock() {
    var locked = (panel && panel.classList.contains('open')) ||
      legalModals.some(function (m) { return m.classList.contains('open'); });
    document.body.style.overflow = locked ? 'hidden' : '';
  }

  /* ---------- Menu drawer (hamburger) ---------- */
  var burger = document.getElementById('burger');
  var backdrop = document.getElementById('menu-backdrop');
  var closeBtn = document.getElementById('menu-close');

  function setMenu(open) {
    if (!panel) return;
    panel.classList.toggle('open', open);
    panel.setAttribute('aria-hidden', String(!open));
    if (backdrop) backdrop.classList.toggle('show', open);
    if (burger) {
      burger.setAttribute('aria-expanded', String(open));
    }
    syncScrollLock();
  }

  if (burger) burger.addEventListener('click', function () { setMenu(!panel.classList.contains('open')); });
  if (closeBtn) closeBtn.addEventListener('click', function () { setMenu(false); });
  if (backdrop) backdrop.addEventListener('click', function () { setMenu(false); });
  if (panel) {
    panel.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') setMenu(false);
    });
  }

  /* ---------- Full-page legal modals (Terms of Service / Privacy Policy) ----------
     Opened by `[data-legal="terms|privacy"]` in the footer bar. Closing is
     deliberately over-supplied, because a full-page sheet has no visible chrome to
     tell you how to get out: the ✕ in the pinned bar, the scrim on desktop, the
     button at the foot of the document, and Escape all close it.

     Delegated from `document` rather than bound per element, so the same script
     works on residential.html and commercial.html, where the modal markup arrives
     by being sliced out of index.html by gen_pages.py. */
  var lastLegalTrigger = null;

  function openLegal(id, trigger) {
    var modal = document.getElementById(id);
    if (!modal) return;
    legalModals.forEach(function (m) {
      var on = m === modal;
      m.classList.toggle('open', on);
      m.setAttribute('aria-hidden', String(!on));
      if (on) {
        var body = m.querySelector('.legal-body');
        if (body) body.scrollTop = 0;   // always reopen at the top, not where you left off
      }
    });
    lastLegalTrigger = trigger || null;
    syncScrollLock();
    var x = modal.querySelector('[data-legal-x]');
    // preventScroll: `html { scroll-behavior: smooth }` would otherwise animate the
    // page behind the modal while it is trying to lock.
    if (x) x.focus({ preventScroll: true });
  }

  function closeLegal() {
    var wasOpen = legalModals.some(function (m) { return m.classList.contains('open'); });
    if (!wasOpen) return;
    legalModals.forEach(function (m) {
      m.classList.remove('open');
      m.setAttribute('aria-hidden', 'true');
    });
    syncScrollLock();
    if (lastLegalTrigger && document.contains(lastLegalTrigger)) {
      lastLegalTrigger.focus({ preventScroll: true });
    }
    lastLegalTrigger = null;
    // Drop a #terms / #privacy deep link so a reload does not reopen the dialog.
    if (LEGAL_HASHES[location.hash]) {
      history.replaceState(null, '', location.pathname + location.search);
    }
  }

  // Deep links: #terms, #privacy, and the modal ids themselves all resolve.
  var LEGAL_HASHES = {
    '#terms': 'legal-terms',
    '#privacy': 'legal-privacy',
    '#legal-terms': 'legal-terms',
    '#legal-privacy': 'legal-privacy'
  };

  document.addEventListener('click', function (e) {
    var el = e.target;
    if (!el || !el.closest) return;
    var trigger = el.closest('[data-legal]');
    if (trigger) {
      e.preventDefault();
      openLegal('legal-' + trigger.getAttribute('data-legal'), trigger);
      return;
    }
    if (el.closest('[data-legal-close]')) {
      e.preventDefault();
      closeLegal();
    }
  });

  document.addEventListener('keydown', function (e) {
    var open = legalModals.filter(function (m) { return m.classList.contains('open'); })[0];
    if (!open) {
      if (e.key === 'Escape') setMenu(false);
      return;
    }
    if (e.key === 'Escape') { closeLegal(); return; }
    if (e.key !== 'Tab') return;
    // Keep Tab inside the dialog while it is open.
    var f = open.querySelectorAll('a[href], button:not([disabled])');
    if (!f.length) return;
    var first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault(); last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault(); first.focus();
    }
  });

  window.addEventListener('hashchange', function () {
    var id = LEGAL_HASHES[location.hash];
    if (id) { openLegal(id, null); } else { closeLegal(); }
  });

  if (LEGAL_HASHES[location.hash]) openLegal(LEGAL_HASHES[location.hash], null);

  /* ---------- Reveal on scroll ---------- */
  var revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('visible'); });
  }

  /* ---------- Service-area availability check ---------- */
  var zipForm = document.getElementById('zip-form');
  if (zipForm) {
    zipForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var input = document.getElementById('zip-input');
      var result = document.getElementById('zip-result');
      if (!input || !result) return;
      if (input.value.trim().length >= 3) {
        result.hidden = false;
      }
    });
  }
})();
