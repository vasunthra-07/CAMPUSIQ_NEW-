/**
 * CampusIQ — CampusReasoningEngine
 * ================================
 * The analytical core of Campus Brain. Given a unified `CampusContext`, it:
 *
 *   1. Computes the Campus Health Score (5-dimension weighted composite).
 *   2. Detects and prioritises Risks (Critical / High / Medium / Low).
 *   3. Surfaces Opportunities.
 *   4. Performs cross-module correlation (the "why", not just the "what").
 *   5. Produces a deterministic executive situation summary.
 *
 * Everything here is rule-based and explainable — no LLM, no randomness. Each
 * conclusion carries the evidence it was derived from.
 */

import type {
  CampusContext,
  CampusHealthScore,
  Risk,
  Opportunity,
  Correlation,
  Alert,
  Priority,
  Trend,
} from "./types";

// Weights for the operational health composite (sum = 1.0). Mirrors the
// backend PulseScoreSnapshot.computedFrom dimensions.
const HEALTH_WEIGHTS = {
  attendanceRate: 0.3,
  ticketResolutionRate: 0.2,
  infrastructureHealthRate: 0.2,
  eventParticipationRate: 0.15,
  resourceUtilizationRate: 0.15,
} as const;

function clamp(n: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, n));
}

/** Resource utilisation is healthiest in a band; punish both idle and overload. */
function resourceBalanceHealth(util: number): number {
  // Peak health at ~70% utilisation; falls off either side.
  return clamp(100 - Math.abs(util - 70) * 1.6);
}

function healthLabel(score: number): CampusHealthScore["label"] {
  if (score >= 75) return "Healthy";
  if (score >= 60) return "Moderate";
  if (score >= 40) return "At Risk";
  return "Critical";
}

// ─── Campus Health Score ─────────────────────────────────────────────────────
function computeHealth(ctx: CampusContext): CampusHealthScore {
  const attendanceRate = clamp(ctx.students.avgAttendance);
  const ticketResolutionRate = clamp(ctx.tickets.resolutionRate);
  const eventParticipationRate = clamp(ctx.events.avgFillRate);
  const resourceUtilizationRate = clamp(ctx.resources.utilizationRate);

  // Infrastructure health degrades with open critical maintenance, overdue
  // tasks and unresolved safety incidents.
  const infraPenalty =
    ctx.maintenance.critical * 12 +
    ctx.maintenance.overdue * 6 +
    ctx.safety.critical * 18 +
    ctx.safety.high * 8;
  const infrastructureHealthRate = clamp(100 - infraPenalty);

  const dims = [
    { key: "attendanceRate", label: "Attendance", weight: HEALTH_WEIGHTS.attendanceRate, raw: attendanceRate },
    { key: "ticketResolutionRate", label: "Service Resolution", weight: HEALTH_WEIGHTS.ticketResolutionRate, raw: ticketResolutionRate },
    { key: "infrastructureHealthRate", label: "Infrastructure Health", weight: HEALTH_WEIGHTS.infrastructureHealthRate, raw: infrastructureHealthRate },
    { key: "eventParticipationRate", label: "Event Participation", weight: HEALTH_WEIGHTS.eventParticipationRate, raw: eventParticipationRate },
    { key: "resourceUtilizationRate", label: "Resource Balance", weight: HEALTH_WEIGHTS.resourceUtilizationRate, raw: resourceBalanceHealth(resourceUtilizationRate) },
  ];

  const breakdown = dims.map((d) => ({
    label: d.label,
    weight: d.weight,
    rawValue: Math.round(d.raw),
    contribution: Math.round(d.raw * d.weight * 10) / 10,
  }));

  const score = clamp(Math.round(breakdown.reduce((a, b) => a + b.contribution, 0)));

  // Trend: compare the cohort risk trend (early vs latest week).
  const wk = ctx.students.weeklyRiskTrend;
  let trend: Trend = "stable";
  if (wk.length >= 2) {
    const firstCrit = wk[0].critical;
    const lastCrit = wk[wk.length - 1].critical;
    trend = lastCrit > firstCrit + 1 ? "down" : lastCrit < firstCrit - 1 ? "up" : "stable";
  }

  return {
    score,
    label: healthLabel(score),
    trend,
    breakdown,
    computedFrom: {
      attendanceRate: Math.round(attendanceRate),
      ticketResolutionRate: Math.round(ticketResolutionRate),
      eventParticipationRate: Math.round(eventParticipationRate),
      resourceUtilizationRate: Math.round(resourceUtilizationRate),
      infrastructureHealthRate: Math.round(infrastructureHealthRate),
    },
  };
}

