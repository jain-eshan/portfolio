/* ============================================================
   cursor-tour.js
   Autonomous "Eshan" cursor that tours waypoints across the
   page as a subtle guide. Waypoints are DOM elements; the
   cursor only moves to ones currently visible in the viewport,
   so scrolling always shows a relevant tour.
   ============================================================ */

const WAYPOINTS = [
  // Ordered: top of page → bottom. Offsets place the cursor's tip
  // near the bottom-right of the target so the arrow "points at" it.
  { selector: '.hero__name--line1',              offset: [0.55, 0.45] },
  { selector: '#collab-toggle',                  offset: [0.35, 0.70] },
  { selector: '.hero__name--line2',              offset: [0.70, 0.45] },
  { selector: '.hero__cta .btn-primary',         offset: [0.55, 0.55] },
  { selector: '#experience .role-row',           offset: [0.10, 0.55] },
  { selector: '#expertise .expertise-card',      offset: [0.65, 0.50] },
  { selector: '#projects .project-row',          offset: [0.15, 0.55] },
  { selector: '#writings .writings-card',        offset: [0.12, 0.25] },
  { selector: '#links-trigger',                  offset: [0.35, 0.50] },
  { selector: '#contact .footer__email',         offset: [0.45, 0.60] },
];

const TRAVEL_MS = 1800;      // time to glide between waypoints
const DWELL_MS = 2000;       // time paused at each waypoint

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
  const x = Math.round(rect.left + rect.width * ox);
  const y = Math.round(rect.top + rect.height * oy);

  cursorEl.style.transform = `translate3d(${x}px, ${y}px, 0)`;
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
