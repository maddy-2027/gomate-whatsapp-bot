/* ==========================================================================
   GoMate Landing Page – Motion Animations (motion.dev engine)
   Hardware-accelerated animations using Motion (formerly Framer Motion)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  // Check Motion library availability
  if (typeof window.Motion === 'undefined') {
    console.warn('[GoMate Motion] Motion library not detected, skipping animations.');
    return;
  }

  const { animate, inView, stagger, scroll } = window.Motion;

  // Respect user preference for reduced motion
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) {
    return;
  }

  /* ── 1. Top Scroll Progress Indicator ─────────────────────────────────── */
  const progressBar = document.querySelector('.scroll-progress-bar');
  if (progressBar && typeof scroll === 'function') {
    scroll(animate(progressBar, { scaleX: [0, 1] }, { ease: 'linear' }));
  }

  /* ── 2. Hero Entrance Animation ────────────────────────────────────────── */
  const heroBadge = document.querySelector('.hero-badge');
  const heroTitle = document.querySelector('.hero-title');
  const heroSubEn = document.querySelector('.hero-sub-en');
  const heroSubMr = document.querySelector('.hero-sub-mr');
  const equipCards = document.querySelectorAll('.equip-mini-card');
  const heroActions = document.querySelector('.hero-actions');
  const heroOwnerSublink = document.querySelector('.hero-owner-sublink');

  if (heroBadge) {
    animate(heroBadge, { opacity: [0, 1], y: [14, 0] }, { duration: 0.45, ease: [0.16, 1, 0.3, 1] });
  }

  if (heroTitle) {
    animate(heroTitle, { opacity: [0, 1], y: [18, 0] }, { duration: 0.52, delay: 0.08, ease: [0.16, 1, 0.3, 1] });
  }

  if (heroSubEn) {
    animate(heroSubEn, { opacity: [0, 1], y: [14, 0] }, { duration: 0.48, delay: 0.16, ease: [0.16, 1, 0.3, 1] });
  }

  if (heroSubMr) {
    animate(heroSubMr, { opacity: [0, 1], y: [12, 0] }, { duration: 0.48, delay: 0.22, ease: [0.16, 1, 0.3, 1] });
  }

  // Stagger equipment mini cards with subtle spring
  if (equipCards.length > 0) {
    animate(
      equipCards,
      { opacity: [0, 1], x: [-16, 0] },
      { delay: stagger(0.08, { startDelay: 0.28 }), duration: 0.45, ease: [0.25, 1, 0.5, 1] }
    );
  }

  if (heroActions) {
    animate(heroActions, { opacity: [0, 1], y: [14, 0] }, { duration: 0.45, delay: 0.52, ease: [0.16, 1, 0.3, 1] });
  }

  if (heroOwnerSublink) {
    animate(heroOwnerSublink, { opacity: [0, 1] }, { duration: 0.4, delay: 0.62 });
  }

  /* ── 3. Scroll-Triggered Reveals (inView) ──────────────────────────────── */
  // Trust Proof Cards
  const trustSection = document.querySelector('.section-trust');
  const trustCards = document.querySelectorAll('.trust-card');
  if (trustSection && trustCards.length > 0) {
    inView(trustSection, () => {
      animate(
        trustCards,
        { opacity: [0, 1], y: [26, 0] },
        { delay: stagger(0.09), duration: 0.5, ease: [0.16, 1, 0.3, 1] }
      );
    }, { amount: 0.15 });
  }

  // Farmer Testimonial Reviews
  const reviewsSection = document.querySelector('.section-reviews');
  const reviewCards = document.querySelectorAll('.review-card');
  if (reviewsSection && reviewCards.length > 0) {
    inView(reviewsSection, () => {
      animate(
        reviewCards,
        { opacity: [0, 1], y: [22, 0], scale: [0.98, 1] },
        { delay: stagger(0.1), duration: 0.52, ease: [0.16, 1, 0.3, 1] }
      );
    }, { amount: 0.15 });
  }

  // Owner CTA Banner
  const ownerBox = document.querySelector('.owner-box');
  if (ownerBox) {
    inView(ownerBox, () => {
      animate(
        ownerBox,
        { opacity: [0, 1], scale: [0.97, 1] },
        { duration: 0.5, ease: [0.16, 1, 0.3, 1] }
      );
    }, { amount: 0.2 });
  }

  // FAQ Accordion List
  const faqList = document.querySelector('.faq-list');
  const faqItems = document.querySelectorAll('.faq-item');
  if (faqList && faqItems.length > 0) {
    inView(faqList, () => {
      animate(
        faqItems,
        { opacity: [0, 1], y: [16, 0] },
        { delay: stagger(0.08), duration: 0.45, ease: [0.16, 1, 0.3, 1] }
      );
    }, { amount: 0.1 });
  }

  /* ── 4. Tactile Button Micro-Interactions ──────────────────────────────── */
  const interactiveButtons = document.querySelectorAll(
    '.btn-hero-primary, .btn-hero-secondary, .nav-btn-primary, .btn-sticky-wa, .btn-owner-primary, .btn-owner-secondary'
  );

  interactiveButtons.forEach((btn) => {
    btn.addEventListener('pointerdown', () => {
      animate(btn, { scale: 0.96 }, { duration: 0.12, ease: 'easeOut' });
    });

    const resetScale = () => {
      animate(btn, { scale: 1 }, { duration: 0.22, ease: [0.34, 1.56, 0.64, 1] });
    };

    btn.addEventListener('pointerup', resetScale);
    btn.addEventListener('pointerleave', resetScale);
    btn.addEventListener('pointercancel', resetScale);
  });

  // Equip Mini-Card Hover Spring
  equipCards.forEach((card) => {
    card.addEventListener('pointerenter', () => {
      animate(card, { x: 5 }, { duration: 0.2, ease: [0.16, 1, 0.3, 1] });
    });
    card.addEventListener('pointerleave', () => {
      animate(card, { x: 0 }, { duration: 0.22, ease: [0.16, 1, 0.3, 1] });
    });
  });

  /* ── 5. Spring Feedback on Language Tabs ────────────────────────────────── */
  const langTabs = document.querySelectorAll('.lang-tab-btn');
  langTabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      animate(tab, { scale: [0.92, 1.04, 1] }, { duration: 0.28, ease: [0.34, 1.56, 0.64, 1] });
      
      // Gentle page content refresh fade on language switch
      const translatableAreas = document.querySelectorAll('.hero-title, .hero-sub-en, .hero-sub-mr, .equip-mini-title');
      animate(translatableAreas, { opacity: [0.72, 1] }, { duration: 0.25, ease: 'easeOut' });
    });
  });

  /* ── 6. Fluid Spring Physics for FAQ Accordions ───────────────────────── */
  const faqTriggers = document.querySelectorAll('.faq-trigger');
  faqTriggers.forEach((btn) => {
    btn.addEventListener('click', () => {
      const expanded = btn.getAttribute('aria-expanded') === 'true';
      const targetId = btn.getAttribute('aria-controls');
      const panel = document.getElementById(targetId);
      const icon = btn.querySelector('.faq-icon');

      btn.setAttribute('aria-expanded', String(!expanded));

      if (panel) {
        if (!expanded) {
          panel.hidden = false;
          panel.style.overflow = 'hidden';
          panel.style.height = '0px';
          panel.style.opacity = '0';
          
          const targetHeight = panel.scrollHeight + 'px';
          animate(panel, { height: ['0px', targetHeight], opacity: [0, 1] }, {
            duration: 0.32,
            ease: [0.16, 1, 0.3, 1]
          }).then(() => {
            panel.style.height = 'auto';
          });
        } else {
          const currentHeight = panel.scrollHeight + 'px';
          panel.style.overflow = 'hidden';
          animate(panel, { height: [currentHeight, '0px'], opacity: [1, 0] }, {
            duration: 0.25,
            ease: [0.16, 1, 0.3, 1]
          }).then(() => {
            panel.hidden = true;
          });
        }
      }

      if (icon) {
        animate(icon, { rotate: [expanded ? -45 : 45, 0] }, { duration: 0.25 });
        icon.textContent = expanded ? '+' : '−';
      }
    });
  });
});