// ─── Risk detection ──────────────────────────────────────────────────────────
function detectRisks(ctx: CampusContext): Risk[] {
  const risks: Risk[] = [];
  const push = (r: Omit<Risk, "id">) => risks.push({ id: `risk-${risks.length + 1}`, ...r });

  const sensorAlerts = ctx.iot.sensors.filter((sensor) => sensor.status === "alert");
  if (sensorAlerts.length > 0) {
    push({
      title: `${sensorAlerts.length} critical building sensor alert(s)`,
      priority: sensorAlerts.some((sensor) => sensor.kind === "smoke" || sensor.kind === "water-leakage") ? "Critical" : "High",
      module: "IoT",
      summary: `Live environmental thresholds are exceeded at ${[...new Set(sensorAlerts.map((sensor) => sensor.location))].join(", ")}.`,
      impact: Math.min(100, 72 + sensorAlerts.length * 6),
      evidence: sensorAlerts.map((sensor) => ({ source: "IoT", detail: `${sensor.kind} at ${sensor.location}`, value: `${sensor.value} ${sensor.unit}` })),
    });
  }

  // Safety — always highest priority.
  if (ctx.safety.critical > 0 || ctx.safety.high > 0) {
    push({
      title: `${ctx.safety.critical + ctx.safety.high} unresolved safety incident(s)`,
      priority: ctx.safety.critical > 0 ? "Critical" : "High",
      module: "Safety",
      summary: ctx.safety.unresolvedCritical
        .map((i) => `${i.severity} ${i.type} at ${i.location} (${i.status})`)
        .join("; ") || "Elevated safety incidents require coordination.",
      impact: 95 + ctx.safety.critical * 2,
      evidence: ctx.safety.unresolvedCritical.map((i) => ({
        source: "Safety" as const,
        detail: `${i.type} — ${i.location}`,
        value: i.severity,
      })),
    });
  }

  // Critical maintenance.
  if (ctx.maintenance.critical > 0 || ctx.maintenance.overdue > 0) {
    push({
      title: `${ctx.maintenance.critical} critical / ${ctx.maintenance.overdue} overdue maintenance task(s)`,
      priority: ctx.maintenance.critical > 0 ? "Critical" : "High",
      module: "Maintenance",
      summary: "Open critical or overdue maintenance is degrading infrastructure health and may cascade into safety risk.",
      impact: 80 + ctx.maintenance.critical * 4 + ctx.maintenance.overdue * 2,
      evidence: [
        { source: "Maintenance", detail: "Critical open tasks", value: ctx.maintenance.critical },
        { source: "Maintenance", detail: "Overdue tasks", value: ctx.maintenance.overdue },
      ],
    });
  }

  // Student dropout risk.
  if (ctx.students.critical > 0 || ctx.students.pendingInterventions > 0) {
    push({
      title: `${ctx.students.critical} student(s) at critical academic risk`,
      priority: ctx.students.critical >= 5 ? "High" : "Medium",
      module: "Students",
      summary: `${ctx.students.pendingInterventions} pending intervention(s). Top risk: ${ctx.students.topRiskStudents[0]?.name ?? "n/a"} (Pulse ${ctx.students.topRiskStudents[0]?.pulseScore ?? "—"}).`,
      impact: 60 + ctx.students.critical * 3,
      evidence: ctx.students.topRiskStudents.slice(0, 3).map((s) => ({
        source: "Students" as const,
        detail: `${s.name} (${s.department}) — ${s.driftType}`,
        value: `Pulse ${s.pulseScore}`,
      })),
    });
  }

  // Service backlog.
  if (ctx.tickets.critical > 0 || (ctx.tickets.backlogTrend === "up" && ctx.tickets.open + ctx.tickets.inProgress >= 3)) {
    push({
      title: `Service backlog growing (${ctx.tickets.open + ctx.tickets.inProgress} open)`,
      priority: ctx.tickets.critical > 0 ? "High" : "Medium",
      module: "Tickets",
      summary: `Resolution rate ${ctx.tickets.resolutionRate}%. Oldest open ticket is ${ctx.tickets.oldestOpenDays} day(s) old.`,
      impact: 45 + ctx.tickets.critical * 6 + ctx.tickets.oldestOpenDays,
      evidence: [
        { source: "Tickets", detail: "Open + in-progress", value: ctx.tickets.open + ctx.tickets.inProgress },
        { source: "Tickets", detail: "Critical open", value: ctx.tickets.critical },
      ],
    });
  }

  // Transport disruption.
  if (ctx.transport.delayed > 0) {
    push({
      title: `${ctx.transport.delayed} transport route(s) delayed`,
      priority: "Medium",
      module: "Transport",
      summary: ctx.transport.delayedRoutes.map((r) => `${r.route} (${r.status}, ${r.occupancy}% full)`).join("; "),
      impact: 40 + ctx.transport.delayed * 5,
      evidence: ctx.transport.delayedRoutes.map((r) => ({ source: "Transport" as const, detail: r.route, value: r.status })),
    });
  }

  // Event under-participation.
  if (ctx.events.lowParticipation.length > 0) {
    push({
      title: `${ctx.events.lowParticipation.length} upcoming event(s) under 50% capacity`,
      priority: "Low",
      module: "Events",
      summary: ctx.events.lowParticipation.map((e) => `${e.title} (${e.fillRate}%)`).join("; "),
      impact: 25 + ctx.events.lowParticipation.length * 3,
      evidence: ctx.events.lowParticipation.map((e) => ({ source: "Events" as const, detail: e.title, value: `${e.fillRate}%` })),
    });
  }

  // Library scarcity.
  if (ctx.library.scarceTitles.length > 0) {
    push({
      title: `${ctx.library.scarceTitles.length} library title(s) running low`,
      priority: "Low",
      module: "Library",
      summary: ctx.library.scarceTitles.map((b) => `${b.title} (${b.available}/${b.total})`).join("; "),
      impact: 18 + ctx.library.scarceTitles.length * 2,
      evidence: ctx.library.scarceTitles.map((b) => ({ source: "Library" as const, detail: b.title, value: `${b.available}/${b.total}` })),
    });
  }

  return risks.sort((a, b) => b.impact - a.impact);
}

