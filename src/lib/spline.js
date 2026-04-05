/* ============================================================
   spline.js — Lazy-loaded Spline 3D viewer with graceful fallback.
   If the viewer script or scene fails, the CSS fallback stays visible.
   Replace SCENE_URL with your own scene from spline.design (free tier).
   ============================================================ */

// Default scene URL — replace with your own Spline scene export.
// To swap: Spline app → Share → Export → Code → copy the .splinecode URL.
const SCENE_URL = 'https://prod.spline.design/6Wq1Q7YGyM-iab9i/scene.splinecode';
const VIEWER_CDN = 'https://unpkg.com/@splinetool/viewer@1.9.28/build/spline-viewer.js';

export function loadSplineHero(containerId = 'hero3d', sceneUrl = SCENE_URL) {
  // Bail on mobile (heavy) and reduced motion
  if (!window.matchMedia('(min-width: 1024px)').matches) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const container = document.getElementById(containerId);
  if (!container) return;

  // Wait for idle, then load
  const start = () => {
    const script = document.createElement('script');
    script.type = 'module';
    script.src = VIEWER_CDN;
    script.onload = () => {
      try {
        const viewer = document.createElement('spline-viewer');
        viewer.setAttribute('url', sceneUrl);
        viewer.setAttribute('loading-anim-type', 'none');
        viewer.style.width = '100%';
        viewer.style.height = '100%';
        viewer.style.pointerEvents = 'none';
        viewer.style.opacity = '0';
        viewer.style.transition = 'opacity 0.9s ease';

        // On load, fade in and hide fallback
        viewer.addEventListener('load', () => {
          viewer.style.opacity = '1';
          container.classList.add('has-spline');
        });
        // If the scene URL 404s or errors, just leave the fallback
        viewer.addEventListener('error', () => {
          viewer.remove();
        });

        container.appendChild(viewer);
      } catch (e) {
        // fallback cube stays
      }
    };
    script.onerror = () => {
      // CDN blocked — fallback stays
    };
    document.head.appendChild(script);
  };

  if ('requestIdleCallback' in window) {
    requestIdleCallback(start, { timeout: 2500 });
  } else {
    setTimeout(start, 800);
  }
}
