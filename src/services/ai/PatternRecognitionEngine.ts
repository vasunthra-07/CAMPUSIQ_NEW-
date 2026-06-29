import type { OrchestratedDecision } from "@/services/orchestrator/types";
import type { MemoryIncident, PatternMatch } from "./types";

function similarity(current: OrchestratedDecision, previous: MemoryIncident): number {
  let score = current.eventType === previous.eventType ? 45 : 0;
  if (current.affectedBuildings.some((building) => previous.affectedBuildings.includes(building))) score += 25;
  const overlap = current.responsibleDepartments.filter((department) => previous.affectedDepartments.includes(department)).length;
  score += Math.min(20, overlap * 7);
  if (current.severity === "Critical" && previous.confidence >= 85) score += 10;
  return Math.min(100, score);
}

export const PatternRecognitionEngine = {
  search(incident: OrchestratedDecision, memory: MemoryIncident[]): PatternMatch[] {
    return memory
      .filter((previous) => previous.time !== incident.createdAt)
      .map((previousIncident) => ({
        similarity: similarity(incident, previousIncident),
        previousIncident,
        previousResolution: previousIncident.finalResolution,
        recommendedReuse: previousIncident.outcome === "Successful" ? `Reuse: ${previousIncident.actionsTaken.slice(0, 2).join("; ")}` : "Reuse evidence and escalation path; reassess actions before execution.",
      }))
      .filter((match) => match.similarity >= 45)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 3);
  },
};
