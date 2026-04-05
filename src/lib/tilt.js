/* ============================================================
   tilt.js — 3D hover tilt for cards (CSS rotateX / rotateY)
   Pure CSS transforms driven by mouse position. No library.
   ============================================================ */

export function makeTilt(el, opts = {}) {
  const maxTilt = opts.maxTilt ?? 8;      // degrees
  const scale = opts.scale ?? 1.02;
  const perspective = opts.perspective ?? 900;
  const speed = opts.speed ?? 400;         // ms

  let rafId = null;
  let targetRX = 0, targetRY = 0, curRX = 0, curRY = 0;
  let active = false;

  el.style.transformStyle = 'preserve-3d';
  el.style.willChange = 'transform';

  function onMove(e) {
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;  // 0..1
    const py = (e.clientY - rect.top) / rect.height;  // 0..1
    // center the values
    targetRY = (px - 0.5) * maxTilt * 2;
    targetRX = -(py - 0.5) * maxTilt * 2;
    if (!rafId) loop();
  }

  function onEnter() {
    active = true;
    el.style.transition = `transform ${speed}ms cubic-bezier(0.22, 1, 0.36, 1)`;
  }

  function onLeave() {
    active = false;
    targetRX = 0;
    targetRY = 0;
    el.style.transition = `transform ${speed * 1.5}ms cubic-bezier(0.22, 1, 0.36, 1)`;
    el.style.transform = `perspective(${perspective}px) rotateX(0deg) rotateY(0deg) scale(1)`;
    cancelAnimationFrame(rafId);
    rafId = null;
  }

  function loop() {
    // Smooth interpolation
    curRX += (targetRX - curRX) * 0.15;
    curRY += (targetRY - curRY) * 0.15;
    el.style.transform = `perspective(${perspective}px) rotateX(${curRX}deg) rotateY(${curRY}deg) scale(${active ? scale : 1})`;
    if (active && (Math.abs(targetRX - curRX) > 0.01 || Math.abs(targetRY - curRY) > 0.01)) {
      rafId = requestAnimationFrame(loop);
    } else {
      rafId = null;
    }
  }

  el.addEventListener('mouseenter', onEnter);
  el.addEventListener('mousemove', onMove);
  el.addEventListener('mouseleave', onLeave);

  return () => {
    el.removeEventListener('mouseenter', onEnter);
    el.removeEventListener('mousemove', onMove);
    el.removeEventListener('mouseleave', onLeave);
    cancelAnimationFrame(rafId);
    el.style.transform = '';
  };
}

export function initTilts(selector = '[data-tilt]') {
  if (!window.matchMedia('(pointer: fine)').matches) return () => {};
  const els = document.querySelectorAll(selector);
  const disposers = [];
  els.forEach(el => disposers.push(makeTilt(el)));
  return () => disposers.forEach(d => d());
}
