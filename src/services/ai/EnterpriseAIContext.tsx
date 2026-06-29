import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useOrchestrator } from "@/services/orchestrator/OrchestratorContext";
import { useRealtime } from "@/services/realtime/RealtimeContext";
import { AgentCoordinator, CAMPUS_AGENTS } from "./AgentCoordinator";
import { CampusMemory } from "./CampusMemory";
import { PatternRecognitionEngine } from "./PatternRecognitionEngine";
import { LearningEngine } from "./LearningEngine";
import { DecisionFusionEngine } from "./DecisionFusionEngine";
import type { AgentName, FusedExecutiveDecision, LearningMetrics, MemoryIncident } from "./types";

interface EnterpriseAIValue {
  decisions: FusedExecutiveDecision[];
  memory: MemoryIncident[];
  learning: LearningMetrics;
  agentNames: AgentName[];
  collaborationScore: number;
}

const EMPTY_LEARNING: LearningMetrics = { learningConfidence: 62, historicalAccuracy: 78, recommendationSuccessRate: 75, patternsLearned: 0 };
const EnterpriseAIContext = createContext<EnterpriseAIValue>({ decisions: [], memory: [], learning: EMPTY_LEARNING, agentNames: [], collaborationScore: 0 });

export function EnterpriseAIProvider({ children }: { children: ReactNode }) {
  const { decisions: incidents } = useOrchestrator();
  const { telemetry } = useRealtime();
  const [memory, setMemory] = useState<MemoryIncident[]>(() => CampusMemory.all());
  const lastSavedIncident = useRef("");
  const learning = useMemo(() => LearningEngine.metrics(memory), [memory]);

  const decisions = useMemo(() => {
    if (!telemetry) return [];
    return incidents.map((incident) => {
      const analyses = AgentCoordinator.coordinate({ incident, telemetry });
      const matches = PatternRecognitionEngine.search(incident, memory);
      return DecisionFusionEngine.fuse(incident, analyses, matches, learning);
    });
  }, [incidents, telemetry, memory, learning]);

  useEffect(() => {
    if (!telemetry || !incidents[0] || !decisions[0]) return;
    if (lastSavedIncident.current === incidents[0].id) return;
    lastSavedIncident.current = incidents[0].id;
    CampusMemory.remember(incidents[0], decisions[0], telemetry);
    setMemory(CampusMemory.all());
  }, [telemetry, incidents, decisions]);

  const collaborationScore = useMemo(() => {
    if (!decisions.length) return 100;
    const latest = decisions[0];
    const coverage = latest.agentAnalyses.length / CAMPUS_AGENTS.length;
    const agreement = 1 - latest.agentAnalyses.filter((analysis) => analysis.stance !== "support").length / Math.max(1, latest.agentAnalyses.length);
    return Math.round((coverage * .55 + agreement * .45) * 100);
  }, [decisions]);

  const value = useMemo(() => ({
    decisions,
    memory,
    learning,
    agentNames: CAMPUS_AGENTS.map((agent) => agent.name),
    collaborationScore,
  }), [decisions, memory, learning, collaborationScore]);
  return <EnterpriseAIContext.Provider value={value}>{children}</EnterpriseAIContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export const useEnterpriseAI = () => useContext(EnterpriseAIContext);
export type { FusedExecutiveDecision, MemoryIncident, LearningMetrics } from "./types";