// ─── Opportunity detection ───────────────────────────────────────────────────
function detectOpportunities(ctx: CampusContext): Opportunity[] {
  const ops: Opportunity[] = [];
  const push = (o: Omit<Opportunity, "id">) => ops.push({ id: `opp-${ops.length + 1}`, ...o });

  // Under-utilised rooms = capacity to absorb demand.
  if (ctx.resources.utilizationRate < 55) {
    push({
      title: "Spare room capacity available",
      module: "Resources",
      summary: `Resource utilisation is only ${ctx.resources.utilizationRate}% today — capacity exists to host overflow classes, study groups or events.`,
      upside: 70 - ctx.resources.utilizationRate,
      evidence: [{ source: "Resources", detail: "Utilisation today", value: `${ctx.resources.utilizationRate}%` }],
    });
  }

  // High performers available to mentor.
  if (ctx.students.safe >= 5) {
    push({
      title: `${ctx.students.safe} high-performing students to deploy as peer mentors`,
      module: "Students",
      summary: "Pair top performers with at-risk students via the Peer-Bridge programme to lift cohort pulse.",
      upside: 55,
      evidence: [{ source: "Students", detail: "Safe / healthy students", value: ctx.students.safe }],
    });
  }

  // Strong event interest to scale.
  if (ctx.events.full > 0) {
    push({
      title: `${ctx.events.full} event(s) at full capacity`,
      module: "Events",
      summary: "Demand exceeds supply — consider a second session or a larger venue to capture engagement.",
      upside: 50 + ctx.events.full * 5,
      evidence: [{ source: "Events", detail: "Events at capacity", value: ctx.events.full }],
    });
  }

  // Healthy resolution rate = service team has headroom.
  if (ctx.tickets.resolutionRate >= 60 && ctx.tickets.critical === 0) {
    push({
      title: "Service team operating with headroom",
      module: "Tickets",
      summary: `Resolution rate is ${ctx.tickets.resolutionRate}% with no critical tickets — a good window for preventive maintenance sweeps.`,
      upside: 40,
      evidence: [{ source: "Tickets", detail: "Resolution rate", value: `${ctx.tickets.resolutionRate}%` }],
    });
  }

  return ops.sort((a, b) => b.upside - a.upside);
}

