/* ============================================================
   cases.js — Fetch + render case studies on /work page
   Andy Reff-inspired: full card with border, text left / image right
   ============================================================ */

let cached = null;

async function fetchCases() {
  if (cached) return cached;
  const res = await fetch('/cases.json');
  if (!res.ok) throw new Error(`cases.json: ${res.status}`);
  const data = await res.json();
  cached = data.cases || [];
  return cached;
}

function renderCaseStudy(c) {
  const tags = c.role.map(r => r.toUpperCase()).join(' · ');
  const linkHtml = c.link
    ? `<a href="${c.link}" target="_blank" rel="noopener" class="case-card__cta">View project <span class="arrow">→</span></a>`
    : '';
  const imageHtml = c.image
    ? `<div class="case-card__img"><img src="${c.image}" alt="${c.title}" loading="lazy" /></div>`
    : `<div class="case-card__img case-card__img--empty"></div>`;

  return `
    <article class="case-card" id="${c.slug}" data-reveal>
      <div class="case-card__left">
        <p class="case-card__tags">${tags}</p>
        <h2 class="case-card__title">${c.title}</h2>
        <p class="case-card__desc">${c.oneliner}</p>
        <div class="case-card__body">${c.html}</div>
        ${linkHtml}
      </div>
      ${imageHtml}
    </article>
  `;
}

export async function initCases() {
  const container = document.getElementById('case-studies');
  const emptyEl = document.getElementById('cases-empty');
  if (!container) return;

  try {
    const cases = await fetchCases();
    if (cases.length === 0) {
      if (emptyEl) emptyEl.hidden = false;
      return;
    }
    container.innerHTML = cases.map(renderCaseStudy).join('');
    // Manually add visibility since these were injected after IntersectionObserver ran
    container.querySelectorAll('[data-reveal]').forEach((el, i) => {
      setTimeout(() => el.classList.add('is-visible'), i * 150);
    });
  } catch (err) {
    console.warn('[cases] Failed to load:', err);
    if (emptyEl) emptyEl.hidden = false;
  }
}
