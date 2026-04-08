import './styles/index.css';
import { initTheme, initReveal, initSmoothScroll } from './lib/shared.js';
import { initDraggables, resetAllDraggables } from './lib/draggable.js';
import { initWritings } from './lib/writings.js';
import { initCursorTour } from './lib/cursor-tour.js';

/* ============================================================
   Shared: theme, scroll reveal, smooth scroll
   ============================================================ */
initTheme();
initReveal();
initSmoothScroll();

/* ============================================================
   Live clock (Delhi time)
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
   Breakpoints + draggable init (desktop only)
   ============================================================ */
const isFinePointer = window.matchMedia('(pointer: fine)').matches;
const isDesktop = window.matchMedia('(min-width: 901px)').matches;
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const canDrag = isFinePointer && isDesktop && !reducedMotion;

if (canDrag) {
  // Initialize drag handlers on all [data-drag] elements.
  // Drag is gated inside draggable.js by body.is-collab-on — handlers are attached
  // but will bail on pointerdown unless collab is ON.
  initDraggables('[data-drag]');
}

/* ============================================================
   Collaboration toggle — default ON, persists for session
   ============================================================ */
const COLLAB_KEY = 'ej.collab.v1';
const collabBtn = document.getElementById('collab-toggle');
const collabLabel = collabBtn?.querySelector('.top-badge__label');

function setCollab(on) {
  document.body.classList.toggle('is-collab-on', on);
  if (collabBtn) collabBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
  if (collabLabel) collabLabel.textContent = on ? 'Collaboration on' : 'Collaboration off';
  try { sessionStorage.setItem(COLLAB_KEY, on ? '1' : '0'); } catch {}
}

// Restore from session (default ON if nothing stored)
try {
  const stored = sessionStorage.getItem(COLLAB_KEY);
  setCollab(stored !== '0');
} catch {
  setCollab(true);
}

/* ============================================================
   Live weather — Delhi via Open-Meteo (no API key)
   ============================================================ */
(async () => {
  const el = document.getElementById('weather');
  if (!el) return;
  try {
    const res = await fetch('https://api.open-meteo.com/v1/forecast?latitude=28.6139&longitude=77.2090&current=temperature_2m,weathercode');
    const data = await res.json();
    const temp = Math.round(data.current.temperature_2m);
    const code = data.current.weathercode;
    let icon = '☀︎';
    if (code >= 95) icon = '⛈';
    else if (code >= 71) icon = '🌨';
    else if (code >= 51) icon = '🌧';
    else if (code >= 45) icon = '🌫';
    else if (code >= 3) icon = '☁';
    else if (code >= 1) icon = '🌤';
    el.innerHTML = `${temp}°C <span class="top-info__icon">${icon}</span>`;
  } catch {}
})();

if (collabBtn && canDrag) {
  collabBtn.addEventListener('click', () => {
    const next = !document.body.classList.contains('is-collab-on');
    setCollab(next);
  });
} else if (collabBtn && !canDrag) {
  // On mobile / reduced-motion: button is decorative, stays OFF
  collabBtn.disabled = true;
  collabBtn.style.opacity = '0.55';
}

/* ============================================================
   Reset layout button
   ============================================================ */
const resetBtn = document.getElementById('reset-layout');
if (resetBtn) {
  resetBtn.addEventListener('click', () => {
    resetAllDraggables();
  });
}

/* ============================================================
   Mouse-bound "You" cursor + Eshan cursor parallax
   ============================================================ */
const eshanCursor = document.querySelector('.cursor-float--eshan');
const youCursor = document.getElementById('cursor-you');
const dotGrid = document.querySelector('.canvas-dots');

if (isFinePointer) {
  let rafId = null;
  let mx = 0, my = 0;       // parallax offsets
  let lastClientX = 0, lastClientY = 0;

  window.addEventListener('mousemove', (e) => {
    lastClientX = e.clientX;
    lastClientY = e.clientY;
    mx = (e.clientX / window.innerWidth - 0.5) * 20;
    my = (e.clientY / window.innerHeight - 0.5) * 20;

    if (!rafId) {
      rafId = requestAnimationFrame(() => {
        // Eshan cursor position is controlled by cursor-tour.js (guided tour)
        // You cursor exactly at mouse (only visible when collab on)
        if (youCursor) {
          youCursor.style.setProperty('--cx', `${lastClientX + 6}px`);
          youCursor.style.setProperty('--cy', `${lastClientY + 6}px`);
        }
        // Dot grid parallax
        if (dotGrid) {
          dotGrid.style.transform = `translate3d(${mx * 0.5}px, ${my * 0.5}px, 0)`;
        }
        rafId = null;
      });
    }
  });
}

/* ============================================================
   Links drawer (slide-in from right)
   ============================================================ */
const linksDrawer = document.getElementById('links-drawer');
const linksTrigger = document.getElementById('links-trigger');
const linksClose = document.getElementById('links-drawer-close');
const linksBackdrop = document.getElementById('links-drawer-backdrop');

function openDrawer() {
  if (linksDrawer) {
    linksDrawer.classList.add('is-open');
    linksDrawer.setAttribute('aria-hidden', 'false');
  }
}
function closeDrawer() {
  if (linksDrawer) {
    linksDrawer.classList.remove('is-open');
    linksDrawer.setAttribute('aria-hidden', 'true');
  }
}
/* ============================================================
   Writings (homepage list + post drawer)
   ============================================================ */
initWritings();

/* ============================================================
   Eshan cursor guided tour across page waypoints
   ============================================================ */
if (isFinePointer && !reducedMotion) {
  initCursorTour();
}

if (linksTrigger) linksTrigger.addEventListener('click', openDrawer);
if (linksClose) linksClose.addEventListener('click', closeDrawer);
if (linksBackdrop) linksBackdrop.addEventListener('click', closeDrawer);
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeDrawer();
});
