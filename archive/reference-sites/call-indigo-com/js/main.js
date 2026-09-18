/**
 * Call Indigo - Main JavaScript
 * Interactions: mobile nav, smooth scroll, scroll animations, active nav
 */

(function () {
  'use strict';

  // ============================================
  // DOM Elements
  // ============================================
  const navbar = document.getElementById('navbar');
  const mobileMenuBtn = document.getElementById('mobileMenuBtn');
  const mobileNav = document.getElementById('mobileNav');
  const navLinks = document.querySelectorAll('.nav-links a, .mobile-nav a');
  const revealElements = document.querySelectorAll('.reveal');
  const sections = document.querySelectorAll('section[id]');

  // ============================================
  // Mobile Navigation Toggle
  // ============================================
  function toggleMobileMenu() {
    const isOpen = mobileMenuBtn.classList.toggle('active');
    mobileNav.classList.toggle('active', isOpen);
    document.body.style.overflow = isOpen ? 'hidden' : '';
  }

  function closeMobileMenu() {
    mobileMenuBtn.classList.remove('active');
    mobileNav.classList.remove('active');
    document.body.style.overflow = '';
  }

  if (mobileMenuBtn) {
    mobileMenuBtn.addEventListener('click', toggleMobileMenu);
  }

  // Close mobile menu when clicking a link
  document.querySelectorAll('.mobile-nav a').forEach(link => {
    link.addEventListener('click', closeMobileMenu);
  });

  // Close mobile menu on outside click
  document.addEventListener('click', (e) => {
    if (
      mobileNav &&
      mobileNav.classList.contains('active') &&
      !mobileNav.contains(e.target) &&
      !mobileMenuBtn.contains(e.target)
    ) {
      closeMobileMenu();
    }
  });

  // Close mobile menu on escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && mobileNav && mobileNav.classList.contains('active')) {
      closeMobileMenu();
    }
  });

  // ============================================
  // Navbar Scroll Effect
  // ============================================
  let lastScrollY = window.scrollY;

  function handleNavbarScroll() {
    const currentScrollY = window.scrollY;

    // Add/remove scrolled class
    if (currentScrollY > 50) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }

    lastScrollY = currentScrollY;
  }

  window.addEventListener('scroll', handleNavbarScroll, { passive: true });
  handleNavbarScroll(); // Initial check

  // ============================================
  // Smooth Scroll for Anchor Links
  // ============================================
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const href = this.getAttribute('href');
      if (href === '#') return;

      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        const topBar = document.querySelector('.top-bar');
        const headerHeight = (topBar ? topBar.offsetHeight : 0) + (navbar ? navbar.offsetHeight : 0);
        const targetPosition = target.getBoundingClientRect().top + window.scrollY - headerHeight;

        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth'
        });
      }
    });
  });

  // ============================================
  // Scroll-Triggered Reveal Animations
  // ============================================
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          // Optionally unobserve after revealing
          // revealObserver.unobserve(entry.target);
        }
      });
    },
    {
      root: null,
      rootMargin: '0px 0px -60px 0px',
      threshold: 0.1
    }
  );

  revealElements.forEach(el => revealObserver.observe(el));

  // ============================================
  // Active Navigation Link Highlighting
  // ============================================
  const sectionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const id = entry.target.getAttribute('id');
          navLinks.forEach(link => {
            link.classList.toggle('active', link.getAttribute('href') === '#' + id);
          });
        }
      });
    },
    {
      root: null,
      rootMargin: '-50% 0px -50% 0px',
      threshold: 0
    }
  );

  sections.forEach(section => sectionObserver.observe(section));

  // ============================================
  // Stats Counter Animation
  // ============================================
  const statNumbers = document.querySelectorAll('.stat-number');
  let statsAnimated = false;

  function animateStats() {
    if (statsAnimated) return;

    const statsSection = document.querySelector('.stats');
    if (!statsSection) return;

    const rect = statsSection.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      statsAnimated = true;

      statNumbers.forEach(stat => {
        const text = stat.textContent.trim();
        const hasPlus = text.includes('+');
        const hasPercent = text.includes('%');
        const hasK = text.includes('K');
        const numMatch = text.match(/[\d,]+/);

        if (!numMatch) return;

        let targetStr = numMatch[0].replace(/,/g, '');
        let target = parseInt(targetStr, 10);
        let suffix = '';

        if (hasK) {
          target = target;
          suffix = 'K+';
        } else if (hasPercent) {
          suffix = '%';
        } else if (hasPlus) {
          suffix = '+';
        }

        // Skip animation for year (2012)
        if (target > 2000 && target < 2100) {
          return;
        }

        const duration = 2000;
        const start = performance.now();
        const startValue = 0;

        function updateCounter(currentTime) {
          const elapsed = currentTime - start;
          const progress = Math.min(elapsed / duration, 1);

          // Ease out cubic
          const easeProgress = 1 - Math.pow(1 - progress, 3);
          const current = Math.floor(startValue + (target - startValue) * easeProgress);

          let display = current.toLocaleString();
          if (hasK && current >= 1000) {
            display = (current / 1000).toFixed(0) + 'K';
            if (hasPlus) display += '+';
          } else {
            display = current.toLocaleString() + suffix;
          }

          // Preserve the span wrapper for styling
          stat.innerHTML = display.replace(/(\d[\d,]*)/, '<span>$1</span>');
          if (suffix && !hasK) {
            stat.innerHTML = stat.innerHTML.replace(/<\/span>$/, '</span>') + suffix.replace(/[+<]/g, '');
            // Re-apply properly
            const numPart = current.toLocaleString();
            const extra = suffix.replace(/[\d]/g, '');
            stat.innerHTML = numPart + '<span>' + extra + '</span>';
          }

          if (progress < 1) {
            requestAnimationFrame(updateCounter);
          } else {
            // Final value - restore original formatting
            if (hasK) {
              stat.innerHTML = target + 'K<span>+</span>';
            } else if (hasPercent) {
              stat.innerHTML = target + '<span>%</span>';
            } else if (hasPlus) {
              stat.innerHTML = target.toLocaleString() + '<span>+</span>';
            } else {
              stat.textContent = target.toLocaleString();
            }
          }
        }

        requestAnimationFrame(updateCounter);
      });
    }
  }

  window.addEventListener('scroll', animateStats, { passive: true });
  animateStats(); // Check on load

  // ============================================
  // Button Ripple Effect
  // ============================================
  document.querySelectorAll('.btn').forEach(btn => {
    btn.addEventListener('click', function (e) {
      const rect = this.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const ripple = document.createElement('span');
      ripple.style.cssText = `
        position: absolute;
        background: rgba(255, 255, 255, 0.3);
        border-radius: 50%;
        pointer-events: none;
        transform: scale(0);
        animation: ripple-effect 0.6s ease-out;
        left: ${x}px;
        top: ${y}px;
        width: 20px;
        height: 20px;
        margin-left: -10px;
        margin-top: -10px;
      `;

      this.style.position = 'relative';
      this.style.overflow = 'hidden';
      this.appendChild(ripple);

      setTimeout(() => ripple.remove(), 600);
    });
  });

  // Add ripple keyframes dynamically
  const rippleStyle = document.createElement('style');
  rippleStyle.textContent = `
    @keyframes ripple-effect {
      to {
        transform: scale(20);
        opacity: 0;
      }
    }
  `;
  document.head.appendChild(rippleStyle);

  // ============================================
  // Parallax Effect for Hero Background
  // ============================================
  const hero = document.querySelector('.hero');
  const heroBg = document.querySelector('.hero-bg');

  if (hero && heroBg) {
    window.addEventListener('scroll', () => {
      const scrolled = window.scrollY;
      const rate = scrolled * 0.3;
      if (scrolled < hero.offsetHeight) {
        heroBg.style.transform = `translateY(${rate}px)`;
      }
    }, { passive: true });
  }

  // ============================================
  // Service Card Hover Tilt (desktop only)
  // ============================================
  if (window.matchMedia('(pointer: fine)').matches) {
    document.querySelectorAll('.service-card, .membership-card, .why-choose-card').forEach(card => {
      card.addEventListener('mousemove', function (e) {
        const rect = this.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const rotateX = (y - centerY) / 20;
        const rotateY = (centerX - x) / 20;

        this.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)`;
      });

      card.addEventListener('mouseleave', function () {
        this.style.transform = '';
      });
    });
  }

  // ============================================
  // Focus visible for accessibility
  // ============================================
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      document.body.classList.add('user-is-tabbing');
    }
  });

  document.addEventListener('mousedown', () => {
    document.body.classList.remove('user-is-tabbing');
  });

  // Add focus styles dynamically
  const focusStyle = document.createElement('style');
  focusStyle.textContent = `
    body:not(.user-is-tabbing) *:focus {
      outline: none;
    }
    body.user-is-tabbing *:focus {
      outline: 2px solid var(--color-accent);
      outline-offset: 2px;
    }
  `;
  document.head.appendChild(focusStyle);

  console.log('Call Indigo site initialized');
})();
