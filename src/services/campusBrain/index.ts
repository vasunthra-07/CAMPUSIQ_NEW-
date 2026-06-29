/**
 * CampusIQ — Campus Brain
 * =======================
 * Public barrel for the Campus Brain intelligence layer.
 *
 * Architecture (data flows top → bottom):
 *
 *   CampusContextService   → aggregates all modules into one CampusContext
 *   CampusReasoningEngine  → health score, risks, opportunities, correlations
 *   PredictionEngine       → confidence-scored forecasts
 *   RecommendationEngine   → prioritised action plans
 *   InsightAggregator      → composes the BrainSnapshot + LLM context digest
 *   aiClient               → provider-agnostic narration (with deterministic fallback)
 *   CampusBrainController  → the single facade the UI consumes
 */

export * from "./types";
export { CampusContextService } from "./CampusContextService";
export { CampusReasoningEngine } from "./CampusReasoningEngine";
export { PredictionEngine } from "./PredictionEngine";
export { RecommendationEngine } from "./RecommendationEngine";
export { InsightAggregator } from "./InsightAggregator";
export { brainAIClient } from "./aiClient";
export { CampusBrainController } from "./CampusBrainController";
export { DecisionLogService } from "./DecisionLogService";
