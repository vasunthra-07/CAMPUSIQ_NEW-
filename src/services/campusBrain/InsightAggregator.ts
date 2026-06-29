/**
 * CampusIQ — InsightAggregator
 * ============================
 * Composes the outputs of every engine into the single `BrainSnapshot` the
 * executive dashboard renders, and builds the compact context digest handed to
 * the LLM for natural-language narration.
 *
 * It owns no business rules of its own — it orchestrates and shapes.
 */

import type {
  CampusContext,
  BrainSnapshot,
  PriorityBreakdown,
  Risk,
  Prediction,
  Recommendation,
} from "./types";
import { CampusReasoningEngine } from "./CampusReasoningEngine";
import { PredictionEngine } from "./PredictionEngine";
import { RecommendationEngine } from "./RecommendationEngine";

function tallyPriorities(risks: Risk[]): PriorityBreakdown {
  const out: PriorityBreakdown = { Critical: 0, High: 0, Medium: 0, Low: 0 };
  risks.forEach((r) => (out[r.priority] += 1));
  return out;
}

/** Build a token-efficient text digest of the whole campus for the LLM. */
function buildContextDigest(
  ctx: CampusContext,
  snapshot: Pick<BrainSnapshot, "health" | "topRisks" | "predictions" | "recommendations">
): string {
  const L: string[] = [];
  L.push(`# CAMPUS CONTEXT (as of ${ctx.generatedAt})`);
  L.push(
    `Campus Health: ${snapshot.health.score}/100 (${snapshot.health.label}, trend ${snapshot.health.trend}). ` +
      `Dimensions — attendance ${snapshot.health.computedFrom.attendanceRate}, service ${snapshot.health.computedFrom.ticketResolutionRate}, infra ${snapshot.health.computedFrom.infrastructureHealthRate}, events ${snapshot.health.computedFrom.eventParticipationRate}, resources ${snapshot.health.computedFrom.resourceUtilizationRate}.`
  );
  L.push(
    `Students: ${ctx.students.total} total, avg attendance ${ctx.students.avgAttendance}%, avg pulse ${ctx.students.avgPulseScore}. ` +
      `${ctx.students.critical} critical, ${ctx.students.atRisk} at-risk, ${ctx.students.pendingInterventions} pending interventions, ${ctx.students.fallingAttendance} with falling attendance.`
  );
  L.push(
    `Tickets: ${ctx.tickets.open + ctx.tickets.inProgress} open, ${ctx.tickets.critical} critical, ${ctx.tickets.resolutionRate}% resolution, oldest ${ctx.tickets.oldestOpenDays}d.`
  );
  L.push(
    `Maintenance: ${ctx.maintenance.critical} critical, ${ctx.maintenance.overdue} overdue, ${ctx.maintenance.completionRate}% complete.`
  );
  L.push(
    `Transport: ${ctx.transport.delayed} delayed, ${ctx.transport.full} full, ${ctx.transport.avgOccupancy}% avg occupancy.`
  );
  L.push(
    `Events: ${ctx.events.upcoming} upcoming, ${ctx.events.avgFillRate}% avg fill, ${ctx.events.lowParticipation.length} under 50%.`
  );
  L.push(
    `Resources: ${ctx.resources.utilizationRate}% utilisation, ${ctx.resources.overbookedRooms.length} hot rooms. ` +
      `Library: ${ctx.library.utilizationRate}% borrowed, ${ctx.library.scarceTitles.length} scarce titles.`
  );
  L.push(`Safety: ${ctx.safety.open} open incidents, ${ctx.safety.critical} critical, ${ctx.safety.high} high.`);
  L.push(`IoT sensors: ${ctx.iot.available ? `${ctx.iot.sensors.length} connected` : "none connected"}.`);

  if (snapshot.topRisks.length) {
    L.push(`Top risks: ${snapshot.topRisks.slice(0, 5).map((r) => `[${r.priority}] ${r.title}`).join("; ")}.`);
  }
  if (snapshot.predictions.length) {
    L.push(`Predictions: ${snapshot.predictions.slice(0, 3).map((p) => `${p.title} (${p.confidence}%)`).join("; ")}.`);
  }
  if (snapshot.recommendations.length) {
    L.push(`Recommended: ${snapshot.recommendations.slice(0, 3).map((r) => r.problem).join("; ")}.`);
  }
  return L.join("\n");
}

export const InsightAggregator = {
  /** Run every engine over the context and produce the full executive snapshot. */
  aggregate(ctx: CampusContext): BrainSnapshot {
    const health = CampusReasoningEngine.health(ctx);
    const allRisks = CampusReasoningEngine.detectRisks(ctx);
    const topOpportunities = CampusReasoningEngine.detectOpportunities(ctx).slice(0, 5);
    const correlations = CampusReasoningEngine.correlate(ctx);
    const alerts = CampusReasoningEngine.buildAlerts(ctx);
    const predictions: Prediction[] = PredictionEngine.predict(ctx);
    const recommendations: Recommendation[] = RecommendationEngine.recommend(ctx, allRisks, correlations);
    const deterministicSummary = CampusReasoningEngine.buildSummary(ctx, health, allRisks);

    const topRisks = allRisks.slice(0, 5);
    const priorities = tallyPriorities(allRisks);

    const contextDigest = buildContextDigest(ctx, { health, topRisks: allRisks, predictions, recommendations });

    return {
      generatedAt: ctx.generatedAt,
      health,
      priorities,
      topRisks,
      topOpportunities,
      alerts,
      correlations,
      predictions,
      recommendations,
      deterministicSummary,
      contextDigest,
    };
  },
};
