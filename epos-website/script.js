/* ==========================================================================
   Efterskolen Epos — script.js

   Barba-ready structure:
   - initGlobal()  runs ONCE ever. Holds things that persist across pages
                   (drawer scrim, sticky header, menu, floating CTA, cookie
                   banner). Guarded so it can never bind twice.
   - initPage()    runs on every page load, and is safe to call AGAIN after a
                   future client-side page swap. Holds everything tied to the
                   page content (scroll reveals, videos, FAQ, forms, the
                   profile-card transition, the reveal cover).

   Today both run once on DOMContentLoaded. When/if we adopt Barba.js later,
   leave initGlobal() on first load and call initPage() inside
   barba.hooks.after() after each swap — that's the whole switch.
   ========================================================================== */

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* TODO: indsæt endpoint (Formspree/Brevo/mail-script). Så længe den er tom,
   viser formularerne en ærlig "ikke aktiv endnu"-besked i stedet for at sende. */
const FORM_ENDPOINT = "";

const FORM_INACTIVE_MSG = 'Formularen er ikke aktiv endnu — skriv til os på kontor@epos-efterskole.dk.';
const FORM_ERROR_MSG    = 'Noget gik galt under afsendelsen — prøv igen, eller skriv til kontor@epos-efterskole.dk.';

function showFormMessage(form, text) {
  let msg = form.querySelector('.form-msg');
  if (!msg) {
    msg = document.createElement('p');
    msg.className = 'form-msg';
    msg.style.cssText = 'color:var(--color-accent);font-weight:600;margin-top:.75rem;';
    msg.setAttribute('role', 'status');
    form.appendChild(msg);
  }
  msg.textContent = text;
}

/* Render any consent-gated videos (shared by the cookie buttons and initPage) */

/* Only YouTube embeds are allowed; youtube-nocookie.com foretrækkes af privatlivshensyn */
function safeVideoUrl(src) {
  if (!src) return null;
  try {
    const url = new URL(src, window.location.origin);
    if (url.protocol !== 'https:') return null;
    if (url.hostname === 'www.youtube-nocookie.com') return url.href;
    if (url.hostname === 'www.youtube.com') {
      /* Foretræk nocookie-varianten af samme embed */
      url.hostname = 'www.youtube-nocookie.com';
      return url.href;
    }
    return null;
  } catch (e) {
    return null;
  }
}

function loadConsentedContent() {
  document.querySelectorAll('[data-consent="video"]').forEach(el => {
    const src = safeVideoUrl(el.dataset.src);
    el.textContent = '';
    if (src) {
      const iframe = document.createElement('iframe');
      iframe.setAttribute('src', src);
      iframe.setAttribute('frameborder', '0');
      iframe.setAttribute('allowfullscreen', '');
      iframe.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture');
      iframe.setAttribute('loading', 'lazy');
      iframe.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
      iframe.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;';
      el.appendChild(iframe);
    } else {
      const placeholder = document.createElement('div');
      placeholder.style.cssText = 'background:var(--color-primary);color:#fff;width:100%;height:100%;display:flex;align-items:center;justify-content:center;border-radius:var(--radius-lg);';
      placeholder.textContent = 'Video klar til indlejring';
      el.appendChild(placeholder);
    }
  });
}

/* ==========================================================================
   SMOOTH SCROLL (Lenis) + PARALLAX DEPTH
   ========================================================================== */
/* Native scrolling — no Lenis. `lenis` stays null so all `if (lenis)` guards
   simply fall through to the browser's default scroll behaviour. */
let lenis = null;

function initSmoothScroll() {
  /* In-page anchor links: native jump with an offset for the sticky header. */
  document.addEventListener('click', e => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const sel = a.getAttribute('href');
    if (sel.length < 2) return;
    const target = document.querySelector(sel);
    if (!target) return;
    e.preventDefault();
    const top = target.getBoundingClientRect().top + window.scrollY - 90;
    window.scrollTo({ top, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
  });
}

let parallaxItems = [];
function refreshParallax() {
  if (prefersReducedMotion) return;
  parallaxItems = [...document.querySelectorAll('[data-parallax], .page-hero-blob')].map(el => {
    el.style.setProperty('--py', '0px');
    const r = el.getBoundingClientRect();
    const speed = el.dataset.parallax !== undefined
      ? parseFloat(el.dataset.parallax)
      : -0.12; /* default for .page-hero-blob */
    return { el, base: r.top + window.scrollY + r.height / 2, speed };
  });
}
function startParallax() {
  if (prefersReducedMotion || window.__parallaxStarted) return;
  window.__parallaxStarted = true;
  const tick = () => {
    const vCenter = window.scrollY + window.innerHeight / 2;
    for (const it of parallaxItems) {
      it.el.style.setProperty('--py', ((vCenter - it.base) * it.speed).toFixed(1) + 'px');
    }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
  let rt;
  window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(refreshParallax, 150); }, { passive: true });
}

