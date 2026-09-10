/*
  download.js
  -----------
  Renders the download list from /data/downloads.json and handles the
  access-code-then-open flow.

  To add/update a course: edit data/downloads.json only. Nothing in this
  file needs to change for a normal update.

  For more than 10 links, update LINK_ORDER in this file and add new link with
  metadata in download.json
*/

const LINK_ORDER = [
  'link1', 'link2', 'link3', 'link4', 'link5',
  'link6', 'link7', 'link8', 'link9', 'link10',
];

async function loadDownloads() {
  const listEl = document.getElementById('notes-list');
  if (!listEl) return;

  let data;
  try {
    const res = await fetch('data/downloads.json', { cache: 'no-store' });
    data = await res.json();
  } catch (err) {
    listEl.innerHTML = '<p class="notes-empty">Could not load the downloads list right now. Please try again later.</p>';
    return;
  }

  listEl.innerHTML = '';
  let shown = 0;

  LINK_ORDER.forEach((key) => {
    const item = data[key];
    if (!item || item.active === false || !item.base) return;

    shown++;

    const row = document.createElement('div');
    row.className = 'note-row';
    row.innerHTML = `
      <div class="note-info">
        <span class="note-level">${escapeHtml(item.level || '')}</span>
        <span class="note-course">${escapeHtml(item.course || '')}</span>
        <span class="note-meta">${escapeHtml(item.semester || '')}${item.semester && item.year ? ' &middot; ' : ''}${escapeHtml(item.year || '')}</span>
      </div>
      <button class="dl-btn" type="button" data-key="${key}">Download</button>
    `;
    listEl.appendChild(row);
  });

  if (shown === 0) {
    listEl.innerHTML = '<p class="notes-empty">No lecture notes are available for download right now.</p>';
    return;
  }

  listEl.addEventListener('click', async function (e) {
    const btn = e.target.closest('.dl-btn');
    if (!btn) return;

    const linkKey = btn.dataset.key;
    const item = data[linkKey];
    if (!item || !item.base) return;

    const courseLabel = [item.course, item.semester, item.year].filter(Boolean).join(' — ');
    const code = await askForCode(courseLabel);
    if (code === null) return; // cancelled

    const trimmed = code.trim();
    if (!trimmed) return;

    const fullUrl = item.base + trimmed + (item.suffix || '');
    window.open(fullUrl, '_blank', 'noopener');
  });
}

/* ---- ustom prompt box (replaces window.prompt so the input can ---- */

function askForCode(courseLabel) {
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.className = 'code-modal-overlay';
    overlay.innerHTML = `
      <div class="code-modal" role="dialog" aria-modal="true" aria-label="Enter access code">
        <p class="code-modal__label">${courseLabel ? 'Enter access key (case-sensitive) provided for<br>' + escapeHtml(courseLabel) + '': 'Enter access code'}</p>
        <input type="text" class="code-modal__input" maxlength="24" size="10" autocomplete="off" autocapitalize="off" spellcheck="false" />
        <div class="code-modal__actions">
          <button type="button" class="code-modal__btn code-modal__btn--cancel">Cancel</button>
          <button type="button" class="code-modal__btn code-modal__btn--submit">OK</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    const input = overlay.querySelector('.code-modal__input');
    const submitBtn = overlay.querySelector('.code-modal__btn--submit');
    const cancelBtn = overlay.querySelector('.code-modal__btn--cancel');

    input.focus();

    function cleanup(result) {
      document.removeEventListener('keydown', onKeydown);
      overlay.remove();
      resolve(result);
    }

    function onKeydown(e) {
      if (e.key === 'Enter') cleanup(input.value);
      if (e.key === 'Escape') cleanup(null);
    }

    submitBtn.addEventListener('click', () => cleanup(input.value));
    cancelBtn.addEventListener('click', () => cleanup(null));
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) cleanup(null);
    });
    document.addEventListener('keydown', onKeydown);
  });
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

document.addEventListener('DOMContentLoaded', loadDownloads);
