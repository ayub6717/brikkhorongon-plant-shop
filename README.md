# Brikkhorongon (বৃক্ষরঙ্গন)

A modern plant and bonsai shop frontend. English by default, Bangla at `/bn`, light theme by default with a dark mode toggle. The original 2021 Create React App version is kept in [`legacy/`](legacy) for reference.

**Stack:** Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4 · next-intl · Zustand · TanStack Query · React Hook Form + Zod · Framer Motion · Vitest · Playwright

## Features
- Shop with URL-driven filters, product pages with care info, JSON-LD and per-page metadata
- Bonsai collection with style and indoor/outdoor filters
- Cart, validated checkout with delivery scheduling, order confirmation
- Order tracking with a status timeline and change requests (pot, gift note, delivery date, custom)
- Care guides hub and a five-question plant finder quiz with shareable results
- English and Bangla, dark mode, keyboard-friendly, skip link, active menu state
- `sitemap.xml`, `robots.txt` and basic security headers

## Getting started
```bash
yarn install
yarn dev        # http://localhost:3000  (Bangla at /bn)
```

## Scripts
| Command | What it does |
| --- | --- |
| `yarn dev` | Start the dev server |
| `yarn build` / `yarn start` | Production build and server |
| `yarn lint` | ESLint |
| `yarn typecheck` | TypeScript, no emit |
| `yarn test` | Unit tests (Vitest) |
| `yarn test:e2e` | End-to-end tests (Playwright). First run: `yarn playwright install chromium` |

## Configuration
| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Public site URL used in sitemap, canonical data and JSON-LD (defaults to `http://localhost:3000`) |

## Architecture notes
- **No backend yet.** The cart and orders live in the browser (`localStorage` via Zustand `persist`). Order tracking has a clearly marked demo panel that stands in for the shop team. Replace the stores in `src/store` with API calls (REST or GraphQL, .NET or Node) and delete the demo panel when a real API exists.
- **Catalog data** is in `src/data`. Product text is English-only for now. Bonsai listings are sample data.
- **Placeholders to confirm before launch:** delivery fees and the free-shipping threshold (`src/lib/shipping.ts`), the 24-hour arrival guarantee copy, and the sample bonsai names, ages and prices.
- **Images:** product photos are in `public/images`. Bonsai photos load from Unsplash (see `next.config.ts`); replace them with your own before launch.
- **Locales:** `src/i18n` and `src/messages/{en,bn}.json`. Locale detection is off on purpose, so the site always opens in English.

## CI
GitHub Actions (`.github/workflows/ci.yml`) runs lint, typecheck, unit tests and a production build, then the Playwright smoke tests.
