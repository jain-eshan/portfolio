/* ============================================================
   blog.js — entry point for /blog.html
   Shares the same stylesheet + drawer + posts loader as homepage.
   ============================================================ */

import './styles/index.css';
import { initWritings } from './lib/writings.js';

/* ============================================================
   Live clock (Delhi time) — kept for brand consistency
   ============================================================ */
const clockEl = document.getElementById('clock');
const dateEl = document.getElementById('date');
function updateClock() {
  const now = new Date();
  const options = { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' };
  const dateOpts = { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'Asia/Kolkata' };
  if (clockEl) clockEl.textContent = now.toLocaleTimeString('en-US', options);
  if (dateEl) dateEl.textContent = now.toLocaleDateString('en-US', dateOpts);
}
updateClock();
setInterval(updateClock, 30_000);

/* ============================================================
   Scroll reveal
   ============================================================ */
function observeReveal() {
  const revealEls = document.querySelectorAll('[data-reveal]');
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
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('is-visible'));
  }
}

/* ============================================================
   Init — mount writings list, then observe reveals
   ============================================================ */
initWritings();
// writings are rendered after async fetch; re-observe shortly after
setTimeout(observeReveal, 0);
setTimeout(observeReveal, 300);
