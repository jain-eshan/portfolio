# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # build posts.json then start Vite on localhost:3000
npm run build     # build posts.json then Vite production build → dist/
npm run posts     # only regenerate public/posts.json (no Vite step)
npm run preview   # serve dist/ locally on port 4173
```

There are no tests or linting scripts. No framework CLI — everything is plain Vite.

## Architecture overview

**Stack:** Vanilla HTML + CSS + JS (no framework). Vite for bundling. `marked` for Markdown parsing. Deployed on Vercel.

### Two-page build

Vite is configured for multi-page output (`vite.config.js`):
- `index.html` → main portfolio (all sections in one file)
- `blog.html` → standalone writings listing page

Both pages share `src/styles/index.css` (single stylesheet, 1200+ lines). CSS design tokens live at the top as `--` custom properties.

### Blog pipeline (build-time)

```
/posts/*.md  →  scripts/build-posts.js  →  public/posts.json
```

`build-posts.js` runs as a Node script before every Vite build. It parses YAML frontmatter (custom inline parser — no `js-yaml`), strips Obsidian wikilinks, converts Markdown to HTML via `marked`, and writes `public/posts.json`. Posts with `published: false`, missing `title`/`date`, or unfilled template placeholders are silently skipped.

`public/posts.json` shape:
```json
{ "posts": [ { "title", "slug", "date", "dateDisplay", "excerpt", "tags", "readTime", "html" } ], "builtAt": "" }
```

### Runtime JS modules (`src/lib/`)

| File | Responsibility |
|---|---|
| `posts.js` | Fetch + cache `posts.json` at runtime (singleton, one in-flight promise) |
| `writings.js` | Render writing rows into `#writings-list` / `#writings-list-full`, wire click → drawer. Explicitly adds `.is-visible` to injected rows (they miss the global IntersectionObserver) |
| `post-drawer.js` | 90vh bottom drawer, lazily injected once into DOM. Handles `#post-<slug>` URL hash for deep-linking |
| `cursor-tour.js` | Autonomous Eshan cursor: tours WAYPOINTS (DOM selectors), only visits viewport-visible ones, clamps X to 12–48% vw band, `translate3d` driven |
| `draggable.js` | Pointer Events drag system with `sessionStorage` persistence. Gated by `body.is-collab-on` at pointerdown |
| `spline.js` | Lazy-loads Spline 3D viewer (desktop + no-reduced-motion only) |
| `tilt.js` | 3D hover tilt on cards via CSS `rotateX`/`rotateY` |

### `src/main.js` — orchestrator

Runs on `index.html` only. Responsibilities (in order):
1. Live Delhi clock (30s interval)
2. Scroll reveal via `IntersectionObserver` on `[data-reveal]` — fires once at page load; **dynamically injected elements must call `.classList.add('is-visible')` themselves**
3. Smooth anchor scroll
4. Desktop-only capability flags: `isFinePointer`, `isDesktop`, `reducedMotion`, `canDrag`
5. Collab toggle (`sessionStorage` key `ej.collab.v1`) — enables drag mode, shows "You" cursor
6. Mouse parallax for dot grid + "You" cursor position
7. Links drawer (right side-panel)
8. `initWritings()` — mounts homepage list + wires post drawer
9. `initCursorTour()` — Eshan cursor tour (desktop + no-reduced-motion only)

### Drag system rules

- All draggable elements need `data-drag`, `data-drag-id` (unique string), `data-drag-label` attributes
- Drag is always initialised on desktop but only *activates* when `body.is-collab-on` — check the `pointerdown` guard in `draggable.js`
- Positions persist per session in `sessionStorage` under key `ej.drag.v1` (map of `dragId → {x, y}`)

### Responsive breakpoints

| Breakpoint | What changes |
|---|---|
| `max-width: 900px` | Collab toggle hidden, cursor hidden, hero padding 7vw, single-column sections, drag disabled |
| `max-width: 720px` | Writing rows collapse side column |
| `max-width: 500px` | Name font clamps smaller, stickers hidden |
| `prefers-reduced-motion` | All animations off, cursors hidden, cursor tour skipped |

## Content editing

**`CONTENT.md`** — mirrors every piece of user-visible copy on the homepage in Markdown. Edit this and ask Claude to sync it to `index.html`.

**Posts** — add a `.md` file to `/posts/` with YAML frontmatter:
```yaml
---
title: "Post title"
date: 2026-04-05
slug: post-slug
excerpt: "One sentence."
tags: [product, ai]
---
Body in Markdown.
```
Posts auto-publish on the next `npm run build` or via the daily GitHub Actions cron (`.github/workflows/daily-rebuild.yml`) which pings Vercel's deploy hook stored in `VERCEL_DEPLOY_HOOK_URL` GitHub Actions secret.

## Deployment

Push to `main` → Vercel auto-deploys. `vercel.json` sets immutable cache headers on `/assets/*` (Vite hashes filenames). `cleanUrls: true` so `/blog` works without `.html`.
