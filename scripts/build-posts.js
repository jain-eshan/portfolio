/* ============================================================
   build-posts.js
   Scans /posts/*.md, parses YAML frontmatter + body,
   converts to HTML, writes public/posts.json.
   Runs as part of `npm run build` and `npm run dev`.
   ============================================================ */

import { readdirSync, readFileSync, writeFileSync, mkdirSync, existsSync, cpSync } from 'node:fs';
import { join, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { marked } from 'marked';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const POSTS_DIR = join(ROOT, 'posts');
const OUT_DIR = join(ROOT, 'public');
const OUT_FILE = join(OUT_DIR, 'posts.json');

// Minimal YAML frontmatter parser — supports:
//   key: value
//   key: "quoted value"
//   key: [item, item]  (inline arrays)
//   key: true/false (booleans)
//   key: 2025-03-10 (ISO dates stay as strings)
function parseFrontmatter(raw) {
  const match = raw.match(/^---\s*\n([\s\S]*?)\n---\s*\n?([\s\S]*)$/);
  if (!match) return { meta: {}, body: raw };
  const [, metaRaw, body] = match;
  const meta = {};
  for (const line of metaRaw.split('\n')) {
    const m = line.match(/^([a-zA-Z0-9_-]+)\s*:\s*(.*)$/);
    if (!m) continue;
    const key = m[1];
    let val = m[2].trim();
    // Strip surrounding quotes
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    // Inline arrays
    if (val.startsWith('[') && val.endsWith(']')) {
      val = val.slice(1, -1).split(',').map((s) => s.trim().replace(/^["']|["']$/g, '')).filter(Boolean);
    } else if (val === 'true') {
      val = true;
    } else if (val === 'false') {
      val = false;
    }
    meta[key] = val;
  }
  return { meta, body };
}

// Obsidian quirks: strip wikilinks [[...]] → plain text (or convert to <a> if it's a URL)
function cleanObsidianSyntax(md, imageDir = '') {
  const imgBase = imageDir ? `/images/${imageDir}/` : './assets/';
  return md
    // ![[image.png|350]] → <img src="..." width="350" />
    .replace(/!\[\[([^\]|]+)\|(\d+)\]\]/g, (_, file, width) =>
      `<img src="${imgBase}${file}" width="${width}" loading="lazy" />`)
    // ![[image.png]] → ![](path/image.png)
    .replace(/!\[\[([^\]]+)\]\]/g, (_, p) => `![](${p.startsWith('http') ? p : imgBase + p})`)
    // [[wikilink]] → wikilink (plain text, not followable)
    .replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_, link, alias) => alias || link);
}

// Obsidian columns plugin: ```columns ... ``` → two-column HTML grid
function preprocessObsidianColumns(md) {
  return md.replace(/```columns\n([\s\S]*?)```/g, (_, inner) => {
    const segments = inner.split(/^===$/m);
    // First segment is metadata (id: ...) — skip it; remainder are columns
    const cols = segments.slice(1).map((seg) => marked.parse(seg.trim()));
    if (cols.length === 0) return '';
    const colHtml = cols.map((c) => `<div class="md-col">${c}</div>`).join('');
    return `<div class="md-columns">${colHtml}</div>`;
  });
}

// Configure marked — GitHub-flavored, safe defaults
marked.setOptions({
  gfm: true,
  breaks: false,
  headerIds: false,
  mangle: false,
});

function slugify(str) {
  return String(str)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function isoDate(val) {
  if (!val) return '';
  const d = new Date(val);
  if (isNaN(d)) return String(val);
  return d.toISOString().slice(0, 10);
}

function formatDisplayDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d)) return iso;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function estimateReadTime(body) {
  const words = body.trim().split(/\s+/).length;
  const minutes = Math.max(1, Math.round(words / 220));
  return `${minutes} min read`;
}

function main() {
  if (!existsSync(POSTS_DIR)) {
    console.log('[build-posts] No /posts directory found — creating one.');
    mkdirSync(POSTS_DIR, { recursive: true });
  }

  const files = readdirSync(POSTS_DIR).filter((f) => f.endsWith('.md'));
  const posts = [];

  for (const file of files) {
    const full = join(POSTS_DIR, file);
    const raw = readFileSync(full, 'utf-8');
    const { meta, body } = parseFrontmatter(raw);

    // Skip drafts + explicit unpublished
    if (meta.published === false) continue;

    // Skip files without frontmatter entirely (notes, scratchpads, Obsidian
    // default "Welcome.md" etc.) — a valid post needs at least title + date.
    if (!meta.title || !meta.date) {
      console.log(`[build-posts] skipping "${file}" — missing title or date frontmatter`);
      continue;
    }

    // Skip unfilled template placeholders so the starter doesn't ship
    if (meta.slug === 'url-friendly-slug' || meta.title === 'Your post title') {
      console.log(`[build-posts] skipping "${file}" — template placeholder not filled in`);
      continue;
    }

    const title = meta.title;
    const slug = meta.slug || slugify(title);
    const date = isoDate(meta.date);
    const excerpt = meta.excerpt || '';
    const tags = Array.isArray(meta.tags) ? meta.tags : [];

    const cleaned = cleanObsidianSyntax(body, meta.imageDir || '');
    const preprocessed = preprocessObsidianColumns(cleaned);
    const html = marked.parse(preprocessed);

    posts.push({
      title,
      slug,
      date,
      dateDisplay: formatDisplayDate(date),
      excerpt,
      tags,
      readTime: estimateReadTime(body),
      html,
    });
  }

  // Sort newest first
  posts.sort((a, b) => (b.date || '').localeCompare(a.date || ''));

  if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(OUT_FILE, JSON.stringify({ posts, builtAt: new Date().toISOString() }, null, 2));

  console.log(`[build-posts] wrote ${posts.length} post(s) → public/posts.json`);
  for (const p of posts) console.log(`  · ${p.dateDisplay || '—'}  ${p.title}  (${p.slug})`);

  // Copy post images to public/images/ so Vite serves them
  const IMAGES_SRC = join(ROOT, 'posts', 'images');
  const IMAGES_DEST = join(OUT_DIR, 'images');
  if (existsSync(IMAGES_SRC)) {
    cpSync(IMAGES_SRC, IMAGES_DEST, { recursive: true, force: true });
    console.log('[build-posts] copied posts/images/ → public/images/');
  }
}

main();
