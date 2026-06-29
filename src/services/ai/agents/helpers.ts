import type { AgentAnalysis, AgentContext, AgentName, AgentStance } from "../types";
import type { Evidence } from "@/services/campusBrain";

export function result(
  agent: AgentName,
  domain: string,
  context: AgentContext,
  recommendation: string,
  evidence: Evidence[],
  confidence: number,
  reasoning: string[],
  stance: AgentStance = "support",
): AgentAnalysis {
  return { agent, domain, problem: context.incident.problem, recommendation, evidence, confidence, reasoning, stance, completedAt: new Date().toISOString() };
}

export const affected = (context: AgentContext) =>
  context.telemetry.buildings.filter((building) => context.incident.affectedBuildings.includes(building.name));
