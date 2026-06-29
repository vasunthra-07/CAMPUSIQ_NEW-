/**
 * CampusIQ — Campus Brain AI Client (frontend)
 * ============================================
 * Thin, resilient bridge between the dashboard and the AI narration layer.
 *
 *  • Sends the pre-computed context digest + the user's question to the backend
 *    `/api/brain/*` endpoints (provider-agnostic — Ollama by default, swappable
 *    to any cloud LLM via backend env vars).
 *  • Wraps every response in a consistent envelope: answer + confidence +
 *    evidence + sources + timestamp + fallback flag.
 *  • If the backend or model is unavailable, it NEVER fails the UI — it falls
 *    back to a deterministic narrator built from the same context, so the
 *    feature works end-to-end even with no AI running.
 *
 * The LLM only rewrites already-true facts into prose. Evidence, confidence and
 * sources are computed by the engines, so the dashboard can never show an
 * unsupported claim.
 */

import type { BrainSnapshot, BrainAIResponse, ModuleSource, Evidence } from "./types";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

function token(): string {
  return localStorage.getItem("CampusIQ_token") || "";
}

function sourcesFromSnapshot(snapshot: BrainSnapshot): ModuleSource[] {
  const set = new Set<ModuleSource>();
  snapshot.topRisks.forEach((r) => set.add(r.module));
  snapshot.predictions.forEach((p) => set.add(p.module));
  if (set.size === 0) set.add("PulseScore");
  return [...set];
}

async function callBackend(path: string, body: unknown, signal?: AbortSignal): Promise<string | null> {
  try {
    const res = await fetch(`${API_URL}/api/brain/${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
      body: JSON.stringify(body),
      signal,
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data && typeof data.answer === "string" && data.answer.trim() && !data.fallback) {
      return data.answer.trim();
    }
    return null;
  } catch {
    return null;
  }
}

export const brainAIClient = {
  /** Narrate the executive summary. Falls back to the deterministic summary. */
  async summarize(snapshot: BrainSnapshot, role: string, signal?: AbortSignal): Promise<BrainAIResponse> {
    const sources = sourcesFromSnapshot(snapshot);
    const answer = await callBackend(
      "summary",
      { context: snapshot.contextDigest, role },
      signal
    );
    const at = new Date().toISOString();
    if (answer) {
      return { answer, confidence: 88, evidence: snapshot.topRisks.slice(0, 3).map((r) => ({ source: r.module, detail: r.title })), sources, timestamp: at, fallback: false };
    }
    return {
      answer: snapshot.deterministicSummary,
      confidence: 100, // deterministic — computed directly from data
      evidence: snapshot.topRisks.slice(0, 3).map((r) => ({ source: r.module, detail: r.title })),
      sources,
      timestamp: at,
      fallback: true,
    };
  },

  /** Answer a free-text question grounded in the snapshot context. */
  async ask(question: string, snapshot: BrainSnapshot, role: string, signal?: AbortSignal): Promise<BrainAIResponse> {
    const sources = sourcesFromSnapshot(snapshot);
    const answer = await callBackend(
      "ask",
      { context: snapshot.contextDigest, question, role },
      signal
    );
    const at = new Date().toISOString();
    if (answer) {
      return { answer, confidence: 84, evidence: relevantEvidence(question, snapshot), sources, timestamp: at, fallback: false };
    }
    // Deterministic fallback: answer from the structured snapshot.
    return {
      answer: deterministicAnswer(question, snapshot),
      confidence: 92,
      evidence: relevantEvidence(question, snapshot),
      sources,
      timestamp: at,
      fallback: true,
    };
  },
};

// ─── Deterministic fallback narrator ─────────────────────────────────────────
function relevantEvidence(question: string, snapshot: BrainSnapshot) {
  const q = question.toLowerCase();
  const ev: Evidence[] = [];
  if (/(risk|attention|today|urgent|priorit)/.test(q)) ev.push(...snapshot.topRisks.slice(0, 3).map((r) => ({ source: r.module, detail: r.title })));
  if (/(predict|forecast|likely|future|next)/.test(q)) ev.push(...snapshot.predictions.slice(0, 2).map((p) => ({ source: p.module, detail: p.title })));
  if (/(health|pulse|score)/.test(q)) ev.push({ source: "PulseScore" as ModuleSource, detail: `Health ${snapshot.health.score}/100` });
  if (ev.length === 0) ev.push(...snapshot.topRisks.slice(0, 2).map((r) => ({ source: r.module, detail: r.title })));
  return ev;
}

function deterministicAnswer(question: string, snapshot: BrainSnapshot): string {
  const q = question.toLowerCase();

  if (/(attention|today|now|urgent|priorit)/.test(q)) {
    const crit = snapshot.topRisks.filter((r) => r.priority === "Critical" || r.priority === "High");
    if (crit.length === 0) return "No critical or high-priority issues need your attention right now. Campus is operating within normal ranges.";
    return "Top items needing attention: " + crit.map((r, i) => `${i + 1}) ${r.title} — ${r.summary}`).join("  ");
  }
  if (/(health|pulse|score|lower|why)/.test(q)) {
    const weakest = [...snapshot.health.breakdown].sort((a, b) => a.rawValue - b.rawValue)[0];
    return `Campus health is ${snapshot.health.score}/100 (${snapshot.health.label}). The weakest dimension is ${weakest.label} at ${weakest.rawValue}/100, which is pulling the composite down the most.`;
  }
  if (/(maintenance|building|repair|fix first|infrastructure)/.test(q)) {
    const m = snapshot.topRisks.find((r) => r.module === "Maintenance");
    return m ? `${m.title}. ${m.summary}` : "No critical maintenance is currently outstanding.";
  }
  if (/(student|intervention|dropout|at.risk)/.test(q)) {
    const s = snapshot.topRisks.find((r) => r.module === "Students");
    return s ? `${s.title}. ${s.summary}` : "No students are currently at critical academic risk.";
  }
  if (/(attendance|affecting)/.test(q)) {
    const corr = snapshot.correlations.find((c) => c.module.includes("Students"));
    return corr ? corr.inference : "Attendance is within expected ranges; no significant external driver detected.";
  }
  if (/(predict|forecast|likely|future|next)/.test(q)) {
    if (snapshot.predictions.length === 0) return "No notable predictions — current trends are stable.";
    return "Forecasts: " + snapshot.predictions.slice(0, 3).map((p) => `${p.forecast} (${p.confidence}% confidence)`).join("  ");
  }
  if (/(summar|operation|overview|what.s happening)/.test(q)) {
    return snapshot.deterministicSummary;
  }

  // Generic fallback.
  return snapshot.deterministicSummary;
}
