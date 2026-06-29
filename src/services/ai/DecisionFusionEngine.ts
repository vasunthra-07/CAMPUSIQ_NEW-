import type { OrchestratedDecision } from "@/services/orchestrator/types";
import type { AgentAnalysis, FusedExecutiveDecision, LearningMetrics, PatternMatch } from "./types";
import { LearningEngine } from "./LearningEngine";

export const DecisionFusionEngine = {
  fuse(incident: OrchestratedDecision, analyses: AgentAnalysis[], matches: PatternMatch[], learning: LearningMetrics): FusedExecutiveDecision {
    const conflicts: string[] = [];
    const caution = analyses.filter((analysis) => analysis.stance === "caution");
    if (caution.length) conflicts.push(`${caution.map((item) => item.agent).join(", ")} requested safeguards; Campus Brain retained the response with controlled execution conditions.`);
    const currentEvidence = [...incident.evidence, ...analyses.flatMap((analysis) => analysis.evidence)]
      .filter((item, index, all) => all.findIndex((candidate) => candidate.source === item.source && candidate.detail === item.detail) === index);
    const base = analyses.length ? Math.round(analyses.reduce((sum, analysis) => sum + analysis.confidence, 0) / analyses.length) : incident.confidence;
    return {
      id: `fusion-${incident.id}`,
      problem: incident.problem,
      severity: incident.severity,
      currentEvidence,
      historicalEvidence: matches.flatMap((match) => match.previousIncident.sensors.map((sensor) => ({ source: "IoT" as const, detail: `${sensor.building} historical sensors`, value: `Temp ${sensor.temperature}°C, smoke ${sensor.smoke} ppm` }))),
      similarIncidents: matches,
      learningConfidence: learning.learningConfidence,
      reasonForRecommendation: `${analyses.length} relevant specialist agents evaluated the event. Campus Brain fused domain evidence, resolved ${conflicts.length} conflict(s), and adjusted confidence using campus memory.`,
      recommendation: [...new Set([...analyses.map((analysis) => analysis.recommendation), ...incident.recommendedActions])],
      expectedImprovement: incident.expectedOutcome,
      alternativeActions: [...new Set([...incident.alternativeActions, ...matches.map((match) => match.recommendedReuse)])],
      agentAnalyses: analyses,
      conflictsResolved: conflicts,
      confidence: LearningEngine.adjustConfidence(base, learning, matches.length),
      generatedAt: new Date().toISOString(),
    };
  },
};
