# CampusIQ — Application Screenshots & Smoke Test

**Generated:** June 29, 2026
**Build under test:** production build (`dist/`) served headlessly and walked end-to-end
**Auth:** demo accounts (HOD `HOD2024001`, Student `STU2024001`) via the in-app login flow

This document is a visual smoke test of the CampusIQ frontend. Every screen below
was captured from the **actually-running application** — the production bundle was
served, logged into through the real login form, and each module was reached by
clicking its sidebar navigation (client-side routing), then captured full-page.

---

## Smoke Test Summary

| Check | Result |
|-------|--------|
| App boots & renders | ✅ Pass |
| Login (HOD / admin role) | ✅ Pass |
| Login (Student role) | ✅ Pass |
| Role-based navigation (sidebar reflects role) | ✅ Pass |
| All admin modules render with live data | ✅ 18 / 18 |
| Student module renders | ✅ 1 / 1 |
| Public pages (login, about, canteen portal) | ✅ 3 / 3 |
| **Total screens captured** | **✅ 22 / 22** |

> ⚠️ **Campus Brain (`/app/brain`) is not shown below.** These screenshots were
> taken from the existing `dist/` build, which predates the new Campus Brain
> feature. To include Campus Brain, rebuild (`npm run build`) and re-run the
> capture with `INCLUDE_BRAIN=1` (see [Regenerating](#regenerating) below).
> The Campus Brain code itself is committed and type-checked — it only needs a
> fresh build to appear in the bundle.

---

## Executive & Administrative

### Campus Command Center
Real-time campus intelligence: health score, operational status, events timeline,
resource usage, pulse trend, service alerts, live activity feed, AI recommendations.

![Campus Command Center](screenshots/01-command-center.png)

### AI Campus Copilot
Natural-language assistant with quick prompts and context-aware campus insights.

![AI Campus Copilot](screenshots/03-campus-copilot.png)

### Campus Intelligence Centre
Live operational activity canvas across campus zones with the Campus Pulse panel.

![Campus Intelligence Centre](screenshots/04-intelligence-centre.png)

### Campus Analytics Center
Cohort analytics, risk trends, and departmental breakdowns.

![Campus Analytics Center](screenshots/05-analytics.png)

---

## Operations Modules

### Faculty Workspace
![Faculty Workspace](screenshots/06-faculty-workspace.png)

### Resource Operations Center
![Resource Operations Center](screenshots/07-resources.png)

### Event Operations Center
![Event Operations Center](screenshots/08-events.png)

### Campus Service Center
![Campus Service Center](screenshots/09-service-center.png)

### Asset Management
![Asset Management](screenshots/10-assets.png)

### Maintenance Operations
![Maintenance Operations](screenshots/11-maintenance.png)

### Communications Center
![Communications Center](screenshots/12-communications.png)

### Notices Board
![Notices Board](screenshots/13-notices.png)

### Safety & Emergency Center
![Safety & Emergency](screenshots/14-safety.png)

### Mobility / Transport Operations
![Transport](screenshots/15-transport.png)

### Knowledge Center (Library)
![Library](screenshots/16-library.png)

### Polls & Feedback
![Polls & Feedback](screenshots/17-polls.png)

### Campus Canteen
![Campus Canteen](screenshots/18-canteen.png)

### Settings
![Settings](screenshots/19-settings.png)

---

## Student Experience

### Student Experience Hub
Captured under the Student demo account (`STU2024001`).

![Student Experience Hub](screenshots/20-student-hub.png)

---

## Public Pages

### Authentication Portal
Enterprise two-column login with the Role Access Center (one-click demo logins).

![Login](screenshots/21-login.png)

### About CampusIQ
![About](screenshots/22-about.png)

### Canteen Staff Portal
Separate staff portal with its own authentication.

![Canteen Staff Portal](screenshots/23-canteen-staff-login.png)

---

## Backend API Smoke Test

The backend is a headless REST API (no UI to screenshot). The frontend above runs
fully in demo mode without it. To smoke-test the backend, start it and hit these
endpoints (it listens on the `PORT` in `backend/.env`, currently `8081`):

```bash
cd backend && npm start

# 1. Health check — expect: { status: "CampusIQ Backend Running", ... }
curl -s http://localhost:8081/ | jq

# 2. Campus Brain AI provider status (requires a valid auth token)
curl -s http://localhost:8081/api/brain/health \
  -H "Authorization: Bearer <token>" | jq
# expect: { provider: "ollama", model: "llama3.2", cloudConfigured: false, ... }

# 3. Campus Brain narration (provider-agnostic; falls back gracefully if AI is down)
curl -s -X POST http://localhost:8081/api/brain/summary \
  -H "Content-Type: application/json" -H "Authorization: Bearer <token>" \
  -d '{"context":"Campus Health 77/100. 3 critical maintenance tasks.","role":"Principal"}' | jq
```

> Note: the frontend `.env` (`VITE_API_URL=http://localhost:3001`) and the backend
> `PORT=8081` differ — align them so the UI's AI calls reach the backend. The
> dashboard works regardless via the deterministic fallback engines.

---

## Regenerating

Screenshots were captured with an offline, dependency-free pipeline (headless
Chromium driven over the Chrome DevTools Protocol using Node's built-in
`fetch`/`WebSocket`). The capture tooling lives in `scripts/screenshots/`.

```bash
# 1. Produce a fresh production build (includes Campus Brain)
npm run build

# 2. Serve the build + drive a headless browser to capture every screen
#    (requires a Chromium/Chrome binary; set CHROME if not auto-detected)
node scripts/screenshots/run.mjs            # captures all screens
INCLUDE_BRAIN=1 node scripts/screenshots/run.mjs   # also captures Campus Brain
```

Output PNGs are written to `screenshots/`. See `scripts/screenshots/README.md`.
