/* ============================================================
   post-drawer.js — 90vh bottom drawer that renders a single post.
   Injected into the DOM once, reused across pages.
   Reads slug from URL hash (#post=slug) for shareable deep-links.
   ============================================================ */

import { loadPosts, findPostBySlug } from './posts.js';

let root = null;
let panel = null;
let bodyEl = null;
let titleEl = null;
let metaEl = null;
let backdropEl = null;
let closeBtn = null;
let lastFocus = null;

function ensureMounted() {
  if (root) return;

  root = document.createElement('div');
  root.className = 'post-drawer';
  root.id = 'post-drawer';
  root.setAttribute('aria-hidden', 'true');
  root.innerHTML = `
    <div class="post-drawer__backdrop" data-close></div>
    <article class="post-drawer__panel" role="dialog" aria-modal="true" aria-labelledby="post-drawer-title">
      <div class="post-drawer__grip" aria-hidden="true"></div>
      <button class="post-drawer__close" type="button" data-close aria-label="Close post">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
      </button>
      <header class="post-drawer__header">
        <p class="post-drawer__meta" id="post-drawer-meta"></p>
        <h1 class="post-drawer__title" id="post-drawer-title"></h1>
      </header>
      <div class="post-drawer__body post-content" id="post-drawer-body"></div>
      <footer class="post-drawer__footer">
        <span>eshanjain.in / writings</span>
        <button type="button" class="post-drawer__back" data-close>Close ✕</button>
      </footer>
    </article>
  `;
  document.body.appendChild(root);

  panel = root.querySelector('.post-drawer__panel');
  bodyEl = root.querySelector('#post-drawer-body');
  titleEl = root.querySelector('#post-drawer-title');
  metaEl = root.querySelector('#post-drawer-meta');
  backdropEl = root.querySelector('.post-drawer__backdrop');
  closeBtn = root.querySelector('.post-drawer__close');

  root.querySelectorAll('[data-close]').forEach((el) => {
    el.addEventListener('click', closeDrawer);
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && root.classList.contains('is-open')) closeDrawer();
  });
}

export async function openPost(slug) {
  ensureMounted();
  const posts = await loadPosts();
  const post = findPostBySlug(slug) || posts.find((p) => p.slug === slug);
  if (!post) {
    console.warn('[post-drawer] post not found:', slug);
    return;
  }

  titleEl.textContent = post.title;
  const metaBits = [post.dateDisplay || post.date, post.readTime].filter(Boolean);
  metaEl.textContent = metaBits.join(' · ');
  bodyEl.innerHTML = post.html || '';

  lastFocus = document.activeElement;
  root.classList.add('is-open');
  root.setAttribute('aria-hidden', 'false');
  document.body.classList.add('has-drawer-open');
  // Reset scroll inside panel
  requestAnimationFrame(() => { panel.scrollTop = 0; });

  // Update URL hash so drawer state is shareable
  if (location.hash !== `#post=${post.slug}`) {
    history.replaceState(null, '', `${location.pathname}#post=${post.slug}`);
  }

  closeBtn?.focus({ preventScroll: true });
}

export function closeDrawer() {
  if (!root) return;
  root.classList.remove('is-open');
  root.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('has-drawer-open');

  if (location.hash.startsWith('#post=')) {
    history.replaceState(null, '', location.pathname);
  }
  if (lastFocus && typeof lastFocus.focus === 'function') {
    lastFocus.focus({ preventScroll: true });
  }
}

// Open from deep-link on load (e.g. /blog#post=welcome)
export function initDrawerFromHash() {
  ensureMounted();
  const m = location.hash.match(/^#post=([a-z0-9-]+)/i);
  if (m) openPost(m[1]);
  window.addEventListener('hashchange', () => {
    const mm = location.hash.match(/^#post=([a-z0-9-]+)/i);
    if (mm) openPost(mm[1]);
  });
}
