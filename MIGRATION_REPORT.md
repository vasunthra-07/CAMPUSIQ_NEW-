# CampusIQ Brand Migration Report

**Date:** June 25, 2026  
**Objective:** Remove all CIT Sentinel branding; establish CampusIQ as standalone product.

---

## Executive Summary

| Category | Sentinel References Found | Action |
|----------|---------------------------|--------|
| Active frontend (`src/`) | 2 animation class names | Rename → CampusIQ |
| Backend API (`backend/`, `src/utils/server.js`) | 5 strings | Rebrand |
| Package metadata | 2 package names | Rename |
| Environment | 1 MongoDB appName | Update display name |
| CSS/Tailwind animations | `sentinel-beat` | Rename → `campus-pulse-beat` |
| Archive folder | `cit-sentinel-full-project/` | Deprecated — not imported |
| Root folder name | `cit-sentinel-v2-main` | Manual rename recommended |
| node_modules | Third-party `charsetSentinel`, `WakeLockSentinel` | **Do not change** |

---

## Phase 1 — Codebase Rebranding

### Files Requiring Changes

#### Frontend Source
| File | Reference | Replacement |
|------|-----------|-------------|
| `src/index.css` | `@keyframes sentinel-beat`, `.animate-sentinel-beat` | `campus-pulse-beat` |
| `tailwind.config.ts` | `sentinel-beat` keyframe/animation | `campus-pulse-beat` |

#### Backend
| File | Reference | Replacement |
|------|-----------|-------------|
| `src/utils/server.js` | `cit-sentinel-secret-key-2025` | `campusiq-platform-secret-2026` |
| `src/utils/server.js` | `CIT-Sentinel Backend Running` | `CampusIQ Platform API Running` |
| `src/utils/server.js` | `Sentinel AI` prompt | `Campus Copilot AI` |
| `src/utils/server.js` | Console log emoji/text | CampusIQ branding |
| `backend/package.json` | `cit-sentinel-backend` | `campusiq-platform-backend` |
| `backend/.env` | `appName=cit-sentinel` | `appName=campusiq-platform` |

#### Metadata
| File | Change |
|------|--------|
| `package.json` | `name` → `campusiq-platform` |
| `index.html` | Already CampusIQ — update tagline |

### Not Changed (Infrastructure)
- MongoDB cluster hostname `cit-sentinel.galws21.mongodb.net` — Atlas cluster name; changing breaks connection unless cluster is renamed in Atlas console.
- `cit-sentinel-full-project/` — legacy snapshot; excluded from build.

### Already Migrated (Prior Session)
- Product UI labels → CampusIQ, Campus Copilot, Campus Command Center
- `pulseScore` (not `sentinelScore`) in active `src/data/students.ts`
- Page titles → `CampusIQ`

---

## Phase 2 — Login Experience Rebuild

### Removed
- `CampusIntelligenceNetwork.tsx` (node graph — replaced)
- `DemoAccessPanel.tsx` accordion (replaced)

### New Components
| Component | Purpose |
|-----------|---------|
| `OperationalActivityCanvas.tsx` | Living campus visualization |
| `CampusPulsePanel.tsx` | Center metrics display |
| `RoleAccessCenter.tsx` | Professional role access cards |
| Rebuilt `LoginPage.tsx` | 3-column enterprise layout |

### Post-Login
| Component | Enhancement |
|-----------|-------------|
| `RoleWelcomeScreen.tsx` | Role, department, system status, campus pulse |
| `DashboardEntryTransition.tsx` | Full operational handoff screen |

---

## Phase 3 — Design System

### New Token File
`src/design-system/tokens.css` — canonical token source:
- Color tokens
- Spacing scale (4px system)
- Typography scale
- Motion durations/easing
- Shadow elevations
- Component radii

---

## Phase 4 — Command Center

### Enhanced `CampusCommandCenter.tsx`
- Operational Status bar
- Events Timeline panel
- Service Alerts stream
- Pending Actions queue
- Elevated visual hierarchy (Vercel/Linear quality bar)

---

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| JWT secret change invalidates tokens | Demo app uses local auth; acceptable |
| MongoDB appName change | Cosmetic only; cluster URL unchanged |
| Animation class rename | Grep confirms no component usage of `animate-sentinel-beat` in active src |

---

## Post-Migration Checklist

- [x] Migration report generated
- [x] All Sentinel strings replaced in active codebase
- [x] Login experience rebuilt
- [x] Design tokens centralized (`src/design-system/tokens.css`)
- [x] Command Center enhanced
- [x] Production build verified