/* ==========================================================================
   ONE-TIME GLOBAL SETUP (persists across pages)
   ========================================================================== */
let globalReady = false;
function initGlobal() {
  if (globalReady) return;
  globalReady = true;

  /* ----- Scrim for drawer ----- */
  const scrim = document.createElement('div');
  scrim.className = 'menu-scrim';
  document.body.appendChild(scrim);

  /* ----- Sticky header shrink ----- */
  const header = document.getElementById('site-header');
  if (header) {
    window.addEventListener('scroll', () => {
      header.classList.toggle('is-scrolled', window.scrollY > 60);
    }, { passive: true });
  }

  /* ----- Fullscreen menu + flyout submenus ----- */
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
      if (lenis) lenis.stop();
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
      if (lenis) lenis.start();
      menuOpen.focus();
    }

    menuOpen.addEventListener('click', openMenu);
    menuClose.addEventListener('click', closeMenu);
    scrim.addEventListener('click', closeMenu);
    document.addEventListener('keydown', e => {
      if (!menuOverlay.classList.contains('is-open')) return;
      if (e.key === 'Escape') { closeMenu(); return; }

      /* Focus-trap: hold Tab/Shift+Tab inden for den åbne menu */
      if (e.key !== 'Tab') return;
      const focusables = [...menuOverlay.querySelectorAll('a[href], button:not([disabled])')]
        .filter(el => !el.closest('[aria-hidden="true"]'));
      if (!focusables.length) return;
      const first = focusables[0];
      const last  = focusables[focusables.length - 1];
      const active = document.activeElement;
      if (e.shiftKey) {
        if (active === first || !menuOverlay.contains(active)) { e.preventDefault(); last.focus(); }
      } else {
        if (active === last || !menuOverlay.contains(active)) { e.preventDefault(); first.focus(); }
      }
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

  /* ----- Floating CTA bubble ----- */
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

  /* ----- Cookie banner (buttons + initial show) ----- */
  const cookieBanner = document.getElementById('cookie-banner');
  const btnAccept    = document.getElementById('cookie-accept');
  const btnReject    = document.getElementById('cookie-reject');

  if (cookieBanner) {
    const stored = localStorage.getItem('cookieConsent');
    if (!stored) {
      setTimeout(() => { cookieBanner.classList.add('is-visible'); cookieBanner.setAttribute('aria-hidden', 'false'); }, 800);
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

    /* "Cookieindstillinger" i footeren: træk samtykket tilbage og vis banneret igen */
    document.querySelectorAll('[data-cookie-settings]').forEach(link => {
      link.addEventListener('click', e => {
        e.preventDefault();
        localStorage.removeItem('cookieConsent');
        cookieBanner.classList.add('is-visible');
        cookieBanner.setAttribute('aria-hidden', 'false');
      });
    });
  }

  /* Smooth scroll + parallax depth */
  initSmoothScroll();
  startParallax();
  window.addEventListener('load', refreshParallax);
}

/* ==========================================================================
   PER-PAGE SETUP (safe to re-run after a page swap)
   ========================================================================== */
function initPage() {

  /* Recompute parallax anchors for this page's content */
  refreshParallax();

  /* ----- Scroll reveals (IntersectionObserver) ----- */
  const reveals = document.querySelectorAll('.reveal:not(.is-visible)');
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

  /* ----- Render videos if cookie consent was already given ----- */
  if (localStorage.getItem('cookieConsent') === 'accepted') {
    loadConsentedContent();
  }

  /* ----- FAQ accordion ----- */
  document.querySelectorAll('.faq-question').forEach(btn => {
    if (btn.dataset.bound) return;
    btn.dataset.bound = '1';
    btn.addEventListener('click', () => {
      const item    = btn.closest('.faq-item');
      const wasOpen = item.classList.contains('is-open');
      document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('is-open'));
      if (!wasOpen) item.classList.add('is-open');
    });
  });

  /* ----- Newsletter form ----- */
  document.querySelectorAll('.newsletter-form').forEach(form => {
    if (form.dataset.bound) return;
    form.dataset.bound = '1';
    form.addEventListener('submit', async e => {
      e.preventDefault();
      const input = form.querySelector('input[type="email"]');
      if (!input || !input.value) return;

      if (!FORM_ENDPOINT) {
        showFormMessage(form, FORM_INACTIVE_MSG);
        return;
      }

      const btn = form.querySelector('button[type="submit"]');
      if (btn) btn.disabled = true;
      try {
        const res = await fetch(FORM_ENDPOINT, {
          method: 'POST',
          body: new FormData(form),
          headers: { 'Accept': 'application/json' }
        });
        if (res.ok) {
          input.value = '';
          showFormMessage(form, 'Tak! Du er nu tilmeldt vores nyhedsbrev.');
        } else {
          showFormMessage(form, FORM_ERROR_MSG);
        }
      } catch (err) {
        showFormMessage(form, FORM_ERROR_MSG);
      } finally {
        if (btn) btn.disabled = false;
      }
    });
  });

  /* ----- Contact form ----- */
  const contactForm = document.getElementById('contact-form');
  if (contactForm && !contactForm.dataset.bound) {
    contactForm.dataset.bound = '1';
    contactForm.addEventListener('submit', async e => {
      e.preventDefault();

      if (!FORM_ENDPOINT) {
        showFormMessage(contactForm, FORM_INACTIVE_MSG);
        return;
      }

      if (!contactForm.checkValidity()) { contactForm.reportValidity(); return; }

      const btn = contactForm.querySelector('button[type="submit"]');
      const originalText = btn.textContent;
      btn.disabled = true;
      btn.textContent = 'Sender…';
      try {
        const res = await fetch(FORM_ENDPOINT, {
          method: 'POST',
          body: new FormData(contactForm),
          headers: { 'Accept': 'application/json' }
        });
        if (res.ok) {
          contactForm.reset();
          btn.textContent = 'Besked sendt ✓';
        } else {
          btn.disabled = false;
          btn.textContent = originalText;
          showFormMessage(contactForm, FORM_ERROR_MSG);
        }
      } catch (err) {
        btn.disabled = false;
        btn.textContent = originalText;
        showFormMessage(contactForm, FORM_ERROR_MSG);
      }
    });
  }

  /* ----- Iris-wipe transition (profile cards → colored circle fills screen) -----
     Modelled on bgiakademiet.dk's line transition. Instead of an AJAX page swap
     (Barba.js), we cover the screen completely in the brand colour BEFORE
     navigating, and the destination page starts under a matching cover that fades
     out — so the page reload is hidden behind a continuous colour. */
  document.querySelectorAll('[data-profile-link]').forEach(card => {
    if (card.dataset.bound) return;
    card.dataset.bound = '1';
    card.addEventListener('click', e => {
      const href = card.getAttribute('href');
      if (!href) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) return; // allow open-in-new-tab
      e.preventDefault();

      if (prefersReducedMotion) {
        try { sessionStorage.setItem('portalDive', '1'); } catch (err) {}
        window.location.href = href;
        return;
      }

      const rect = card.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;

      /* Radius needed to reach the farthest corner of the viewport */
      const farX = Math.max(cx, window.innerWidth - cx);
      const farY = Math.max(cy, window.innerHeight - cy);
      const radius = Math.hypot(farX, farY);

      const BASE = 80;                              // base circle diameter
      const scale = (radius * 2) / BASE + 1;        // +1 = small safety overshoot

      const iris = document.createElement('div');
      iris.className = 'iris-wipe';
      iris.style.width  = BASE + 'px';
      iris.style.height = BASE + 'px';
      iris.style.left   = (cx - BASE / 2) + 'px';
      iris.style.top    = (cy - BASE / 2) + 'px';
      document.body.appendChild(iris);

      /* Flag the dive so the destination page reveals from a matching cover */
      try { sessionStorage.setItem('portalDive', '1'); } catch (err) {}

      let navigated = false;
      const go = () => { if (!navigated) { navigated = true; window.location.href = href; } };

      const anim = iris.animate(
        [{ transform: 'scale(0)' }, { transform: 'scale(' + scale + ')' }],
        { duration: 560, easing: 'cubic-bezier(0.6, 0, 0.35, 1)', fill: 'forwards' }
      );
      anim.onfinish = go;
      setTimeout(go, 650); // safety net if onfinish doesn't fire
    });
  });

  /* ----- Reveal cover on pages reached via the wipe ----- */
  const cover = document.getElementById('page-cover');
  if (cover) {
    if (document.documentElement.classList.contains('dive-enter')) {
      /* CSS animation fades it out; just remove the node afterwards */
      cover.addEventListener('animationend', () => cover.remove());
      setTimeout(() => { if (cover.parentNode) cover.remove(); }, 1300);
    } else {
      cover.remove();
    }
  }
}

/* ==========================================================================
   BOOT
   ========================================================================== */
document.addEventListener('DOMContentLoaded', () => {
  initGlobal();
  initPage();
});
