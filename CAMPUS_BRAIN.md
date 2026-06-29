# Campus Brain — Architecture & Operations Guide

**CampusIQ v3 flagship feature.** Campus Brain is the executive AI advisor that
sits above all 19 operational modules. It aggregates every module into one
unified context, reasons across them, predicts problems, and recommends actions
— so an administrator understands the entire campus in under 30 seconds without
opening a single module.

---

## Design principle: compute facts, narrate with AI

Every number, risk, prediction and recommendation Campus Brain shows is
**computed deterministically** from live module data. The LLM is used **only to
narrate** that pre-computed context in natural language. This means:

- The dashboard can never display an unsupported or hallucinated figure.
- It works fully even with **no AI running** (deterministic fallback narrator).
- Evidence, confidence and data sources are always attached to every insight.

---

## Architecture

```
┌─────────────────────────── FRONTEND (where the live data lives) ───────────────────────────┐
│                                                                                             │
│  CampusContextService   →  aggregates students + 9 module stores into one CampusContext     │
│         │                                                                                   │
│         ▼                                                                                   │
│  CampusReasoningEngine  →  Campus Health Score, risk detection, opportunities,              │
│                            cross-module correlation, priority classification                │
│  PredictionEngine       →  confidence-scored forecasts (trend extrapolation + rules)        │
│  RecommendationEngine   →  prioritised action plans per risk & correlation                  │
│         │                                                                                   │
│         ▼                                                                                   │
│  InsightAggregator      →  composes the BrainSnapshot + a compact LLM context digest        │
│         │                                                                                   │
│         ▼                                                                                   │
│  CampusBrainController  →  the single facade the UI consumes                                 │
│         │                                                                                   │
│         ▼                                                                                   │
│  aiClient ───────────────────────────────► POST /api/brain/{summary,ask}                    │
│   (deterministic fallback if backend/LLM unavailable)                                       │
└─────────────────────────────────────────────────────────────────────────────────────────────┘
                                          │
┌──────────────────────────────── BACKEND (AI narration only) ──────────────────────────────┐
│  routes/campusBrain.routes.js  →  thin routing                                              │
│  controllers/campusBrain.controller.js  →  provider-agnostic LLM call (Ollama | cloud)      │
└─────────────────────────────────────────────────────────────────────────────────────────────┘
```

**Why the engines live on the frontend:** the working application data (tickets,
events, maintenance, transport, library, incidents, bookings, students) is held
in the `campusStore` localStorage layer + the generated `students` dataset — not
in MongoDB. Building the context where the data already lives makes Campus Brain
correct and instant. When the REST backend becomes the source of truth, only
`CampusContextService.ts` changes; every engine above it stays untouched.

---

## Files added

| File | Role |
|------|------|
| `src/services/campusBrain/types.ts` | All Campus Brain types |
| `src/services/campusBrain/CampusContextService.ts` | Unified context aggregation |
| `src/services/campusBrain/CampusReasoningEngine.ts` | Health, risks, correlations |
| `src/services/campusBrain/PredictionEngine.ts` | Forecasts + confidence |
| `src/services/campusBrain/RecommendationEngine.ts` | Prioritised actions |
| `src/services/campusBrain/InsightAggregator.ts` | Snapshot + LLM digest |
| `src/services/campusBrain/aiClient.ts` | AI bridge + deterministic fallback |
| `src/services/campusBrain/CampusBrainController.ts` | UI-facing facade |
| `src/services/campusBrain/index.ts` | Public barrel |
| `src/pages/CampusBrain.tsx` | Executive dashboard page |
| `backend/controllers/campusBrain.controller.js` | Provider-agnostic AI controller |
| `backend/routes/campusBrain.routes.js` | `/api/brain` routes |

**Edited:** `src/App.tsx` (route), `src/routes/moduleRegistry.ts` (nav entry,
gated to HOD / Principal / Chairman), `backend/server.js` (mounts `/api/brain`).

---

## Campus Health Score

