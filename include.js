/* ---------------------------------------------------------------------
   include.js
   Loads includes/header.html and includes/footer.html into every page
   so the menu and footer are only ever edited in ONE place.
--------------------------------------------------------------------- */
(function () {
  'use strict';

  var MOBILE_BREAKPOINT = 900;

  function loadInclude(selectorId, url, callback) {
    var el = document.getElementById(selectorId);
    if (!el) return;
    fetch(url)
      .then(function (res) { return res.text(); })
      .then(function (html) {
        el.innerHTML = html;
        if (callback) callback();
      })
      .catch(function (err) {
        console.error('Could not load ' + url, err);
      });
  }

  /* ------------------------------------------------------------------
     Mobile menu. Adds what the previous version was missing: the
     button's expanded state for screen readers, a scroll lock on the
     body, Escape to close, and a close on resize past the breakpoint
     (without which the body stayed scroll-locked after a rotate).
     ------------------------------------------------------------------ */
  function initMobileNav() {
    var toggle = document.getElementById('navToggle');
    var links = document.getElementById('navLinks');
    if (!toggle || !links) return;

    function setOpen(open) {
      links.classList.toggle('open', open);
      document.body.classList.toggle('nav-open', open);
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    }

    function close() {
      if (toggle.getAttribute('aria-expanded') !== 'true') return;
      setOpen(false);
    }

    toggle.addEventListener('click', function () {
      setOpen(toggle.getAttribute('aria-expanded') !== 'true');
    });

    links.addEventListener('click', function (event) {
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

  document.addEventListener('DOMContentLoaded', function () {

    loadInclude('site-header-placeholder', '/includes/header.html', function () {

      // Highlight the current page's nav link.
      var current = document.body.getAttribute('data-page');
      var link = document.querySelector('.nav-links a[data-page="' + current + '"]');
      if (link) {
        link.classList.add('active');
        link.setAttribute('aria-current', 'page');
      }

      initMobileNav();

      // The header now actually exists in the DOM, so measure its real
      // height immediately rather than waiting on window's "load" event
      // (which does not wait for this fetch() and can fire before OR
      // after the header is injected depending on network/cache timing —
      // the cause of an intermittent gap between the header and the
      // page's sticky sub-navigation bar). Measure again once web fonts
      // finish, since a font swap can change the rendered height.
      if (typeof updateHeaderHeight === 'function') {
        updateHeaderHeight();
        if (document.fonts && document.fonts.ready) {
          document.fonts.ready.then(updateHeaderHeight);
        }
      }
    });

    loadInclude('site-footer-placeholder', '/includes/footer.html', function () {
      var yearEl = document.getElementById('year');
      if (yearEl) yearEl.textContent = new Date().getFullYear();

      var backBtn = document.getElementById('back-to-top');
      if (!backBtn) return;

      var ticking = false;
      function update() {
        backBtn.classList.toggle('show', window.scrollY > 400);
        ticking = false;
      }
      window.addEventListener('scroll', function () {
        if (ticking) return;
        ticking = true;
        window.requestAnimationFrame(update);
      }, { passive: true });

      backBtn.addEventListener('click', function () {
        var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
      });

      update();
    });
  });
})();
