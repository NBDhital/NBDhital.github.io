/* ---------------------------------------------------------------------
   script.js
   General interactivity: scroll-reveal, the tab switcher used on the
   Research and Courses pages, dynamic research metrics, the sticky
   header state, and the in-page section-nav active state.
--------------------------------------------------------------------- */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  document.addEventListener('DOMContentLoaded', function () {

    /* ------------------------------------------------------------------
       Scroll-reveal. Low threshold + rootMargin so tall sections (the
       long Publications list) trigger on a sliver rather than needing
       12% of their height on-screen. A safety timer force-reveals
       anything still hidden after 2.5s, so content can never get stuck
       invisible on any device.
       ------------------------------------------------------------------ */
    var revealEls = document.querySelectorAll('.reveal');

    if (reduceMotion || !('IntersectionObserver' in window)) {
      revealEls.forEach(function (el) { el.classList.add('is-visible'); });
    } else if (revealEls.length) {
      var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        });
      }, { threshold: 0, rootMargin: '0px 0px -5% 0px' });

      revealEls.forEach(function (el) { observer.observe(el); });

      setTimeout(function () {
        revealEls.forEach(function (el) { el.classList.add('is-visible'); });
      }, 2500);
    }

    /* ------------------------------------------------------------------
       Tab switcher: <button class="tab-btn" data-tab="id"> paired with
       <div class="tab-panel" id="id">.
       ------------------------------------------------------------------ */
    var tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var group = btn.closest('.tabs');
        if (!group) return;

        var targetId = btn.getAttribute('data-tab');
        if (!targetId) return;   // tag-filter buttons are handled in publications.js

        var panelWrap = document.querySelector(
          '[data-tab-panels="' + group.getAttribute('data-tab-group') + '"]'
        ) || group;

        group.querySelectorAll('.tab-btn').forEach(function (b) {
          b.classList.remove('active');
          b.setAttribute('aria-selected', 'false');
        });
        btn.classList.add('active');
        btn.setAttribute('aria-selected', 'true');

        panelWrap.querySelectorAll('.tab-panel').forEach(function (p) {
          p.classList.remove('active');
        });
        var target = document.getElementById(targetId);
        if (target) target.classList.add('active');
      });
    });

    /* ------------------------------------------------------------------
       Research metrics, loaded from one plain data file. To update these
       numbers in future, edit ONLY /data/metrics.json — never this file
       or the HTML. If the data file is missing or fails to load, the
       static fallback numbers already in the HTML stay exactly as they
       are, so nothing ever breaks or shows blank.
       ------------------------------------------------------------------ */
    var metricEls = {
      citations:    document.getElementById('metric-citations'),
      hIndex:       document.getElementById('metric-hindex'),
      i10Index:     document.getElementById('metric-i10index'),
      numPubscopus: document.getElementById('metric-numpubscopus')
    };

    if (metricEls.citations || metricEls.hIndex || metricEls.i10Index || metricEls.numPubscopus) {
      fetch('/data/metrics.json')
        .then(function (res) { return res.json(); })
        .then(function (data) {
          Object.keys(metricEls).forEach(function (key) {
            var el = metricEls[key];
            if (el && data[key] != null) el.textContent = data[key];
          });
        })
        .catch(function () { /* keep the static fallback numbers in the HTML */ });
    }

    /* ------------------------------------------------------------------
       In-page section navigation: mark the section currently under the
       header as current. Nothing was setting this before.
       ------------------------------------------------------------------ */
    initSectionSpy();
  });

  function initSectionSpy() {
    var nav = document.querySelector('.page-nav');
    if (!nav || !('IntersectionObserver' in window)) return;

    var items = Array.prototype.slice.call(nav.querySelectorAll('.page-nav__item'));
    if (!items.length) return;

    var targets = items.map(function (item) {
      var id = (item.getAttribute('href') || '').replace(/^#/, '');
      var section = id ? document.getElementById(id) : null;
      return section ? { item: item, section: section } : null;
    }).filter(Boolean);

    if (!targets.length) return;

    function setCurrent(item) {
      items.forEach(function (i) { i.classList.toggle('is-current', i === item); });
    }

    // Offset = sticky header + the nav bar itself, so a section counts as
    // current only once it clears both.
    function topOffset() {
      var headerH = parseInt(
        getComputedStyle(document.documentElement).getPropertyValue('--header-height'), 10
      ) || 74;
      return headerH + nav.offsetHeight + 8;
    }

    var visible = [];

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var i = visible.indexOf(entry.target);
        if (entry.isIntersecting && i === -1) visible.push(entry.target);
        else if (!entry.isIntersecting && i !== -1) visible.splice(i, 1);
      });

      var current = targets
        .filter(function (t) { return visible.indexOf(t.section) !== -1; })
        .sort(function (a, b) {
          return a.section.getBoundingClientRect().top - b.section.getBoundingClientRect().top;
        })[0];

      if (current) setCurrent(current.item);
    }, {
      rootMargin: '-' + topOffset() + 'px 0px -55% 0px',
      threshold: 0
    });

    targets.forEach(function (t) { observer.observe(t.section); });
  }
})();


/* ---------------------------------------------------------------------
   Sticky header height.
   Called from include.js immediately after the header is injected, and
   again once web fonts finish loading — NOT from window's "load" event.
   "load" does not wait for the header's fetch(), so it could fire before
   the header existed in the DOM, silently skipping the update and
   leaving a gap between the header and the sticky sub-navigation bar.
--------------------------------------------------------------------- */
function updateHeaderHeight() {
  var header = document.querySelector('.site-header');
  if (!header) return;
  document.documentElement.style.setProperty('--header-height', header.offsetHeight + 'px');
}

(function () {
  'use strict';

  var resizeTimer;
  window.addEventListener('resize', function () {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(updateHeaderHeight, 120);
  });

  /* Header scrolled state. The previous version ran unthrottled on every
     scroll event and wrote a class each time; this batches into one
     rAF frame and only touches the DOM when the state actually flips. */
  var lastState = null;
  var ticking = false;

  function update() {
    var header = document.querySelector('.site-header');
    ticking = false;
    if (!header) return;

    var scrolled = window.scrollY > 50;
    if (scrolled === lastState) return;
    lastState = scrolled;
    header.classList.toggle('is-scrolled', scrolled);
  }

  window.addEventListener('scroll', function () {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(update);
  }, { passive: true });
})();
