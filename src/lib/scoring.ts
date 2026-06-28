/**
 * CampusIQ — Campus Pulse Score Engine
 * 
 * All scoring weights and formulas are centralized here so the methodology
 * is transparent, testable, and visible in the UI.
 *
 * Campus Pulse Score = weighted composite of:
 *   Attendance      30%  (most predictive of dropout risk)
 *   IAT Performance 25%  (academic engagement)
 *   LMS Activity    20%  (behavioral signal)
 *   Model Exam      15%  (retention proxy)
 *   Co-curricular   10%  (hackathons/competitions, capped)
 */

// ─── VISIBLE WEIGHTS (shown in UI method cards) ────────────────────────────
export const PULSE_SCORE_WEIGHTS = {
  attendance: 0.30,
  iatPerformance: 0.25,
  lmsActivity: 0.20,
  modelExam: 0.15,
  coCurricular: 0.10, // capped at max 10 pts
} as const;

export const PULSE_SCORE_LABELS = {
  attendance: "Attendance Rate",
  iatPerformance: "IAT Performance",
  lmsActivity: "LMS Activity",
  modelExam: "Model Exam",
  coCurricular: "Co-Curricular",
};

// ─── RISK THRESHOLDS ────────────────────────────────────────────────────────
export const RISK_THRESHOLDS = {
  attendance: { critical: 65, danger: 75, safe: 85 },
  iat: { critical: 35, danger: 50, safe: 70 },
  pulse: { critical: 40, danger: 60, safe: 75 },
} as const;

// ─── INDIVIDUAL STUDENT PULSE SCORE ─────────────────────────────────────────
export interface StudentMetrics {
  attendance: number;       // 0–100
  iatTotal: number;         // 0–100
  lmsActivity: number;      // 0–100
  model: number;            // 0–100
  hackathonWins: number;    // integer
}

export interface PulseScoreBreakdown {
  total: number;
  components: {
    attendance: number;
    iatPerformance: number;
    lmsActivity: number;
    modelExam: number;
    coCurricular: number;
  };
  weights: typeof PULSE_SCORE_WEIGHTS;
}

export function calculatePulseScore(metrics: StudentMetrics): PulseScoreBreakdown {
  const attendancePoints  = (metrics.attendance / 100) * 100 * PULSE_SCORE_WEIGHTS.attendance;
  const iatPoints         = (metrics.iatTotal / 100) * 100 * PULSE_SCORE_WEIGHTS.iatPerformance;
  const lmsPoints         = (metrics.lmsActivity / 100) * 100 * PULSE_SCORE_WEIGHTS.lmsActivity;
  const modelPoints       = (metrics.model / 100) * 100 * PULSE_SCORE_WEIGHTS.modelExam;
  const coPoints          = Math.min(metrics.hackathonWins * 2, 10); // max 10 pts

  const total = Math.max(0, Math.min(100, Math.round(
    attendancePoints + iatPoints + lmsPoints + modelPoints + coPoints
  )));

  return {
    total,
    components: {
      attendance: Math.round(attendancePoints * 10) / 10,
      iatPerformance: Math.round(iatPoints * 10) / 10,
      lmsActivity: Math.round(lmsPoints * 10) / 10,
      modelExam: Math.round(modelPoints * 10) / 10,
      coCurricular: Math.round(coPoints * 10) / 10,
    },
    weights: PULSE_SCORE_WEIGHTS,
  };
}

// ─── COHORT CAMPUS PULSE SCORE ───────────────────────────────────────────────
export interface CohortSummary {
  avgPulseScore: number;
  criticalCount: number;
  atRiskCount: number;
  safeCount: number;
  interventionRate: number;  // 0–100 %
  trendDirection: "up" | "down" | "stable";
}

export function calculateCohortPulse(scores: number[], prevScores?: number[]): CohortSummary {
  if (scores.length === 0) return { avgPulseScore: 0, criticalCount: 0, atRiskCount: 0, safeCount: 0, interventionRate: 0, trendDirection: "stable" };
  const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  const criticalCount = scores.filter(s => s < RISK_THRESHOLDS.pulse.critical).length;
  const atRiskCount   = scores.filter(s => s >= RISK_THRESHOLDS.pulse.critical && s < RISK_THRESHOLDS.pulse.danger).length;
  const safeCount     = scores.filter(s => s >= RISK_THRESHOLDS.pulse.safe).length;
  const interventionRate = Math.round(((criticalCount + atRiskCount) / scores.length) * 100);

  let trendDirection: "up" | "down" | "stable" = "stable";
  if (prevScores && prevScores.length > 0) {
    const prevAvg = prevScores.reduce((a, b) => a + b, 0) / prevScores.length;
    trendDirection = avg > prevAvg + 1 ? "up" : avg < prevAvg - 1 ? "down" : "stable";
  }

  return { avgPulseScore: avg, criticalCount, atRiskCount, safeCount, interventionRate, trendDirection };
}

// ─── RESOURCE OPTIMIZATION (for Phase 7 modules) ────────────────────────────
export interface ResourceDemand {
  label: string;
  demand: number;    // 0–100 utilization
  capacity: number;  // absolute capacity units
}

export interface OptimizationResult {
  label: string;
  utilizationPct: number;
  status: "over" | "optimal" | "under";
  recommendation: string;
}

export function calculateResourceOptimization(resources: ResourceDemand[]): OptimizationResult[] {
  return resources.map(r => {
    const pct = Math.round((r.demand / r.capacity) * 100);
    let status: "over" | "optimal" | "under";
    let recommendation: string;
    if (pct > 90) {
      status = "over";
      recommendation = `${r.label} is over-utilized at ${pct}%. Expand capacity or redistribute load.`;
    } else if (pct >= 60) {
      status = "optimal";
      recommendation = `${r.label} is at optimal utilization (${pct}%).`;
    } else {
      status = "under";
      recommendation = `${r.label} is under-utilized (${pct}%). Consider reallocation.`;
    }
    return { label: r.label, utilizationPct: pct, status, recommendation };
  });
}

// ─── RISK LABEL HELPERS ─────────────────────────────────────────────────────
export function getPulseLabel(score: number): string {
  if (score >= RISK_THRESHOLDS.pulse.safe) return "Healthy";
  if (score >= RISK_THRESHOLDS.pulse.danger) return "Moderate";
  if (score >= RISK_THRESHOLDS.pulse.critical) return "At Risk";
  return "Critical";
}

export function getPulseColor(score: number): string {
  if (score >= RISK_THRESHOLDS.pulse.safe) return "hsl(145 60% 42%)";
  if (score >= RISK_THRESHOLDS.pulse.danger) return "hsl(210 100% 60%)";
  if (score >= RISK_THRESHOLDS.pulse.critical) return "hsl(30 100% 60%)";
  return "hsl(0 84% 60%)";
}
