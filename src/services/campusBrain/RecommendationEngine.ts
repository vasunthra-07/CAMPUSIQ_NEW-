/**
 * CampusIQ — RecommendationEngine
 * ===============================
 * Turns detected risks and correlations into concrete, prioritised actions.
 *
 * Every recommendation ties back to a problem and lists discrete next actions,
 * ordered by expected impact so an administrator can work top-down.
 */

import type { CampusContext, Risk, Correlation, Recommendation, Priority } from "./types";

const PRIORITY_BASE: Record<Priority, number> = { Critical: 90, High: 70, Medium: 45, Low: 20 };

export const RecommendationEngine = {
  recommend(ctx: CampusContext, risks: Risk[], correlations: Correlation[]): Recommendation[] {
    const recs: Recommendation[] = [];
    const push = (r: Omit<Recommendation, "id">) => recs.push({ id: `rec-${recs.length + 1}`, ...r });

    // Derive an action plan per top risk.
    for (const risk of risks) {
      const actions = actionsForRisk(ctx, risk);
      if (actions.length === 0) continue;
      push({
        problem: risk.title,
        actions,
        priority: risk.priority,
        expectedImpact: Math.min(100, PRIORITY_BASE[risk.priority] + Math.round(risk.impact / 10)),
        module: risk.module,
      });
    }

    // Add correlation-driven recommendations (the "smart" cross-module moves).
    for (const c of correlations) {
      push({
        problem: c.inference.split(".")[0] + ".",
        actions: actionsForCorrelation(c),
        priority: c.confidence >= 65 ? "High" : "Medium",
        expectedImpact: Math.round(c.confidence),
        module: c.module[0],
      });
    }

    return recs.sort((a, b) => b.expectedImpact - a.expectedImpact);
  },
};

function actionsForRisk(ctx: CampusContext, risk: Risk): string[] {
  switch (risk.module) {
    case "Safety":
      return [
        "Dispatch security + maintenance to the incident location now",
        "Cordon the affected area and notify occupants via Communications Hub",
        "Assign a single incident owner and set a resolution SLA",
      ];
    case "Maintenance":
      return [
        "Reassign crews to critical and overdue tasks first",
        "Escalate any task blocking a classroom or lab to same-day",
        "Schedule a preventive sweep of the highest-usage blocks",
      ];
    case "Students":
      return [
        `Notify mentors for the ${ctx.students.pendingInterventions} pending intervention(s)`,
        "Schedule counselling for critical-status students this week",
        "Trigger parent alerts for students below 65% attendance",
        "Pair at-risk students with Peer-Bridge mentors",
      ];
    case "Tickets":
      return [
        "Triage and assign all critical tickets to an owner today",
        `Clear the oldest ticket (${ctx.tickets.oldestOpenDays} days open) first`,
        "Add temporary capacity to the service team if backlog keeps rising",
      ];
    case "Transport":
      return [
        "Increase frequency or add a relief vehicle on delayed routes",
        "Notify affected students of revised ETAs via Communications Hub",
        "Re-balance passenger load across nearby routes",
      ];
    case "Events":
      return [
        "Promote under-subscribed events through targeted announcements",
        "Send reminders to relevant departments and year groups",
        "Consider rescheduling clashing low-fill events",
      ];
    case "Library":
      return [
        "Order or e-license additional copies of scarce high-demand titles",
        "Cap loan durations on scarce titles during peak periods",
      ];
    default:
      return ["Review the affected module and assign an owner"];
  }
}

function actionsForCorrelation(c: Correlation): string[] {
  if (c.module.includes("Transport") && c.module.includes("Students"))
    return [
      "Fix transport delays before launching academic interventions",
      "Communicate revised schedules to affected students",
      "Re-measure attendance after mobility is restored before flagging disengagement",
    ];
  if (c.module.includes("Maintenance") && c.module.includes("Resources"))
    return [
      "Concentrate maintenance crews on the most-booked blocks",
      "Stagger non-essential bookings away from peak maintenance windows",
    ];
  if (c.module.includes("Maintenance") && c.module.includes("Safety"))
    return [
      "Assign one owner to the combined maintenance + safety hazard",
      "Escalate to same-day resolution and re-inspect after closure",
    ];
  return ["Coordinate the affected teams under a single owner"];
}