// ─── Cross-module correlation ────────────────────────────────────────────────
function correlate(ctx: CampusContext): Correlation[] {
  const out: Correlation[] = [];
  const push = (c: Omit<Correlation, "id">) => out.push({ id: `corr-${out.length + 1}`, ...c });

  const hot = ctx.iot.sensors.filter((sensor) => sensor.kind === "temperature" && sensor.value >= 33);
  const occupied = ctx.iot.sensors.filter((sensor) => sensor.kind === "occupancy" && sensor.value >= 200);
  hot.forEach((temperature) => {
    const occupancy = occupied.find((sensor) => sensor.location === temperature.location);
    if (occupancy) push({
      signals: [`${temperature.value}${temperature.unit} at ${temperature.location}`, `${occupancy.value} occupants in the same building`],
      inference: `High temperature combined with heavy occupancy at ${temperature.location} indicates HVAC overload and rising comfort and equipment risk.`,
      confidence: temperature.value >= 40 ? 91 : 78,
      module: ["IoT", "Resources", "Maintenance"],
    });
  });

  // Attendance dip + transport delay → likely commute-driven, not disengagement.
  if (ctx.students.fallingAttendance >= 2 && (ctx.transport.delayed > 0 || ctx.transport.full > 0)) {
    push({
      signals: [
        `${ctx.students.fallingAttendance} students with falling attendance`,
        `${ctx.transport.delayed} delayed + ${ctx.transport.full} full transport routes`,
      ],
      inference:
        "The attendance decline correlates with transport disruption. The cause is more likely commute friction than academic disengagement — prioritise mobility fixes before academic intervention.",
      confidence: 68,
      module: ["Students", "Transport"],
    });
  }

  // Rising maintenance load + high resource utilisation → concentrate crews.
  if (ctx.maintenance.open + ctx.maintenance.inProgress >= 3 && ctx.resources.utilizationRate >= 60) {
    push({
      signals: [
        `${ctx.maintenance.open + ctx.maintenance.inProgress} active maintenance tasks`,
        `${ctx.resources.utilizationRate}% resource utilisation`,
      ],
      inference:
        "High facility usage is accelerating wear while maintenance load is elevated. Concentrate maintenance crews on the most-booked blocks to prevent failures during peak hours.",
      confidence: 62,
      module: ["Maintenance", "Resources"],
    });
  }

  // Critical maintenance co-located with a safety incident → compounding hazard.
  if (ctx.maintenance.critical > 0 && (ctx.safety.critical > 0 || ctx.safety.high > 0)) {
    push({
      signals: [
        `${ctx.maintenance.critical} critical maintenance task(s)`,
        `${ctx.safety.critical + ctx.safety.high} unresolved safety incident(s)`,
      ],
      inference:
        "Critical maintenance and an open safety incident are active simultaneously. Treat as a compounding infrastructure hazard and escalate both to a single owner for coordinated response.",
      confidence: 71,
      module: ["Maintenance", "Safety"],
    });
  }

  // Cramming signal: high LMS but low scores across cohort proxy.
  if (ctx.students.atRisk >= 3 && ctx.students.avgAttendance < 78) {
    push({
      signals: [
        `${ctx.students.atRisk} at-risk students`,
        `cohort average attendance ${ctx.students.avgAttendance}%`,
      ],
      inference:
        "A cluster of at-risk students sits just below the attendance threshold. Early, light-touch mentor check-ins now will prevent escalation to critical status in the coming weeks.",
      confidence: 58,
      module: ["Students", "Attendance"],
    });
  }

  return out;
}

