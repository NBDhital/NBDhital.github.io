/* ---------------------------------------------------------------------
   script.js
   General interactivity: scroll-reveal animation for sections, and a
   small tab-switcher used on the Research & Publications page.
--------------------------------------------------------------------- */
(function () {
  document.addEventListener('DOMContentLoaded', function () {

    /* Scroll-reveal: fade/slide elements with class "reveal" into view */
    var revealEls = document.querySelectorAll('.reveal');
    if ('IntersectionObserver' in window && revealEls.length) {
      var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.12 });
      revealEls.forEach(function (el) { observer.observe(el); });
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
  });
})();
