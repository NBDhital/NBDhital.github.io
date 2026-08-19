/* ---------------------------------------------------------------------
   script.js
   General interactivity: scroll-reveal animation for sections, and a
   small tab-switcher used on the Research & Publications page.
--------------------------------------------------------------------- */
(function () {
  document.addEventListener('DOMContentLoaded', function () {

    /* Scroll-reveal: fade/slide elements with class "reveal" into view.
       Uses a very low threshold + rootMargin so tall sections (e.g. the
       long Publications list) don't need 12% of their height on-screen
       to trigger - just a sliver near the viewport is enough. A safety
       timer also force-reveals anything left hidden after 2.5s, so
       content can never get permanently stuck invisible on any device. */
    var revealEls = document.querySelectorAll('.reveal');
    if ('IntersectionObserver' in window && revealEls.length) {
      var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0, rootMargin: '0px 0px -5% 0px' });
      revealEls.forEach(function (el) { observer.observe(el); });

      setTimeout(function () {
        revealEls.forEach(function (el) { el.classList.add('is-visible'); });
      }, 2500);
    } else {
      revealEls.forEach(function (el) { el.classList.add('is-visible'); });
    }

    /* Simple tab switcher: <button class="tab-btn" data-tab="id"> +
       <div class="tab-panel" id="id"> pairs */
    var tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var group = btn.closest('.tabs');
        var targetId = btn.getAttribute('data-tab');
        var panelWrap = document.querySelector('[data-tab-panels="' + group.getAttribute('data-tab-group') + '"]');

        group.querySelectorAll('.tab-btn').forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');

        if (panelWrap) {
          panelWrap.querySelectorAll('.tab-panel').forEach(function (p) { p.classList.remove('active'); });
          var target = document.getElementById(targetId);
          if (target) target.classList.add('active');
        }
      });
    });

    /* Load manually-updated site variables (currently: research metrics)
       from a single plain data file, and fill them into the page. To
       update these numbers in the future, edit ONLY /data/metrics.json -
       never this file or the HTML. If the data file is ever missing or
       fails to load, the static fallback numbers already written in the
       HTML stay exactly as they are, so nothing ever breaks or shows
       blank. */
    var metricEls = {
      citations: document.getElementById('metric-citations'),
      hIndex:    document.getElementById('metric-hindex'),
      i10Index:  document.getElementById('metric-i10index'),
      numpubscopus: document.getElementById('metric-numpubscopus'),
    };
    if (metricEls.citations || metricEls.hIndex || metricEls.i10Index || metricEls.numpubscopus) {
      fetch('/data/metrics.json')
        .then(function (res) { return res.json(); })
        .then(function (data) {
          if (metricEls.citations && data.citations != null) {
            metricEls.citations.textContent = data.citations;
          }
          if (metricEls.hIndex && data.hIndex != null) {
            metricEls.hIndex.textContent = data.hIndex;
          }
          if (metricEls.i10Index && data.i10Index != null) {
            metricEls.i10Index.textContent = data.i10Index;
          }
          if (metricEls.numpubscopus && data.numpubscopus != null) {
            metricEls.numpubscopus.textContent = data.numpubscopus;
        })
        .catch(function () { /* keep static fallback numbers already in the HTML */ });
    }
  });
})();


/* For two sticky headers; getting header height */


function updateHeaderHeight() {
  const header = document.querySelector('.site-header');

  if (!header) return;

  const height = header.offsetHeight;

  document.documentElement.style.setProperty(
    '--header-height',
    `${height}px`
  );
}

window.addEventListener('load', updateHeaderHeight);
window.addEventListener('resize', updateHeaderHeight);


window.addEventListener("scroll", function () {
  const header = document.querySelector(".site-header");

  if (!header) return;

  if (window.scrollY > 50) {
    header.classList.add("is-scrolled");
  } else {
    header.classList.remove("is-scrolled");
  }
});
