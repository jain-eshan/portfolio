/* ============================================================
   posts.js — fetch & cache posts.json (built from /posts/*.md)
   ============================================================ */

let cache = null;
let inflight = null;

export async function loadPosts() {
  if (cache) return cache;
  if (inflight) return inflight;

  inflight = fetch('/posts.json', { cache: 'no-cache' })
    .then((r) => {
      if (!r.ok) throw new Error(`posts.json ${r.status}`);
      return r.json();
    })
    .then((data) => {
      cache = Array.isArray(data?.posts) ? data.posts : [];
      return cache;
    })
    .catch((err) => {
      console.warn('[posts] failed to load', err);
      cache = [];
      return cache;
    })
    .finally(() => { inflight = null; });

  return inflight;
}

export function findPostBySlug(slug) {
  if (!cache || !slug) return null;
  return cache.find((p) => p.slug === slug) || null;
}
