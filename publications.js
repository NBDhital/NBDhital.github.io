/**
 * publications.js
 * Renders the "Peer-Reviewed Journal Articles" list on research.html from
 * a single data source: /data/publication-list.json
 *
 * To add, edit, or remove a journal article, edit that JSON file only.
 * Nothing here needs to change for routine updates.
 *
 * Conference Presentations and Invited Talks are NOT data-driven - they
 * are plain bulleted lists (<ul class="pub-bullets">) directly in
 * research.html, and are edited there.
 */
(function () {
  'use strict';

  var DATA_URL = '/data/publication-list.json';

  // "**Name**" -> <strong>Name</strong> (marks the site owner's own name).
  // Titles/journal names are trusted content authored in the JSON file,
  // consistent with how they were previously authored directly in HTML.
  function renderAuthors(str) {
    if (!str) return '';
    return str.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  }

  function buildJournalEntry(entry) {
    var tags = (entry.tags || []).join(' ');
    var el = document.createElement('div');
    el.className = 'pub-entry';
    el.setAttribute('data-tags', tags);

    var citation = entry.journal + ' ' + entry.volpp + ' (' + entry.year + ').';

    el.innerHTML =
      '<div class="pub-entry__journal">' + citation + '</div>' +
      '<a class="pub-entry__title" href="' + entry.url + '" target="_blank" rel="noopener">' + entry.title + '</a>' +
      '<div class="pub-entry__authors">' + renderAuthors(entry.authors) + '</div>' +
      '<div class="pub-entry__actions">' +
        '<button class="pub-entry__abstract-toggle" type="button" aria-expanded="false">View Abstract</button>' +
        '<a class="pub-entry__fulltext" href="' + entry.url + '" target="_blank" rel="noopener">View Full Text at Publisher &rarr;</a>' +
      '</div>' +
      '<div class="pub-entry__abstract"><p>' + entry.abstract + '</p></div>';

    return el;
  }

  function buildYearGroup(yearGroup) {
    var wrap = document.createElement('div');
    wrap.className = 'pub-year-group';
    wrap.setAttribute('data-year', yearGroup.year);

    var yearLabel = document.createElement('div');
    yearLabel.className = 'pub-year';
    yearLabel.textContent = yearGroup.year;
    wrap.appendChild(yearLabel);

    var entriesWrap = document.createElement('div');
    entriesWrap.className = 'pub-entries';
    (yearGroup.entries || []).forEach(function (entry) {
      entriesWrap.appendChild(buildJournalEntry(entry));
    });
    wrap.appendChild(entriesWrap);

    return wrap;
  }

  function renderJournalArticles(groups) {
    var container = document.getElementById('publications-list');
    if (!container) return;
    container.innerHTML = '';
    groups.forEach(function (group) {
      container.appendChild(buildYearGroup(group));
    });
  }

  // -------------------------------------------------------------------
  // Abstract show/hide toggle + publication category filter.
  // Runs after the journal articles are rendered, since it needs to
  // query elements that publications.js just created.
  // -------------------------------------------------------------------
  function setupPublicationInteractions() {
    document.querySelectorAll('.pub-entry__abstract-toggle').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var entry = btn.closest('.pub-entry');
        var abstractEl = entry.querySelector('.pub-entry__abstract');
        var isVisible = abstractEl.classList.contains('is-visible');

        abstractEl.classList.toggle('is-visible', !isVisible);
        btn.setAttribute('aria-expanded', String(!isVisible));
        btn.textContent = isVisible ? 'View Abstract' : 'Hide Abstract';
      });
    });

    var filterBar = document.querySelector('.pub-filter');
    if (!filterBar) return;

    var buttons = filterBar.querySelectorAll('.tab-btn');
    var countEl = document.getElementById('pub-filter-count');
    var allEntries = document.querySelectorAll('.pub-entry');
    var yearGroups = document.querySelectorAll('.pub-year-group');
    var totalCount = allEntries.length;

    function applyFilter(tag) {
      var visibleCount = 0;

      allEntries.forEach(function (entry) {
        var tags = (entry.getAttribute('data-tags') || '').split(' ');
        var show = tag === 'all' || tags.indexOf(tag) !== -1;
        entry.style.display = show ? '' : 'none';
        if (show) visibleCount++;
      });

      yearGroups.forEach(function (group) {
        var hasVisible = group.querySelector('.pub-entry:not([style*="display: none"])');
        group.style.display = hasVisible ? '' : 'none';
      });

      if (tag === 'all') {
        countEl.textContent = visibleCount + ' of ' + totalCount + ' articles shown';
      } else {
        var label = filterBar.querySelector('.tab-btn[data-tag="' + tag + '"]').textContent.trim();
        countEl.textContent = visibleCount + ' of ' + totalCount + ' articles shown under category "' + label + '"';
      }
    }

    buttons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        buttons.forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        applyFilter(btn.getAttribute('data-tag'));
      });
    });

    applyFilter('all');
  }

  function init() {
    var container = document.getElementById('publications-list');
    if (!container) return; // Only fetch/render on pages that have the list.

    fetch(DATA_URL)
      .then(function (res) {
        if (!res.ok) throw new Error('Failed to load ' + DATA_URL + ' (' + res.status + ')');
        return res.json();
      })
      .then(function (data) {
        renderJournalArticles(data.journalArticles || []);
        setupPublicationInteractions();
      })
      .catch(function (err) {
        console.error('publications.js:', err);
        container.innerHTML =
          '<p style="text-align:center;color:var(--color-text-muted);">Publications could not be loaded right now.</p>';
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
