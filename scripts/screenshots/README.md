# Screenshot capture pipeline

Dependency-free tooling to screenshot every CampusIQ screen from a production
build. Uses only Node 22 built-ins (`fetch`, `WebSocket`, `child_process`) plus a
local Chrome/Chromium — no npm packages, no Playwright/Puppeteer install.

## Usage

```bash
# from the repo root
npm run build                                  # produce dist/
node scripts/screenshots/run.mjs               # capture all screens → screenshots/
INCLUDE_BRAIN=1 node scripts/screenshots/run.mjs  # include Campus Brain (/app/brain)
```

If the browser isn't auto-detected:

```bash
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  node scripts/screenshots/run.mjs
```

## How it works

1. `server.mjs` — a tiny static file server with SPA fallback (serves `dist/`).
2. `run.mjs` — launches the server + headless Chromium (with `--remote-debugging-port`),
   waits for both, then runs the capture.
3. `capture.mjs` — connects to Chromium over the DevTools Protocol, logs in via the
   real login form (demo accounts), navigates each module through the in-app sidebar
   (client-side routing, so the session never resets), and writes full-page PNGs.

## Files

| File | Role |
|------|------|
| `run.mjs` | Orchestrator (serve + launch browser + capture) |
| `server.mjs` | Static SPA file server |
| `capture.mjs` | CDP driver + screenshot logic |

Demo accounts used: `HOD2024001` (admin modules) and `STU2024001` (Student Hub),
both with password `password123`.
