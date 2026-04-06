/* ============================================================
   cases.js — Fetch + render case studies on /work page
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
  const pills = c.role.map(r => `<span class="case-study__pill">${r}</span>`).join('');
  const linkHtml = c.link
    ? `<a href="${c.link}" target="_blank" rel="noopener" class="case-study__link">Visit ${c.title} <span class="arrow">↗</span></a>`
    : '';
  const imageHtml = c.image
    ? `<div class="case-study__img"><img src="${c.image}" alt="${c.title} screenshot" loading="lazy" /></div>`
    : '';

  return `
    <article class="case-study" id="${c.slug}" data-reveal>
      ${imageHtml}
      <div class="case-study__content">
        <h2 class="case-study__name">${c.title}</h2>
        <p class="case-study__oneliner">${c.oneliner}</p>
        <div class="case-study__role">${pills}</div>
        <div class="case-study__body">${c.html}</div>
        ${linkHtml}
      </div>
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
      setTimeout(() => el.classList.add('is-visible'), i * 100);
    });
  } catch (err) {
    console.warn('[cases] Failed to load:', err);
    if (emptyEl) emptyEl.hidden = false;
  }
}
