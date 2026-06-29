import type { Evidence, Priority } from "@/services/campusBrain";
import type { SimulationType } from "@/services/realtime/types";

export interface OrchestrationStep {
  id: string;
  label: string;
  detail: string;
  status: "analysed" | "assigned" | "recommended" | "notified" | "updated";
  at: string;
}

export interface OrchestratedDecision {
  id: string;
  eventType: SimulationType | "sensor-anomaly";
  problem: string;
  severity: Priority;
  reason: string;
  confidence: number;
  expectedImpact: string;
  recommendedActions: string[];
  responsibleDepartments: string[];
  estimatedResolutionTime: string;
  affectedBuildings: string[];
  affectedStudents: number;
  affectedStaff: number;
  evidence: Evidence[];
  reasoningSteps: string[];
  alternativeActions: string[];
  expectedOutcome: string;
  workflow: OrchestrationStep[];
  createdAt: string;
  source: "live" | "simulation";
}

export interface ResilienceScore {
  current: number;
  previous: number;
  trend: "up" | "down" | "stable";
  contributors: Array<{ label: string; score: number }>;
  weakestArea: string;
}
