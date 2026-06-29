import type { CampusTelemetry, SimulationEvent, SimulationType } from "@/services/realtime/types";
import type { OrchestratedDecision, OrchestrationStep, ResilienceScore } from "./types";

const LABELS: Record<SimulationType, string> = {
  fire: "Smoke and fire condition detected",
  "power-failure": "Building power failure",
  flood: "Water leakage and flood risk",
  "bus-delay": "Campus transport delay",
  "internet-outage": "Campus internet outage",
  "hvac-failure": "HVAC thermal failure",
  overcrowding: "Critical building overcrowding",
  "medical-emergency": "Medical emergency reported",
};

const CONFIG: Record<SimulationType, {
  severity: OrchestratedDecision["severity"]; departments: string[]; resolution: string; actions: string[]; alternatives: string[];
}> = {
  fire: { severity: "Critical", departments: ["Security", "Maintenance", "Safety Office"], resolution: "15–30 minutes", actions: ["Verify alarm and identify nearest safe exits", "Dispatch security and fire response", "Recommend staged evacuation by occupancy priority", "Isolate power and HVAC in the affected zone"], alternatives: ["Shelter in place if evacuation route is unsafe", "Partial floor evacuation after sensor verification"] },
  "power-failure": { severity: "High", departments: ["Facilities", "Electrical Maintenance", "IT Operations"], resolution: "30–60 minutes", actions: ["Transfer critical labs to backup power", "Reduce non-essential electrical load", "Inspect distribution panel and outage probability", "Notify affected faculty and lab owners"], alternatives: ["Controlled shutdown of non-critical blocks", "Relocate critical sessions"] },
  flood: { severity: "Critical", departments: ["Facilities", "Maintenance", "Security"], resolution: "30–90 minutes", actions: ["Isolate water supply and electrical circuits", "Restrict access to affected area", "Dispatch plumbing response", "Relocate occupants from lower floors"], alternatives: ["Deploy temporary barriers", "Move equipment before full closure"] },
  "bus-delay": { severity: "High", departments: ["Transport", "Academic Affairs", "Communications"], resolution: "20–45 minutes", actions: ["Estimate late students from route occupancy", "Identify first-period classes", "Notify faculty and affected students", "Recommend attendance grace period", "Dispatch alternate transport"], alternatives: ["Remote first-period attendance", "Stagger class start times"] },
  "internet-outage": { severity: "High", departments: ["IT Operations", "Academic Affairs"], resolution: "20–60 minutes", actions: ["Check core network and critical services", "Fail over to secondary connectivity", "Notify faculty of LMS impact", "Prioritise examination and lab traffic"], alternatives: ["Offline teaching mode", "Mobile hotspot allocation for critical teams"] },
  "hvac-failure": { severity: "High", departments: ["Maintenance", "Facilities", "Academic Affairs"], resolution: "30–90 minutes", actions: ["Dispatch HVAC maintenance", "Reduce room capacity", "Move heat-sensitive equipment", "Notify faculty and occupants"], alternatives: ["Relocate classes", "Use temporary ventilation and cooling"] },
  overcrowding: { severity: "High", departments: ["Security", "Facilities", "Event Operations"], resolution: "10–25 minutes", actions: ["Stop additional entry", "Open overflow space", "Verify exit capacity", "Redistribute occupants"], alternatives: ["Stagger entry", "Stream the event to adjacent rooms"] },
  "medical-emergency": { severity: "Critical", departments: ["Campus Health", "Security", "Communications"], resolution: "5–15 minutes", actions: ["Dispatch medical response", "Clear access route for responders", "Notify security and nearest first aider", "Prepare ambulance transfer if required"], alternatives: ["On-site stabilisation", "Transfer to partner hospital"] },
};

function workflow(type: SimulationType, at: string, building: string, occupancy: number): OrchestrationStep[] {
  const labels = [
    ["Event analysed", `${LABELS[type]} at ${building}`],
    ["Risk assessed", `Occupancy and operational dependencies checked (${occupancy} people)`],
    ["Action plan generated", `${CONFIG[type].actions.length} explainable actions prioritised`],
    ["Departments assigned", CONFIG[type].departments.join(", ")],
    ["Notifications prepared", "Responsible teams, affected faculty and occupants targeted"],
    ["Digital twin updated", `${building} state reflects incident severity`],
    ["Executive dashboard updated", "Decision, resilience and timeline recalculated"],
  ];
  return labels.map(([label, detail], index) => ({ id: `${type}-${index}`, label, detail, status: index < 2 ? "analysed" : index === 2 ? "recommended" : index === 3 ? "assigned" : index === 4 ? "notified" : "updated", at: new Date(new Date(at).getTime() + index * 1000).toISOString() } as OrchestrationStep));
}

