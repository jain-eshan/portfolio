/* ============================================================
   draggable.js — pointer-event drag system with session persistence
   No dependencies. Works on mouse, touch, pen via Pointer Events.
   ============================================================ */

const STORAGE_KEY = 'ej.drag.v1';

function loadStore() {
  try { return JSON.parse(sessionStorage.getItem(STORAGE_KEY) || '{}'); }
  catch { return {}; }
}
function saveStore(store) {
  try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(store)); } catch {}
}

const globalStore = loadStore();

// clamp helper
const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

// z-index stacking — each new drag goes on top
let zCounter = 100;

export function makeDraggable(el, opts = {}) {
  const id = el.dataset.dragId || opts.id;
  if (!id) {
    console.warn('[draggable] element missing data-drag-id', el);
    return () => {};
  }

  const persist = opts.persist !== false;
  const maxRotate = opts.maxRotate ?? 6;
  const scaleOnDrag = opts.scaleOnDrag ?? 1.05;

  // Read resting rotation from --rotate CSS var (preserves sticker tilt through drag cycle)
  const rotateVar = getComputedStyle(el).getPropertyValue('--rotate').trim();
  const baseRotate = rotateVar ? parseFloat(rotateVar) || 0 : 0;

  let offsetX = 0, offsetY = 0;
  let startClientX = 0, startClientY = 0;
  let lastClientX = 0, lastClientY = 0;
  let lastT = 0;
  let velX = 0, velY = 0;
  let dragging = false;
  let pointerId = null;
  let tiltDeg = 0;
  let restoreTimer = null;

  function apply(rotate = tiltDeg, scale = 1) {
    el.style.transform = `translate3d(${offsetX}px, ${offsetY}px, 0) rotate(${baseRotate + rotate}deg) scale(${scale})`;
  }

  // Restore persisted position
  if (persist && globalStore[id]) {
    offsetX = globalStore[id].x || 0;
    offsetY = globalStore[id].y || 0;
    apply(0, 1);
  }

  function onDown(e) {
    if (e.button !== undefined && e.button !== 0) return;
    // Ignore if the user clicked a link/button inside the draggable (let it through)
    const target = e.target;
    if (target !== el && (target.closest?.('a, button') && !target.closest?.('.drag-handle'))) {
      // Only block if the inner link was clicked directly
      if (target.tagName === 'A' || target.tagName === 'BUTTON') return;
    }

    pointerId = e.pointerId;
    dragging = true;
    startClientX = e.clientX - offsetX;
    startClientY = e.clientY - offsetY;
    lastClientX = e.clientX;
    lastClientY = e.clientY;
    lastT = performance.now();
    velX = 0; velY = 0;
    tiltDeg = 0;

    try { el.setPointerCapture(pointerId); } catch {}
    el.classList.add('is-dragging');
    document.body.classList.add('is-dragging-global');
    el.style.zIndex = String(++zCounter);
    el.style.transition = 'none';
    apply(0, scaleOnDrag);
    e.preventDefault();
  }

  function onMove(e) {
    if (!dragging || e.pointerId !== pointerId) return;
    const dx = e.clientX - startClientX;
    const dy = e.clientY - startClientY;

    const now = performance.now();
    const dt = Math.max(1, now - lastT);
    velX = (e.clientX - lastClientX) / dt;
    velY = (e.clientY - lastClientY) / dt;
    lastClientX = e.clientX;
    lastClientY = e.clientY;
    lastT = now;

    offsetX = dx;
    offsetY = dy;

    // Rotation follows horizontal velocity (feels alive)
    const targetTilt = clamp(velX * 25, -maxRotate, maxRotate);
    tiltDeg = tiltDeg * 0.7 + targetTilt * 0.3; // smooth

    apply(tiltDeg, scaleOnDrag);
  }

  function onUp(e) {
    if (!dragging || e.pointerId !== pointerId) return;
    dragging = false;
    try { el.releasePointerCapture(pointerId); } catch {}
    el.classList.remove('is-dragging');
    document.body.classList.remove('is-dragging-global');

    // Apply inertia fling
    const inertiaX = clamp(velX * 90, -160, 160);
    const inertiaY = clamp(velY * 90, -160, 160);
    offsetX += inertiaX;
    offsetY += inertiaY;

    // Ease to rest with a spring-ish cubic-bezier
    el.style.transition = 'transform 0.75s cubic-bezier(0.22, 1, 0.36, 1)';
    tiltDeg = 0;
    apply(0, 1);

    // Persist after the transition completes
    clearTimeout(restoreTimer);
    restoreTimer = setTimeout(() => {
      el.style.transition = '';
      if (persist) {
        globalStore[id] = { x: offsetX, y: offsetY };
        saveStore(globalStore);
      }
    }, 780);
  }

  // Double-click to reset this tile
  function onDblClick(e) {
    e.preventDefault();
    offsetX = 0;
    offsetY = 0;
    tiltDeg = 0;
    el.style.transition = 'transform 0.6s cubic-bezier(0.22, 1, 0.36, 1)';
    apply(0, 1);
    setTimeout(() => { el.style.transition = ''; }, 620);
    if (persist) {
      delete globalStore[id];
      saveStore(globalStore);
    }
  }

  el.addEventListener('pointerdown', onDown);
  el.addEventListener('pointermove', onMove);
  el.addEventListener('pointerup', onUp);
  el.addEventListener('pointercancel', onUp);
  el.addEventListener('dblclick', onDblClick);

  // touch-action: none is applied via CSS so the browser doesn't steal the gesture

  // Return a disposer
  return () => {
    el.removeEventListener('pointerdown', onDown);
    el.removeEventListener('pointermove', onMove);
    el.removeEventListener('pointerup', onUp);
    el.removeEventListener('pointercancel', onUp);
    el.removeEventListener('dblclick', onDblClick);
  };
}

// Bulk init
export function initDraggables(selector = '[data-drag]') {
  const els = document.querySelectorAll(selector);
  const disposers = [];
  els.forEach(el => disposers.push(makeDraggable(el)));
  return () => disposers.forEach(d => d());
}

// Reset all drag positions (preserves resting rotation from --rotate var)
export function resetAllDraggables() {
  try { sessionStorage.removeItem(STORAGE_KEY); } catch {}
  document.querySelectorAll('[data-drag]').forEach(el => {
    const rotateVar = getComputedStyle(el).getPropertyValue('--rotate').trim();
    const baseRotate = rotateVar ? parseFloat(rotateVar) || 0 : 0;
    el.style.transition = 'transform 0.7s cubic-bezier(0.22, 1, 0.36, 1)';
    el.style.transform = `translate3d(0,0,0) rotate(${baseRotate}deg) scale(1)`;
    setTimeout(() => {
      el.style.transition = '';
      // Restore CSS-driven transform by clearing inline
      el.style.transform = '';
      el.style.zIndex = '';
    }, 720);
  });
  Object.keys(globalStore).forEach(k => delete globalStore[k]);
}
