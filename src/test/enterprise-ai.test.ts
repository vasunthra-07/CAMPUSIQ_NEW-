import { beforeEach, describe, expect, it } from "vitest";
import { AgentCoordinator } from "@/services/ai/AgentCoordinator";
import { DecisionFusionEngine } from "@/services/ai/DecisionFusionEngine";
import { LearningEngine } from "@/services/ai/LearningEngine";
import { CampusMemory } from "@/services/ai/CampusMemory";
import type { CampusTelemetry } from "@/services/realtime/types";
import type { OrchestratedDecision } from "@/services/orchestrator/types";

const telemetry: CampusTelemetry = {
  generatedAt: "2026-06-29T10:00:00.000Z",
  buildings: [{
    id: "labs", name: "Engineering Labs", capacity: 380, occupancy: 242, health: 28, status: "red",
    temperature: 42, humidity: 60, smoke: 48, noise: 62, power: 236, powerBase: 236,
    waterLeakage: false, airQuality: 205, maintenanceOpen: 2,
    alerts: ["Smoke threshold exceeded: 48 ppm"], updatedAt: "2026-06-29T10:00:00.000Z",
  }],
};

const fire: OrchestratedDecision = {
  id: "fire-labs-test", eventType: "fire", problem: "Smoke and fire condition detected", severity: "Critical",
  reason: "Live smoke and temperature thresholds exceeded.", confidence: 96,
  expectedImpact: "Prevent injury and asset damage",
  recommendedActions: ["Evacuate", "Isolate affected systems"],
  responsibleDepartments: ["Security", "Maintenance", "Safety Office"],
  estimatedResolutionTime: "15–30 minutes", affectedBuildings: ["Engineering Labs"],
  affectedStudents: 198, affectedStaff: 44,
  evidence: [{ source: "IoT", detail: "Smoke", value: "48 ppm" }],
  reasoningSteps: ["Validated smoke threshold"], alternativeActions: ["Shelter in place"],
  expectedOutcome: "Safe evacuation and incident containment", workflow: [],
  createdAt: "2026-06-29T10:00:00.000Z", source: "simulation",
};

describe("Enterprise multi-agent fire pipeline", () => {
  beforeEach(() => localStorage.clear());

  it("coordinates Security, Maintenance and Communication before decision fusion and memory", () => {
    const analyses = AgentCoordinator.coordinate({ incident: fire, telemetry });
    const names = analyses.map((analysis) => analysis.agent);
    expect(names).toContain("Security Agent");
    expect(names).toContain("Maintenance Agent");
    expect(names).toContain("Communication Agent");
    expect(names).toContain("Energy Agent");

    const learning = LearningEngine.metrics([]);
    const fused = DecisionFusionEngine.fuse(fire, analyses, [], learning);
    expect(fused.currentEvidence.length).toBeGreaterThan(2);
    expect(fused.reasonForRecommendation).toContain("specialist agents");
    expect(fused.confidence).toBeGreaterThan(80);

    CampusMemory.remember(fire, fused, telemetry);
    expect(CampusMemory.all()[0].affectedBuildings).toContain("Engineering Labs");
    expect(CampusMemory.all()[0].sensors[0].smoke).toBe(48);
  });
});
