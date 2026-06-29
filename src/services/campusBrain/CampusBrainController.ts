/**
 * CampusIQ — CampusBrainController (frontend facade)
 * ==================================================
 * The single entry point the UI talks to. It hides the engine pipeline behind
 * two simple calls:
 *
 *   getSnapshot()        → full executive snapshot (deterministic, instant)
 *   narrateSummary()     → AI-narrated executive summary (LLM, with fallback)
 *   ask(question)        → grounded natural-language answer (LLM, with fallback)
 *
 * Keeping this orchestration out of React components means the intelligence
 * layer is fully testable and reusable (e.g. from a future mobile client or a
 * scheduled digest job).
 */

import { CampusContextService } from "./CampusContextService";
import { InsightAggregator } from "./InsightAggregator";
import { brainAIClient } from "./aiClient";
import type { BrainSnapshot, BrainAIResponse } from "./types";

export const CampusBrainController = {
  /**
   * Build a fresh unified context and run the full reasoning pipeline.
   * Pure + deterministic — safe to call on every dashboard refresh.
   */
  getSnapshot(): BrainSnapshot {
    const context = CampusContextService.build();
    return InsightAggregator.aggregate(context);
  },

  /** AI-narrated executive summary (gracefully falls back to deterministic). */
  narrateSummary(snapshot: BrainSnapshot, role: string, signal?: AbortSignal): Promise<BrainAIResponse> {
    return brainAIClient.summarize(snapshot, role, signal);
  },

  /** Answer an administrator's free-text question, grounded in live context. */
  ask(question: string, snapshot: BrainSnapshot, role: string, signal?: AbortSignal): Promise<BrainAIResponse> {
    return brainAIClient.ask(question, snapshot, role, signal);
  },
};
