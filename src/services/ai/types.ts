import type { Evidence, Priority } from "@/services/campusBrain";
import type { OrchestratedDecision } from "@/services/orchestrator/types";
import type { CampusTelemetry } from "@/services/realtime/types";

export type AgentName = "Academic Agent" | "Maintenance Agent" | "Transport Agent" | "Security Agent" | "Energy Agent" | "Communication Agent";
export type AgentStance = "support" | "caution" | "oppose";

export interface AgentContext {
  incident: OrchestratedDecision;
  telemetry: CampusTelemetry;
}

export interface AgentAnalysis {
  agent: AgentName;
  domain: string;
  problem: string;
  evidence: Evidence[];
  confidence: number;
  recommendation: string;
  stance: AgentStance;
  reasoning: string[];
  completedAt: string;
}

export interface SpecialistAgent {
  name: AgentName;
  isRelevant(context: AgentContext): boolean;
  analyze(context: AgentContext): AgentAnalysis;
}

export interface MemoryIncident {
  id: string;
  incident: string;
  eventType: string;
  cause: string;
  actionsTaken: string[];
  outcome: "Successful" | "Partial" | "Failed" | "Pending";
  confidence: number;
  affectedBuildings: string[];
  affectedDepartments: string[];
  time: string;
  weather: string;
  occupancy: number;
  sensors: Array<{ building: string; temperature: number; smoke: number; power: number; airQuality: number }>;
  predictions: string[];
  finalResolution: string;
  resolutionMinutes?: number;
}

export interface PatternMatch {
  similarity: number;
  previousIncident: MemoryIncident;
  previousResolution: string;
  recommendedReuse: string;
}

export interface LearningMetrics {
  learningConfidence: number;
  historicalAccuracy: number;
  recommendationSuccessRate: number;
  patternsLearned: number;
}

export interface FusedExecutiveDecision {
  id: string;
  problem: string;
  severity: Priority;
  currentEvidence: Evidence[];
  historicalEvidence: Evidence[];
  similarIncidents: PatternMatch[];
  learningConfidence: number;
  reasonForRecommendation: string;
  recommendation: string[];
  expectedImprovement: string;
  alternativeActions: string[];
  agentAnalyses: AgentAnalysis[];
  conflictsResolved: string[];
  confidence: number;
  generatedAt: string;
}
