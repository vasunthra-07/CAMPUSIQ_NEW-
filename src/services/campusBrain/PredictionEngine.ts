/**
 * CampusIQ — PredictionEngine
 * ===========================
 * Forward-looking layer of Campus Brain. Produces explainable forecasts with
 * confidence scores from trends already present in the unified context.
 *
 * These are heuristic projections (trend extrapolation + threshold rules), not
 * black-box ML — every prediction states the evidence it was derived from, so
 * an administrator can audit the reasoning.
 */

import type { CampusContext, Prediction } from "./types";

function clamp(n: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, n));
}

export const PredictionEngine = {
  predict(ctx: CampusContext): Prediction[] {
    const preds: Prediction[] = [];
    const push = (p: Omit<Prediction, "id">) => preds.push({ id: `pred-${preds.length + 1}`, ...p });

    // 1. Attendance / dropout trajectory.
    const wk = ctx.students.weeklyRiskTrend;
    if (wk.length >= 3) {
      const recent = wk.slice(-3);
      const slope = recent[recent.length - 1].critical - recent[0].critical;
      if (slope > 0) {
        push({
          title: "Rising academic risk",
          forecast: `Critical-risk student count is trending up (+${slope} over 3 weeks). Expect ${ctx.students.critical + slope} critical students within 2 weeks without intervention.`,
          confidence: clamp(55 + slope * 6),
          module: "Students",
          horizon: "Next 2 weeks",
          evidence: [
            { source: "Students", detail: "Critical now", value: ctx.students.critical },
            { source: "Attendance", detail: "3-week slope", value: `+${slope}` },
          ],
        });
      }
    }

    // 2. Service backlog growth.
    if (ctx.tickets.backlogTrend === "up" && ctx.tickets.open + ctx.tickets.inProgress > 0) {
      const projected = ctx.tickets.open + ctx.tickets.inProgress + Math.ceil(ctx.tickets.open * 0.3);
      push({
        title: "Service backlog growth",
        forecast: `With resolution at ${ctx.tickets.resolutionRate}% and intake exceeding closure, open tickets could reach ~${projected} next week.`,
        confidence: clamp(50 + (100 - ctx.tickets.resolutionRate) / 3),
        module: "Tickets",
        horizon: "Next 7 days",
        evidence: [
          { source: "Tickets", detail: "Open now", value: ctx.tickets.open + ctx.tickets.inProgress },
          { source: "Tickets", detail: "Resolution rate", value: `${ctx.tickets.resolutionRate}%` },
        ],
      });
    }

    // 3. Asset / maintenance failure risk.
    if (ctx.maintenance.critical > 0 || ctx.maintenance.overdue > 0) {
      push({
        title: "Likely infrastructure failure",
        forecast: `${ctx.maintenance.critical} critical and ${ctx.maintenance.overdue} overdue task(s) raise the probability of an equipment failure or safety escalation if unaddressed.`,
        confidence: clamp(45 + ctx.maintenance.critical * 12 + ctx.maintenance.overdue * 5),
        module: "Maintenance",
        horizon: "Next 10 days",
        evidence: [
          { source: "Maintenance", detail: "Critical", value: ctx.maintenance.critical },
          { source: "Maintenance", detail: "Overdue", value: ctx.maintenance.overdue },
        ],
      });
    }

    // 4. Resource congestion.
    if (ctx.resources.utilizationRate >= 75 || ctx.resources.overbookedRooms.length > 0) {
      push({
        title: "Resource congestion ahead",
        forecast: `Utilisation at ${ctx.resources.utilizationRate}% with ${ctx.resources.overbookedRooms.length} heavily-booked room(s) — booking conflicts likely at peak hours.`,
        confidence: clamp(40 + ctx.resources.utilizationRate / 2),
        module: "Resources",
        horizon: "This week",
        evidence: [
          { source: "Resources", detail: "Utilisation", value: `${ctx.resources.utilizationRate}%` },
          { source: "Resources", detail: "Hot rooms", value: ctx.resources.overbookedRooms.length },
        ],
      });
    }

    // 5. Event participation forecast.
    if (ctx.events.lowParticipation.length > 0) {
      const worst = ctx.events.lowParticipation[0];
      push({
        title: "Event under-subscription",
        forecast: `"${worst.title}" is at ${worst.fillRate}% capacity. On current trend it will finish well under target unless promoted.`,
        confidence: clamp(60 - worst.fillRate / 2),
        module: "Events",
        horizon: `Until ${worst.date}`,
        evidence: [{ source: "Events", detail: worst.title, value: `${worst.fillRate}%` }],
      });
    }

    // 6. Transport capacity.
    if (ctx.transport.full > 0 || ctx.transport.avgOccupancy >= 85) {
      push({
        title: "Transport capacity strain",
        forecast: `Average occupancy is ${ctx.transport.avgOccupancy}% with ${ctx.transport.full} full route(s). Additional demand will leave students without seats.`,
        confidence: clamp(45 + ctx.transport.avgOccupancy / 3),
        module: "Transport",
        horizon: "Next 7 days",
        evidence: [
          { source: "Transport", detail: "Avg occupancy", value: `${ctx.transport.avgOccupancy}%` },
          { source: "Transport", detail: "Full routes", value: ctx.transport.full },
        ],
      });
    }

    return preds.sort((a, b) => b.confidence - a.confidence);
  },
};
