/* ============================================================
   writings.js — render the writings list (homepage + blog page)
   and wire up clicks to open the post drawer.
   ============================================================ */

import { loadPosts } from './posts.js';
import { openPost, initDrawerFromHash } from './post-drawer.js';

function rowTemplate(post, index) {
  const tag = Array.isArray(post.tags) && post.tags.length ? post.tags[0] : '';
  return `
    <li class="writing-row" data-reveal data-slug="${post.slug}" style="--i:${index}">
      <button class="writing-row__btn" type="button" data-slug="${post.slug}">
        <span class="writing-row__index">${String(index + 1).padStart(2, '0')}</span>
        <span class="writing-row__meta">
          <span class="writing-row__title">${escapeHtml(post.title)}</span>
          ${post.excerpt ? `<span class="writing-row__excerpt">${escapeHtml(post.excerpt)}</span>` : ''}
        </span>
        <span class="writing-row__side">
          ${tag ? `<span class="writing-row__tag">${escapeHtml(tag)}</span>` : ''}
          <span class="writing-row__date">${post.dateDisplay || ''}</span>
          <span class="writing-row__arrow" aria-hidden="true">↗</span>
        </span>
      </button>
    </li>
  `;
}

function escapeHtml(s = '') {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export async function mountWritings(selector, { limit = 0, emptyEl = null } = {}) {
  const list = document.querySelector(selector);
  if (!list) return;

  const posts = await loadPosts();
  const slice = limit > 0 ? posts.slice(0, limit) : posts;

  if (!slice.length) {
    list.innerHTML = '';
    if (emptyEl) emptyEl.hidden = false;
    return;
  }

  list.innerHTML = slice.map((p, i) => rowTemplate(p, i)).join('');

  // Rows are injected *after* the global IntersectionObserver set up in main.js
  // has scanned the DOM, so they'd stay invisible forever. Reveal them now
  // with a small staggered delay for a nice cascade.
  const rows = list.querySelectorAll('.writing-row');
  rows.forEach((row, i) => {
    setTimeout(() => row.classList.add('is-visible'), 40 * i);
  });

  list.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-slug]');
    if (!btn) return;
    const slug = btn.dataset.slug;
    if (slug) openPost(slug);
  });
}

export function initWritings() {
  // Homepage: #writings-list (honours data-limit)
  const home = document.getElementById('writings-list');
  if (home) {
    const lim = parseInt(home.dataset.limit || '0', 10);
    mountWritings('#writings-list', {
      limit: lim,
      emptyEl: document.getElementById('writings-home-empty'),
    });
  }
  // Blog page: #writings-list-full
  const full = document.getElementById('writings-list-full');
  if (full) {
    mountWritings('#writings-list-full', {
      emptyEl: document.getElementById('writings-empty'),
    });
  }
  initDrawerFromHash();
}
