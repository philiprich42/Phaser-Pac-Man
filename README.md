# Phaser Pac-Man

Arcade-style Pac-Man clone built with Phaser 3, TypeScript, Vitest, and Playwright.

## Stack

- Phaser 3
- TypeScript
- Vite
- Vitest
- Playwright
- GitHub Actions
- Vercel

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:5173`.

## Scripts

```bash
npm run dev
npm run build
npm run lint
npm run test
npm run test:e2e
```

## Gameplay status

Implemented through Phase 9 of the project plan:

- Maze rendering and tile movement
- Ghost AI and pathing
- Lives, levels, fruit, frightened mode, and scoring
- Procedural visual and audio polish
- Buffered keyboard and swipe controls
- Unit and Playwright E2E coverage
- GitHub Actions CI and Vercel-ready deployment setup

## CI

GitHub Actions runs:

1. `npm ci`
2. `npm run lint`
3. `npm run test`
4. `npm run build`
5. `npx playwright install --with-deps chromium`
6. `npm run test:e2e`

Workflow file: [.github/workflows/ci.yml](/C:/PersonalDev/Phaser-Pac-Man/.github/workflows/ci.yml)

## Deploy to Vercel

The repo is Vercel-ready as a standard Vite app.

Use these settings if Vercel does not auto-detect them:

- Framework preset: `Vite`
- Build command: `npm run build`
- Output directory: `dist`

Connect the GitHub repository in Vercel and deployments will be created from pushes and pull requests.