// ─── Alerts (live stream) ────────────────────────────────────────────────────
function buildAlerts(ctx: CampusContext): Alert[] {
  const alerts: Alert[] = [];
  const at = ctx.generatedAt;
  const push = (title: string, priority: Priority, module: Alert["module"], detail: string) =>
    alerts.push({ id: `alert-${alerts.length + 1}`, title, priority, module, detail, at });
  ctx.iot.sensors.filter((sensor) => sensor.status === "alert").forEach((sensor) =>
    push(`${sensor.kind} sensor alert`, sensor.kind === "smoke" || sensor.kind === "water-leakage" ? "Critical" : "High", "IoT", `${sensor.location}: ${sensor.value} ${sensor.unit}`)
  );

  ctx.safety.unresolvedCritical.forEach((i) =>
    push(`${i.severity} safety incident`, i.severity === "Critical" ? "Critical" : "High", "Safety", `${i.type} at ${i.location} — ${i.status}`)
  );
  if (ctx.maintenance.critical > 0)
    push("Critical maintenance open", "Critical", "Maintenance", `${ctx.maintenance.critical} critical task(s) awaiting action`);
  if (ctx.tickets.critical > 0)
    push("Critical service ticket", "High", "Tickets", `${ctx.tickets.critical} critical ticket(s) open`);
  if (ctx.transport.delayed > 0)
    push("Transport delay", "Medium", "Transport", `${ctx.transport.delayed} route(s) delayed`);
  if (ctx.students.pendingInterventions > 0)
    push("Student intervention pending", "Medium", "Students", `${ctx.students.pendingInterventions} student(s) flagged for mentor action`);
  if (ctx.communications.urgent > 0)
    push("Urgent announcement live", "Low", "Communications", `${ctx.communications.urgent} urgent notice(s) published`);

  const order: Record<Priority, number> = { Critical: 0, High: 1, Medium: 2, Low: 3 };
  return alerts.sort((a, b) => order[a.priority] - order[b.priority]);
}

// ─── Deterministic executive summary ─────────────────────────────────────────
function buildSummary(ctx: CampusContext, health: CampusHealthScore, risks: Risk[]): string {
  const lines: string[] = [];
  const trendWord = health.trend === "up" ? "improving" : health.trend === "down" ? "declining" : "stable";
  lines.push(`Campus health is ${health.label.toLowerCase()} at ${health.score}/100 and ${trendWord}.`);

  if (ctx.students.avgAttendance < 80)
    lines.push(`Average attendance is ${ctx.students.avgAttendance}% with ${ctx.students.critical} students at critical risk.`);
  if (ctx.maintenance.critical > 0 || ctx.maintenance.overdue > 0)
    lines.push(`${ctx.maintenance.critical} critical and ${ctx.maintenance.overdue} overdue maintenance task(s) are open.`);
  if (ctx.tickets.open + ctx.tickets.inProgress > 0)
    lines.push(`${ctx.tickets.open + ctx.tickets.inProgress} service ticket(s) are unresolved (${ctx.tickets.resolutionRate}% resolution rate).`);
  if (ctx.transport.delayed > 0)
    lines.push(`Transport: ${ctx.transport.delayed} route(s) delayed, ${ctx.transport.avgOccupancy}% average occupancy.`);
  if (ctx.safety.open > 0)
    lines.push(`${ctx.safety.open} safety incident(s) remain open.`);

  const topCritical = risks.find((r) => r.priority === "Critical");
  if (topCritical) lines.push(`Immediate attention: ${topCritical.title}.`);
  else lines.push("No critical issues require immediate intervention.");

  return lines.join(" ");
}

// ─── Public API ──────────────────────────────────────────────────────────────
export const CampusReasoningEngine = {
  health: computeHealth,
  detectRisks,
  detectOpportunities,
  correlate,
  buildAlerts,
  buildSummary,
};
