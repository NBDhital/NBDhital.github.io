/* ==========================================================================
   Shared UI behaviour
   --------------------------------------------------------------------------
   Deliberately a NEW file rather than an edit to js/script.js, which I could
   not read. Load it after include.js. Once you have confirmed which of the
   blocks below already exist in script.js (header scroll state, mobile nav,
   reveal observer are the likely duplicates), delete them there — running
   both will double-bind the listeners.

   Nothing here touches the AQI scripts or any id they depend on.
   ========================================================================== */

(function () {
  'use strict';

  document.documentElement.classList.remove('no-js');

  var MOBILE_BREAKPOINT = 900;
  var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ----------------------------------------------------------------------
     The header and footer are injected by include.js after this script may
     already have run, so wait for the element rather than assuming it.
     ---------------------------------------------------------------------- */
  function whenPresent(id, callback) {
    var existing = document.getElementById(id);
    if (existing) { callback(existing); return; }

    if (!('MutationObserver' in window)) return;

    var observer = new MutationObserver(function () {
      var el = document.getElementById(id);
      if (!el) return;
      observer.disconnect();
      callback(el);
    });

    observer.observe(document.body, { childList: true, subtree: true });
    window.setTimeout(function () { observer.disconnect(); }, 8000);
  }

  /* ======================================================================
     Header scroll state
     ====================================================================== */
  function initHeaderState(header) {
    var ticking = false;
    var threshold = 12;

    function update() {
      header.classList.toggle('is-scrolled', window.scrollY > threshold);
      ticking = false;
    }

    function onScroll() {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(update);
    }

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ======================================================================
     Mobile navigation
     ====================================================================== */
  function initMobileNav(header) {
    var toggle = header.querySelector('#nav-toggle');
    var nav = header.querySelector('#primary-nav');
    if (!toggle || !nav) return;

    function setOpen(open) {
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      nav.classList.toggle('is-open', open);
      document.body.classList.toggle('nav-open', open);
    }

    function close() {
      if (toggle.getAttribute('aria-expanded') !== 'true') return;
      setOpen(false);
    }

    toggle.addEventListener('click', function () {
      setOpen(toggle.getAttribute('aria-expanded') !== 'true');
    });

    // Close on navigation, on Escape, and when the viewport grows past the
    // breakpoint (otherwise body stays scroll-locked on rotate).
    nav.addEventListener('click', function (event) {
      if (event.target.closest('a')) close();
    });

    document.addEventListener('keydown', function (event) {
      if (event.key !== 'Escape') return;
      if (toggle.getAttribute('aria-expanded') !== 'true') return;
      close();
      toggle.focus();
    });

    var resizeTimer;
    window.addEventListener('resize', function () {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(function () {
        if (window.innerWidth > MOBILE_BREAKPOINT) close();
      }, 120);
    });
  }

  /* ======================================================================
     Current-page marker
     Works from body[data-page] when present, and falls back to the path so
     it stays correct on pages that do not set the attribute.
     ====================================================================== */
  function initActiveNav(header) {
    var links = header.querySelectorAll('.nav__link');
    if (!links.length) return;

    var dataPage = document.body.getAttribute('data-page') || '';
    var path = window.location.pathname.replace(/\/+$/, '');
    var file = path.split('/').pop().replace(/\.html$/, '') || 'home';

    Array.prototype.forEach.call(links, function (link) {
      var key = link.getAttribute('data-nav');
      if (!key) return;
      if (key === dataPage || key === file) {
        link.setAttribute('aria-current', 'page');
      } else {
        link.removeAttribute('aria-current');
      }
    });
  }

  /* ======================================================================
     Footer year
     ====================================================================== */
  function initFooterYear(el) {
    el.textContent = String(new Date().getFullYear());
  }

  /* ======================================================================
     Scroll reveal
     ====================================================================== */
  function initReveal() {
    var items = document.querySelectorAll('.reveal');
    if (!items.length) return;

    function showAll() {
      Array.prototype.forEach.call(items, function (el) {
        el.classList.add('is-visible');
      });
    }

    if (prefersReducedMotion || !('IntersectionObserver' in window)) {
      showAll();
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, {
      rootMargin: '0px 0px -12% 0px',
      threshold: 0.08
    });

    Array.prototype.forEach.call(items, function (el) {
      // Anything already in view on load should not animate in — it would
      // read as a flash rather than a reveal.
      if (el.getBoundingClientRect().top < window.innerHeight * 0.92) {
        el.classList.add('is-visible');
        return;
      }
      observer.observe(el);
    });
  }

  /* ======================================================================
     In-page section navigation
     Marks the section currently under the header as active.
     ====================================================================== */
  function initSectionNav() {
    var nav = document.querySelector('.section-nav');
    if (!nav) return;

    var links = Array.prototype.slice.call(nav.querySelectorAll('.section-nav__link'));
    if (!links.length) return;

    var targets = links
      .map(function (link) {
        var id = (link.getAttribute('href') || '').replace(/^#/, '');
        var section = id ? document.getElementById(id) : null;
        return section ? { link: link, section: section } : null;
      })
      .filter(Boolean);

    if (!targets.length) return;

    function setActive(link) {
      links.forEach(function (item) {
        item.classList.toggle('is-active', item === link);
      });
    }

    if (!('IntersectionObserver' in window)) return;

    var offset = parseInt(
      getComputedStyle(document.documentElement).getPropertyValue('--scroll-offset'),
      10
    ) || 104;

    var visible = new Set();

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) visible.add(entry.target);
        else visible.delete(entry.target);
      });

      // Choose the topmost section currently in the reading area.
      var current = targets
        .filter(function (t) { return visible.has(t.section); })
        .sort(function (a, b) {
          return a.section.getBoundingClientRect().top - b.section.getBoundingClientRect().top;
        })[0];

      if (current) setActive(current.link);
    }, {
      rootMargin: '-' + (offset + 8) + 'px 0px -55% 0px',
      threshold: 0
    });

    targets.forEach(function (t) { observer.observe(t.section); });
  }

  /* ======================================================================
     Boot
     ====================================================================== */
  function boot() {
    whenPresent('site-header', function (header) {
      initHeaderState(header);
      initMobileNav(header);
      initActiveNav(header);
    });

    whenPresent('footer-year', initFooterYear);

    initReveal();
    initSectionNav();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
