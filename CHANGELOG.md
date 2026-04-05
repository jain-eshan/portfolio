# Changelog — eshanjain.in

All notable changes to the portfolio. Follows [Keep a Changelog](https://keepachangelog.com) loosely.

---

## [Unreleased]

---

## [2.3.1] — 2026-04-05

### Fixed
- **Empty writings card on homepage** — rows were injected into the DOM after the global `IntersectionObserver` had already scanned `[data-reveal]` elements, leaving them permanently at `opacity: 0`. `writings.js` now explicitly adds `.is-visible` with a staggered cascade after injection.
- **Writing row typography too large** — title was `clamp(20px, 2.4vw, 28px)`, nearly double the project/role row sizes (15–17px). Scaled to `16px / weight 500` to match the site's list baseline. Excerpt from 14px → 13px, row padding from 22px → 16px.

### Changed
- **Cursor tour confined + calmer** — X position clamped to 12–48% of viewport width; no longer swings across the full page. Travel time 1.8s → 2.6s, dwell 2.0s → 2.4s. Waypoint offsets re-tuned toward left edge of each target.
- **Top-info (Delhi clock) non-sticky** — changed from `position: fixed` to `position: absolute`; lives in the hero and scrolls away naturally. Card background / blur removed.

### Removed
- **MergerDeck** — project row + footer link removed (project no longer active).
- **Fitin footer link** — `Fitin ↗` logo link removed from footer.
- **Instagram** — removed from links drawer and footer across the site for a cleaner, more professional feel.

### Added
- **`CONTENT.md`** — full copy dump of every user-visible string on the homepage, formatted for easy editing and hand-back syncing.

---

## [2.3] — 2026-04-05

### Added
- **Eshan cursor guided tour** (`src/lib/cursor-tour.js`) — autonomous cursor hops between 10 key-page waypoints (name, CTA, experience, expertise, projects, writings, links, contact). Respects `prefers-reduced-motion`, pauses on tab hide, re-evaluates on scroll/resize. Smooth `cubic-bezier(0.65, 0.05, 0.35, 1)` glide with pulse on arrival.
- **Homepage writings card** — posts now appear in a fixed-height card (`max-height: 520px`) with internal scroll, matching blog-page list style. Footer shows "Scroll for more ↓" and "See all writings ↗" CTA.

### Fixed
- **Sticky header text overlap** — `.top-info` now has translucent background + backdrop blur so content beneath it doesn't bleed through on scroll.
- **`build-posts.js` — invalid file skipping** — files without `title`/`date` frontmatter (e.g. Obsidian's default `Welcome.md`) and unfilled template placeholders are silently skipped at build time.

### Changed
- **Mobile polish** — collab toggle hidden on ≤900px screens. Hero/section/footer side padding bumped from 5vw → 7vw.
- **Social links updated** — Instagram `@eshan_jainn`, WhatsApp `+91 98688 63129`, email `workwitheshanjain@gmail.com` applied everywhere (drawer + footer).
- **Eshan cursor no longer uses CSS drift animation** — `@keyframes cursorDrift` removed; position is now fully JS-driven via `translate3d`.

---

## [2.2] — 2026-04-04

### Added
- **Obsidian-backed blog system** — Markdown files in `/posts/*.md` compiled to `public/posts.json` at build time via `scripts/build-posts.js`. Supports YAML frontmatter (`title`, `date`, `slug`, `excerpt`, `tags`, `published`), Obsidian wikilink cleanup, read-time estimate.
- **`/blog.html`** — dedicated writings listing page (Vite multi-page build).
- **90vh post drawer** — bottom slide-in reader with URL hash deep-linking (`#post-<slug>`), keyboard close (`Esc`), and `history.pushState` on open/close.
- **`npm run posts`** — standalone script to rebuild `posts.json` without a full Vite build.
- **GitHub Actions daily rebuild** (`.github/workflows/daily-rebuild.yml`) — cron at 01:00 UTC pings Vercel deploy hook to pick up new Obsidian posts pushed overnight.

### Changed
- `npm run dev` and `npm run build` both pre-run `build-posts.js` so the blog is always current.

---

## [2.1] — 2026-04-03

### Added
- **Collab-gated draggable canvas** — word-level drag for ESHAN / JAIN name blocks, expertise cards, and stickers. Gated behind a "Collaboration" toggle (desktop + fine-pointer only). Positions persist in `sessionStorage`.
- **Links drawer** — right-side slide-in panel listing LinkedIn, WhatsApp, and email. Triggered by the `LINKS` side ribbon.
- **"You" cursor** — second custom cursor that follows the mouse, visible only when collab mode is on.
- **Reset layout button** — restores all draggables to default positions.

---

## [2.0] — 2026-04-02

### Added
- Full redesign — interactive canvas, dot-grid background with parallax, animated hero name, scroll-reveal sections.
- Eshan cursor (floating autonomous label cursor).
- Live Delhi clock + weather display.
- Google Analytics + Microsoft Clarity.

---

## [1.0] — 2026-03-01

### Added
- Initial portfolio — static HTML/CSS, no interactivity.
