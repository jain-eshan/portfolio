# eshanjain.in

Personal portfolio for **Eshan Jain** — Product Manager, designer & builder.
Co-founder at Fitin Club, currently at Visit Health, incoming ISB YLP.

Live site: [eshanjain.in](https://eshanjain.in)

## Stack

- **Vite** — build tool and dev server
- **Vanilla HTML + CSS + JS** — no framework overhead, fast loads
- **Google Fonts** — Inter (body) + VT323 (pixel accents)
- **Vercel** — hosting + CI/CD via GitHub integration

## Local development

```bash
npm install
npm run dev      # starts Vite on http://localhost:3000
npm run build    # production build into dist/
npm run preview  # preview the production build locally
```

## Project structure

```
portfolio/
├── index.html            # single-page markup for all sections
├── src/
│   ├── main.js           # clock, scroll reveal, parallax, smooth scroll
│   └── styles/
│       └── index.css     # design tokens, layout, animations
├── public/               # static assets (served as-is)
├── vite.config.js
└── package.json
```

## Deployment

Every push to `main` auto-deploys to Vercel. Production aliases to `eshanjain.in`.

1. Push to `main` on GitHub
2. Vercel build runs: `npm install && npm run build`
3. Output in `dist/` is published to the CDN
