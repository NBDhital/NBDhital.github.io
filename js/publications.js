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
    var roles = (entry.authorRole || []).join(' ');
    var access = entry.access || '';
    var indexing = (entry.indexing || []).join(' ');
    var el = document.createElement('div');
    el.className = 'pub-entry';
    el.setAttribute('data-tags', tags);
    el.setAttribute('data-role', roles);
    el.setAttribute('data-access', access);
    el.setAttribute('data-indexing', indexing)

    var citation = entry.journal + ' ' + entry.volpp + ' (' + entry.year + ')';

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

    var selects = filterBar.querySelectorAll('.pub-filter__select');
    var countEl = document.getElementById('pub-filter-count');
    var allEntries = document.querySelectorAll('.pub-entry');
    var yearGroups = document.querySelectorAll('.pub-year-group');
    var totalCount = allEntries.length;

    // A publication is shown only if it matches every active dropdown
    // (subject area AND author role AND access) - "all" always matches.
    function matches(entry, field, value) {
      if (value === 'all') return true;
      var raw = (entry.getAttribute('data-' + field) || '').split(' ');
      return raw.indexOf(value) !== -1;
    }

    function activeLabels() {
      var labels = [];
      selects.forEach(function (select) {
        if (select.value === 'all') return;
        var opt = select.options[select.selectedIndex];
        labels.push(opt.textContent.trim());
      });
      return labels;
    }

    function applyFilters() {
      var values = {};
      selects.forEach(function (select) {
        values[select.getAttribute('data-filter')] = select.value;
      });

      var visibleCount = 0;
      allEntries.forEach(function (entry) {
        var show = matches(entry, 'tags', values.tag) &&
                   matches(entry, 'role', values.role) &&
                   matches(entry, 'access', values.access) && 
                   matches(entry, 'indexing', values.indexing);
        entry.style.display = show ? '' : 'none';
        if (show) visibleCount++;
      });

      yearGroups.forEach(function (group) {
        var hasVisible = group.querySelector('.pub-entry:not([style*="display: none"])');
        group.style.display = hasVisible ? '' : 'none';
      });

      var labels = activeLabels();
      countEl.textContent = labels.length === 0
        ? visibleCount + ' of ' + totalCount + ' articles displayed'
        : visibleCount + ' of ' + totalCount + ' articles displayed \u2014 ' + labels.join(', ');
    }

    selects.forEach(function (select) {
      select.addEventListener('change', applyFilters);
    });

    applyFilters();
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
