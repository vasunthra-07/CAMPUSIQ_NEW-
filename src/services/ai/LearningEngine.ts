import type { LearningMetrics, MemoryIncident } from "./types";

export const LearningEngine = {
  metrics(memory: MemoryIncident[]): LearningMetrics {
    const resolved = memory.filter((item) => item.outcome !== "Pending");
    const successful = resolved.filter((item) => item.outcome === "Successful").length;
    const partial = resolved.filter((item) => item.outcome === "Partial").length;
    const successRate = resolved.length ? Math.round((successful / resolved.length) * 100) : 75;
    const accuracy = resolved.length ? Math.round(((successful + partial * .5) / resolved.length) * 100) : 78;
    const patterns = new Set(memory.map((item) => `${item.eventType}:${item.affectedBuildings[0] ?? "campus"}`)).size;
    return {
      learningConfidence: Math.min(96, Math.round(62 + Math.min(20, memory.length * 2) + accuracy * .12)),
      historicalAccuracy: accuracy,
      recommendationSuccessRate: successRate,
      patternsLearned: patterns,
    };
  },
  adjustConfidence(base: number, metrics: LearningMetrics, matches: number): number {
    const historicalAdjustment = (metrics.recommendationSuccessRate - 50) * .12;
    return Math.max(35, Math.min(98, Math.round(base + historicalAdjustment + Math.min(8, matches * 2))));
  },
};
