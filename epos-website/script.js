document.addEventListener('DOMContentLoaded', () => {

  /* ===== 0. Scrim for drawer ===== */
  const scrim = document.createElement('div');
  scrim.className = 'menu-scrim';
  document.body.appendChild(scrim);

  /* ===== 1. Sticky header shrink ===== */
  const header = document.getElementById('site-header');
  if (header) {
    window.addEventListener('scroll', () => {
      header.classList.toggle('is-scrolled', window.scrollY > 60);
    }, { passive: true });
  }

  /* ===== 2. Fullscreen menu + flyout submenus ===== */
  const menuOpen    = document.getElementById('menu-open');
  const menuClose   = document.getElementById('menu-close');
  const menuOverlay = document.getElementById('fullscreen-menu');
  const subBtns     = document.querySelectorAll('.has-submenu');
  const subCols     = document.querySelectorAll('.menu-sub-col');

  if (menuOpen && menuClose && menuOverlay) {
    function openMenu() {
      menuOverlay.classList.add('is-open');
      menuOverlay.setAttribute('aria-hidden', 'false');
      menuOpen.setAttribute('aria-expanded', 'true');
      document.body.classList.add('menu-is-open');
      menuClose.focus();
    }

    const mainCol = menuOverlay.querySelector('.menu-main-col');

    function closeMenu() {
      menuOverlay.classList.remove('is-open');
      menuOverlay.setAttribute('aria-hidden', 'true');
      menuOpen.setAttribute('aria-expanded', 'false');
      document.body.classList.remove('menu-is-open');
      subCols.forEach(s => { s.classList.remove('is-open'); s.setAttribute('aria-hidden', 'true'); });
      subBtns.forEach(b => b.setAttribute('aria-expanded', 'false'));
      if (mainCol) mainCol.classList.remove('submenu-active');
      menuOpen.focus();
    }

    menuOpen.addEventListener('click', openMenu);
    menuClose.addEventListener('click', closeMenu);
    scrim.addEventListener('click', closeMenu);
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && menuOverlay.classList.contains('is-open')) closeMenu();
    });

    document.querySelectorAll('.submenu-back').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-close-submenu');
        const col = document.getElementById(id);
        if (col) { col.classList.remove('is-open'); col.setAttribute('aria-hidden', 'true'); }
        const trigger = document.querySelector(`[aria-controls="${id}"]`);
        if (trigger) trigger.setAttribute('aria-expanded', 'false');
        if (mainCol) mainCol.classList.remove('submenu-active');
      });
    });

    subBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetId  = btn.getAttribute('aria-controls');
        const target    = document.getElementById(targetId);
        const isExpanded = btn.getAttribute('aria-expanded') === 'true';

        /* Close all other submenus */
        subCols.forEach(s => { if (s !== target) { s.classList.remove('is-open'); s.setAttribute('aria-hidden', 'true'); } });
        subBtns.forEach(b => { if (b !== btn) b.setAttribute('aria-expanded', 'false'); });

        if (isExpanded) {
          target.classList.remove('is-open');
          target.setAttribute('aria-hidden', 'true');
          btn.setAttribute('aria-expanded', 'false');
          if (mainCol) mainCol.classList.remove('submenu-active');
        } else {
          target.classList.add('is-open');
          target.setAttribute('aria-hidden', 'false');
          btn.setAttribute('aria-expanded', 'true');
          if (mainCol) mainCol.classList.add('submenu-active');
        }
      });
    });
  }

  /* ===== 3. Scroll reveals (IntersectionObserver) ===== */
  const reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && reveals.length) {
    const obs = new IntersectionObserver((entries, o) => {
      entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('is-visible'); o.unobserve(e.target); }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
    reveals.forEach(el => obs.observe(el));
  } else {
    reveals.forEach(el => el.classList.add('is-visible'));
  }

  /* ===== 4. Floating CTA bubble ===== */
  const floatingCta = document.getElementById('floating-cta');
  const closeCtaBtn = document.getElementById('close-cta');
  if (floatingCta && closeCtaBtn) {
    if (!sessionStorage.getItem('ctaClosed')) {
      setTimeout(() => { floatingCta.classList.add('is-visible'); floatingCta.setAttribute('aria-hidden', 'false'); }, 2000);
    }
    closeCtaBtn.addEventListener('click', () => {
      floatingCta.classList.remove('is-visible');
      sessionStorage.setItem('ctaClosed', 'true');
    });
  }

  /* ===== 5. Cookie banner + video consent ===== */
  const cookieBanner = document.getElementById('cookie-banner');
  const btnAccept    = document.getElementById('cookie-accept');
  const btnReject    = document.getElementById('cookie-reject');

  function loadConsentedContent() {
    document.querySelectorAll('[data-consent="video"]').forEach(el => {
      const src = el.dataset.src;
      el.innerHTML = src
        ? `<iframe src="${src}" frameborder="0" allowfullscreen allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" style="position:absolute;inset:0;width:100%;height:100%;"></iframe>`
        : `<div style="background:var(--color-primary);color:#fff;width:100%;height:100%;display:flex;align-items:center;justify-content:center;border-radius:var(--radius-lg);">Video klar til indlejring</div>`;
    });
  }

  if (cookieBanner) {
    const stored = localStorage.getItem('cookieConsent');
    if (!stored) {
      setTimeout(() => { cookieBanner.classList.add('is-visible'); cookieBanner.setAttribute('aria-hidden', 'false'); }, 800);
    } else if (stored === 'accepted') {
      loadConsentedContent();
    }

    btnAccept && btnAccept.addEventListener('click', () => {
      localStorage.setItem('cookieConsent', 'accepted');
      cookieBanner.classList.remove('is-visible');
      loadConsentedContent();
    });
    btnReject && btnReject.addEventListener('click', () => {
      localStorage.setItem('cookieConsent', 'rejected');
      cookieBanner.classList.remove('is-visible');
    });
  }

  /* ===== 6. FAQ accordion ===== */
  document.querySelectorAll('.faq-question').forEach(btn => {
    btn.addEventListener('click', () => {
      const item    = btn.closest('.faq-item');
      const wasOpen = item.classList.contains('is-open');
      document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('is-open'));
      if (!wasOpen) item.classList.add('is-open');
    });
  });

  /* ===== 7. Newsletter form (client-side validation only) ===== */
  document.querySelectorAll('.newsletter-form').forEach(form => {
    form.addEventListener('submit', e => {
      e.preventDefault();
      const input = form.querySelector('input[type="email"]');
      if (input && input.value) {
        input.value = '';
        const msg = document.createElement('p');
        msg.style.cssText = 'color:var(--color-primary);font-weight:600;margin-top:.75rem;';
        msg.textContent = 'Tak! Du er nu tilmeldt vores nyhedsbrev.';
        form.appendChild(msg);
        setTimeout(() => msg.remove(), 5000);
      }
    });
  });

  /* ===== 8. Contact form (client-side only, action = placeholder) ===== */
  const contactForm = document.getElementById('contact-form');
  if (contactForm) {
    contactForm.addEventListener('submit', e => {
      e.preventDefault();
      const btn = contactForm.querySelector('button[type="submit"]');
      btn.textContent = 'Besked sendt ✓';
      btn.disabled = true;
    });
  }

});
