/* ---------------------------------------------------------------------
   include.js
   Loads includes/header.html and includes/footer.html into every page
   so you only ever have to edit the menu / footer in ONE place.
--------------------------------------------------------------------- */
(function () {
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

  document.addEventListener('DOMContentLoaded', function () {
    loadInclude('site-header-placeholder', '/includes/header.html', function () {
      // Highlight the current page's nav link
      var current = document.body.getAttribute('data-page');
      var link = document.querySelector('.nav-links a[data-page="' + current + '"]');
      if (link) link.classList.add('active');

      // Mobile menu toggle
      var toggle = document.getElementById('navToggle');
      var links = document.getElementById('navLinks');
      if (toggle && links) {
        toggle.addEventListener('click', function () {
          links.classList.toggle('open');
        });
        links.querySelectorAll('a').forEach(function (a) {
          a.addEventListener('click', function () { links.classList.remove('open'); });
        });
      }

      // The header now actually exists in the DOM - measure its real
      // height right now, rather than relying on window's "load" event
      // (which does not wait for this fetch() and can fire before OR
      // after the header is injected depending on network/cache timing -
      // this was the cause of an intermittent gap between the header
      // and the page's sticky sub-navigation bar). Re-measure again once
      // web fonts finish loading too, since a font swap can very
      // slightly change the header's rendered height.
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
      if (backBtn) {
        window.addEventListener('scroll', function () {
          backBtn.classList.toggle('show', window.scrollY > 400);
        });
        backBtn.addEventListener('click', function () {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        });
      }
    });
  });
})();
