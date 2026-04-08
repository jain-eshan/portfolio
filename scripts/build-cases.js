/* ============================================================
   build-cases.js
   Scans /cases/*.md, parses YAML frontmatter + body,
   converts to HTML, writes public/cases.json.
   Same pipeline as build-posts.js but for case studies.
   ============================================================ */

import { readdirSync, readFileSync, writeFileSync, mkdirSync, existsSync, cpSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { marked } from 'marked';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const CASES_DIR = join(ROOT, 'cases');
const OUT_DIR = join(ROOT, 'public');
const OUT_FILE = join(OUT_DIR, 'cases.json');

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
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (val.startsWith('[') && val.endsWith(']')) {
      val = val.slice(1, -1).split(',').map((s) => s.trim().replace(/^["']|["']$/g, '')).filter(Boolean);
    } else if (val === 'true') {
      val = true;
    } else if (val === 'false') {
      val = false;
    } else if (/^\d+$/.test(val)) {
      val = parseInt(val, 10);
    }
    meta[key] = val;
  }
  return { meta, body };
}

function cleanObsidianSyntax(md, imageDir = '') {
  const imgBase = imageDir ? `/images/${imageDir}/` : './assets/';
  return md
    // ![[image.png|350]] → <img src="..." width="350" />
    .replace(/!\[\[([^\]|]+)\|(\d+)\]\]/g, (_, file, width) =>
      `<img src="${imgBase}${file}" width="${width}" loading="lazy" />`)
    // ![[image.png]] → ![](path/image.png)
    .replace(/!\[\[([^\]]+)\]\]/g, (_, p) => `![](${p.startsWith('http') ? p : imgBase + p})`)
    .replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_, link, alias) => alias || link);
}

// Obsidian columns plugin: ```columns ... ``` → two-column HTML grid
function preprocessObsidianColumns(md) {
  return md.replace(/```columns\n([\s\S]*?)```/g, (_, inner) => {
    const segments = inner.split(/^===$/m);
    const cols = segments.slice(1).map((seg) => marked.parse(seg.trim()));
    if (cols.length === 0) return '';
    const colHtml = cols.map((c) => `<div class="md-col">${c}</div>`).join('');
    return `<div class="md-columns">${colHtml}</div>`;
  });
}

marked.setOptions({ gfm: true, breaks: false, headerIds: false, mangle: false });

function slugify(str) {
  return String(str).toLowerCase().trim()
    .replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-');
}

function main() {
  if (!existsSync(CASES_DIR)) {
    console.log('[build-cases] No /cases directory found — creating one.');
    mkdirSync(CASES_DIR, { recursive: true });
  }

  const files = readdirSync(CASES_DIR).filter((f) => f.endsWith('.md'));
  const cases = [];

  for (const file of files) {
    const full = join(CASES_DIR, file);
    const raw = readFileSync(full, 'utf-8');
    const { meta, body } = parseFrontmatter(raw);

    if (meta.published === false) continue;
    if (!meta.title) {
      console.log(`[build-cases] skipping "${file}" — missing title`);
      continue;
    }

    const cleaned = cleanObsidianSyntax(body, meta.imageDir || '');
    const preprocessed = preprocessObsidianColumns(cleaned);
    const html = marked.parse(preprocessed);

    cases.push({
      title: meta.title,
      slug: meta.slug || slugify(meta.title),
      oneliner: meta.oneliner || '',
      role: Array.isArray(meta.role) ? meta.role : [],
      image: meta.image || '',
      link: meta.link || '',
      order: typeof meta.order === 'number' ? meta.order : 99,
      html,
    });
  }

  cases.sort((a, b) => a.order - b.order);

  if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(OUT_FILE, JSON.stringify({ cases, builtAt: new Date().toISOString() }, null, 2));

  console.log(`[build-cases] wrote ${cases.length} case(s) → public/cases.json`);
  for (const c of cases) console.log(`  · ${c.title} (${c.slug})`);

  // Copy case images to public/images/ so Vite serves them
  const IMAGES_SRC = join(ROOT, 'cases', 'images');
  const IMAGES_DEST = join(OUT_DIR, 'images');
  if (existsSync(IMAGES_SRC)) {
    cpSync(IMAGES_SRC, IMAGES_DEST, { recursive: true, force: true });
    console.log('[build-cases] copied cases/images/ → public/images/');
  }
}

main();
