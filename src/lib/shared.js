/* ============================================================
   shared.js — Common logic for all pages
   Theme toggle, scroll reveal, meta theme-color
   ============================================================ */

const THEME_KEY = 'ej.theme.v3';

/* ---------- Theme ---------- */

function getSystemPreference() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  // Update <meta name="theme-color"> for mobile browser chrome
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.content = theme === 'dark' ? '#0a0a0a' : '#f5f5f4';
}

export function initTheme() {
  // Priority: localStorage → system preference → light
  let stored;
  try { stored = localStorage.getItem(THEME_KEY); } catch {}
  const theme = stored || getSystemPreference();
  applyTheme(theme);

  // Wire toggle button
  const btn = document.getElementById('theme-toggle');
  if (btn) {
    btn.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme') || 'light';
      const next = current === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      try { localStorage.setItem(THEME_KEY, next); } catch {}
    });
  }

  // Listen for system preference changes (when no explicit choice stored)
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    let explicit;
    try { explicit = localStorage.getItem(THEME_KEY); } catch {}
    if (!explicit) applyTheme(e.matches ? 'dark' : 'light');
  });
}

/* ---------- Scroll reveal ---------- */

export function initReveal() {
  const els = document.querySelectorAll('[data-reveal]');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry, i) => {
          if (entry.isIntersecting) {
            const delay = (i % 5) * 60;
            setTimeout(() => entry.target.classList.add('is-visible'), delay);
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );
    els.forEach((el) => io.observe(el));
  } else {
    els.forEach((el) => el.classList.add('is-visible'));
  }
}

/* ---------- Smooth anchor scroll ---------- */

export function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener('click', (e) => {
      const id = link.getAttribute('href');
      if (id && id.length > 1) {
        const target = document.querySelector(id);
        if (target) {
          e.preventDefault();
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    });
  });
}