A weighted composite of five operational dimensions (mirrors the backend
`PulseScoreSnapshot` model):

| Dimension | Weight | Source |
|-----------|--------|--------|
| Attendance | 30% | average student attendance |
| Service Resolution | 20% | ticket resolution rate |
| Infrastructure Health | 20% | open critical/overdue maintenance + safety incidents |
| Event Participation | 15% | average event fill rate |
| Resource Balance | 15% | room utilisation (healthiest near 70%) |

---

## AI provider configuration (cloud-ready)

Campus Brain defaults to your existing local Ollama. To switch to a cloud model,
set these in `backend/.env` — **no code changes**:

```env
# Default (local) — nothing required:
AI_PROVIDER=ollama
AI_MODEL=llama3.2
OLLAMA_URL=http://localhost:11434

# To use any OpenAI-compatible cloud API (OpenAI, Groq, Together, ...):
AI_PROVIDER=openai
AI_BASE_URL=https://api.groq.com/openai/v1     # or https://api.openai.com/v1
AI_API_KEY=your_key_here
AI_MODEL=llama-3.1-8b-instant                  # provider's model name
```

If the provider is unreachable, the controller returns `{ fallback: true }` and
the frontend uses its deterministic narrator. The feature never breaks.

> **Note:** your frontend `.env` has `VITE_API_URL=http://localhost:3001` while
> `backend/.env` has `PORT=8081`. Point them at the same port for the AI
> narration to reach the backend. Campus Brain still works without it (the
> dashboard + Ask are fully functional on the deterministic engines alone).

---

## Run

```bash
# backend
cd backend && npm start          # serves /api/brain
# (optional) local AI:  ollama run llama3.2

# frontend
npm run dev                      # open /app/brain  (sign in as HOD / Principal / Chairman)
```

---

## Extending to IoT

CampusIQ now includes a provider-neutral live telemetry layer. The backend
simulator publishes temperature, humidity, smoke, noise, occupancy, power,
water-leakage and air-quality readings for eight buildings through Socket.IO
every four seconds. `CampusContextService.buildIoT()` consumes the latest
snapshot, so every sensor tick automatically recomputes risks, correlations,
predictions, recommendations and the executive timeline.

The simulator is isolated in `backend/services/iotSimulator.js`. A future MQTT
adapter only needs to publish the same `CampusTelemetry` snapshot contract;
Digital Twin and Campus Brain require no redesign.

---

## Campus Orchestrator

`src/services/orchestrator/CampusOrchestrator.ts` is the coordination plane
above Campus Brain. It converts live or simulated incidents into deterministic,
explainable multi-step workflows: risk assessment, action planning, department
assignment, targeted notification, timeline updates and Digital Twin state.

Every executive decision includes its evidence, reasoning steps, confidence,
alternatives, expected outcome, responsible departments, estimated resolution
time and affected population. The orchestrator also computes the nine-dimension
Campus Resilience Score.

The What-If Simulator publishes scenarios through the existing Socket.IO
channel. Fire, power failure, flood, bus delay, internet outage, HVAC failure,
overcrowding and medical emergency therefore use the same pipeline as live
events. Executive Presentation Mode runs an automatic eight-step, 49-second
incident narrative through that pipeline without manual interaction.

---

## Enterprise multi-agent AI and campus memory

Campus Brain coordinates six evidence-bound specialists under
`src/services/ai/agents`: Academic, Maintenance, Transport, Security, Energy and
Communication. `AgentCoordinator` selects relevant agents for each orchestrated
incident; `DecisionFusionEngine` combines their evidence and recommendations,
records disagreement, and resolves it into one executive decision.

`CampusMemory` persists incident context, actions and outcomes locally.
`PatternRecognitionEngine` retrieves similar prior events while
`LearningEngine` adjusts confidence from resolved outcomes. The executive UI
shows animated agent execution, current and historical evidence, similar
incidents, learning confidence, historical accuracy, recommendation success,
patterns learned and institutional knowledge KPIs.
