import './styles/index.css';

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
   Scroll reveal (IntersectionObserver)
   ============================================================ */
const revealEls = document.querySelectorAll('[data-reveal]');
if ('IntersectionObserver' in window) {
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry, i) => {
        if (entry.isIntersecting) {
          // Stagger items within the same parent for a cascade feel
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

/* ============================================================
   Smooth anchor scroll with easing
   ============================================================ */
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

/* ============================================================
   Subtle parallax on floating cursors based on mouse
   ============================================================ */
const cursors = document.querySelectorAll('.cursor-float');
if (cursors.length && window.matchMedia('(pointer: fine)').matches) {
  let rafId = null;
  let tx = 0, ty = 0;
  window.addEventListener('mousemove', (e) => {
    tx = (e.clientX / window.innerWidth - 0.5) * 20;
    ty = (e.clientY / window.innerHeight - 0.5) * 20;
    if (!rafId) {
      rafId = requestAnimationFrame(() => {
        cursors.forEach((c, i) => {
          const factor = (i + 1) * 0.3;
          c.style.setProperty('--mx', `${tx * factor}px`);
          c.style.setProperty('--my', `${ty * factor}px`);
        });
        rafId = null;
      });
    }
  });
}
