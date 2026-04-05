/* ============================================================
   cursor-tour.js
   Autonomous "Eshan" cursor that tours waypoints across the
   page as a subtle guide. Waypoints are DOM elements; the
   cursor only moves to ones currently visible in the viewport,
   so scrolling always shows a relevant tour.
   ============================================================ */

// Waypoints are ordered top → bottom. Offsets pick a point inside each
// target element; we deliberately keep offsets near the left/centre so
// the cursor never flies out to the far right edge of the viewport.
const WAYPOINTS = [
  { selector: '.hero__name--line1',              offset: [0.18, 0.55] },
  { selector: '.hero__name--line2',              offset: [0.22, 0.55] },
  { selector: '.hero__cta .btn-primary',         offset: [0.50, 0.55] },
  { selector: '#experience .role-row',           offset: [0.08, 0.55] },
  { selector: '#expertise .expertise-card',      offset: [0.30, 0.45] },
  { selector: '#projects .project-row',          offset: [0.10, 0.55] },
  { selector: '#writings .writings-card',        offset: [0.14, 0.30] },
  { selector: '#contact .footer__email',         offset: [0.20, 0.55] },
];

// Confine cursor horizontally to a narrow band so it doesn't swing
// across the full page width (which looked abrupt). Vertical range
// is whatever is currently in the viewport.
const X_BAND_MIN = 0.12;   // 12% from left edge
const X_BAND_MAX = 0.48;   // 48% from left edge

const TRAVEL_MS = 2600;    // slower, calmer glide between waypoints
const DWELL_MS = 2400;     // time paused at each waypoint

let cursorEl = null;
let tourIndex = -1;
let timerId = null;
let rafId = null;
let hovered = false;  // pause when user is actively moving the mouse

function isVisibleInViewport(el) {
  const r = el.getBoundingClientRect();
  const vh = window.innerHeight;
  // Element must have some intersection with viewport (with slight padding)
  return r.bottom > 60 && r.top < vh - 60 && r.width > 0 && r.height > 0;
}

function nextVisibleWaypoint() {
  // Find the first visible waypoint after the current index.
  for (let i = 1; i <= WAYPOINTS.length; i++) {
    const idx = (tourIndex + i) % WAYPOINTS.length;
    const wp = WAYPOINTS[idx];
    const el = document.querySelector(wp.selector);
    if (el && isVisibleInViewport(el)) {
      return { idx, el, wp };
    }
  }
  return null;
}

function moveTo({ idx, el, wp }) {
  const rect = el.getBoundingClientRect();
  const [ox, oy] = wp.offset || [0.5, 0.5];
  let x = rect.left + rect.width * ox;
  let y = rect.top + rect.height * oy;

  // Clamp X into the narrow band so the cursor stays in a calm zone.
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const xMin = vw * X_BAND_MIN;
  const xMax = vw * X_BAND_MAX;
  x = Math.max(xMin, Math.min(xMax, x));
  // Keep Y comfortably inside the viewport.
  y = Math.max(vh * 0.18, Math.min(vh * 0.82, y));

  cursorEl.style.transform = `translate3d(${Math.round(x)}px, ${Math.round(y)}px, 0)`;
  cursorEl.classList.add('is-pulsing');
  setTimeout(() => cursorEl?.classList.remove('is-pulsing'), 900);
  tourIndex = idx;
}

function scheduleNext() {
  clearTimeout(timerId);
  timerId = setTimeout(() => {
    if (document.hidden) {
      // Tab in background — hold, resume on visibilitychange
      scheduleNext();
      return;
    }
    const next = nextVisibleWaypoint();
    if (next) moveTo(next);
    scheduleNext();
  }, TRAVEL_MS + DWELL_MS);
}

export function initCursorTour() {
  cursorEl = document.querySelector('.cursor-float--eshan');
  if (!cursorEl) return;

  // Honour reduced motion
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  // Reset any CSS-driven positioning — we control it entirely via JS now.
  cursorEl.style.animation = 'none';
  cursorEl.style.top = '0';
  cursorEl.style.left = '0';
  cursorEl.style.transition = `transform ${TRAVEL_MS}ms cubic-bezier(0.65, 0.05, 0.35, 1)`;

  // Kick off with a short delay so layout has settled
  setTimeout(() => {
    const first = nextVisibleWaypoint();
    if (first) moveTo(first);
    scheduleNext();
  }, 900);

  // Re-evaluate on scroll/resize — if the current waypoint leaves the viewport,
  // skip to the next visible one immediately instead of waiting the full dwell.
  let scrollTimer;
  const onScroll = () => {
    clearTimeout(scrollTimer);
    scrollTimer = setTimeout(() => {
      const current = WAYPOINTS[tourIndex];
      if (!current) return;
      const currentEl = document.querySelector(current.selector);
      if (!currentEl || !isVisibleInViewport(currentEl)) {
        clearTimeout(timerId);
        const next = nextVisibleWaypoint();
        if (next) moveTo(next);
        scheduleNext();
      }
    }, 150);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);

  // Pause on tab hide, resume on show
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      const next = nextVisibleWaypoint();
      if (next) moveTo(next);
    }
  });
}