function decision(type: SimulationType, telemetry: CampusTelemetry, event?: SimulationEvent): OrchestratedDecision {
  const candidates = telemetry.buildings.filter((building) => building.alerts.length > 0);
  const building = candidates[0] ?? telemetry.buildings[type === "bus-delay" ? 1 : 0];
  const config = CONFIG[type];
  const at = event?.at ?? telemetry.generatedAt;
  const simulated = Boolean(event);
  const affectedStudents = type === "bus-delay" ? 96 : Math.round(building.occupancy * 0.82);
  return {
    id: `${type}-${building.id}-${Math.floor(new Date(at).getTime() / 10_000)}`,
    eventType: type,
    problem: LABELS[type],
    severity: config.severity,
    reason: `${simulated ? "What-if event" : "Live telemetry"} combined with current occupancy and building operating thresholds requires coordinated response.`,
    confidence: simulated ? 96 : Math.min(94, 72 + building.alerts.length * 6),
    expectedImpact: config.severity === "Critical" ? "Prevent injury, service disruption and asset damage" : "Reduce disruption and restore normal operations",
    recommendedActions: config.actions,
    responsibleDepartments: config.departments,
    estimatedResolutionTime: config.resolution,
    affectedBuildings: [building.name],
    affectedStudents,
    affectedStaff: Math.max(4, Math.round(building.occupancy * 0.18)),
    evidence: [
      { source: "IoT", detail: `${building.name} health`, value: `${building.health}%` },
      { source: "Resources", detail: "Current occupancy", value: `${building.occupancy}/${building.capacity}` },
      ...building.alerts.slice(0, 4).map((detail) => ({ source: "IoT" as const, detail })),
    ],
    reasoningSteps: ["Validated event against live sensor snapshot", "Checked occupancy and exposure", "Mapped operational dependencies and response ownership", "Ranked actions by safety and continuity impact"],
    alternativeActions: config.alternatives,
    expectedOutcome: `Stabilise ${building.name} within ${config.resolution}, protect affected people, and preserve critical campus operations.`,
    workflow: workflow(type, at, building.name, building.occupancy),
    createdAt: at,
    source: simulated ? "simulation" : "live",
  };
}

export const CampusOrchestrator = {
  coordinate(telemetry: CampusTelemetry, events: SimulationEvent[]): OrchestratedDecision[] {
    const output = events.slice(0, 10).map((event) => decision(event.type, telemetry, event));
    telemetry.buildings.forEach((building) => {
      if (!building.alerts.length) return;
      const type: SimulationType = building.smoke >= 20 ? "fire" : building.waterLeakage ? "flood" : building.temperature >= 38 ? "hvac-failure" : building.power === 0 ? "power-failure" : building.occupancy / building.capacity >= .95 ? "overcrowding" : "hvac-failure";
      output.push(decision(type, { ...telemetry, buildings: [building] }));
    });
    return [...new Map(output.map((item) => [item.id, item])).values()].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 12);
  },

  resilience(telemetry: CampusTelemetry, decisions: OrchestratedDecision[], previous = 86): ResilienceScore {
    const avgHealth = telemetry.buildings.reduce((sum, building) => sum + building.health, 0) / Math.max(1, telemetry.buildings.length);
    const contributors = [
      { label: "Infrastructure", score: Math.round(avgHealth) },
      { label: "Emergency Readiness", score: decisions.some((decision) => decision.severity === "Critical") ? 72 : 92 },
      { label: "Maintenance", score: Math.max(45, 96 - telemetry.buildings.reduce((sum, building) => sum + building.maintenanceOpen, 0) * 7) },
      { label: "Transport", score: decisions.some((decision) => decision.eventType === "bus-delay") ? 61 : 91 },
      { label: "Safety", score: Math.max(35, 96 - decisions.filter((decision) => decision.severity === "Critical").length * 16) },
      { label: "Energy", score: Math.round(telemetry.buildings.reduce((sum, building) => sum + Math.min(100, building.powerBase ? 110 - Math.abs(building.power / building.powerBase - 1) * 70 : 40), 0) / Math.max(1, telemetry.buildings.length)) },
      { label: "Occupancy", score: Math.round(telemetry.buildings.reduce((sum, building) => sum + (building.occupancy / building.capacity > .95 ? 55 : 92), 0) / Math.max(1, telemetry.buildings.length)) },
      { label: "Trend Stability", score: decisions.length > 3 ? 68 : 90 },
      { label: "Predictions", score: decisions.length ? 78 : 93 },
    ];
    const current = Math.round(contributors.reduce((sum, item) => sum + item.score, 0) / contributors.length);
    return { current, previous, trend: current > previous ? "up" : current < previous ? "down" : "stable", contributors: [...contributors].sort((a, b) => b.score - a.score), weakestArea: [...contributors].sort((a, b) => a.score - b.score)[0].label };
  },
};
