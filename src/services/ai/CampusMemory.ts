import type { CampusTelemetry } from "@/services/realtime/types";
import type { OrchestratedDecision } from "@/services/orchestrator/types";
import type { FusedExecutiveDecision, MemoryIncident } from "./types";

const KEY = "campusiq.enterprise.memory.v1";

function read(): MemoryIncident[] {
  try { return JSON.parse(localStorage.getItem(KEY) ?? "[]"); } catch { return []; }
}

function write(records: MemoryIncident[]) {
  localStorage.setItem(KEY, JSON.stringify(records.slice(0, 100)));
  window.dispatchEvent(new CustomEvent("campusiq:memory-updated"));
}

export const CampusMemory = {
  all: read,
  remember(incident: OrchestratedDecision, decision: FusedExecutiveDecision, telemetry: CampusTelemetry): MemoryIncident {
    const records = read();
    const buildingKey = incident.affectedBuildings.join("|");
    const existing = records.find((record) => record.eventType === incident.eventType && record.affectedBuildings.join("|") === buildingKey && Date.now() - new Date(record.time).getTime() < 600_000);
    const buildings = telemetry.buildings.filter((building) => incident.affectedBuildings.includes(building.name));
    const record: MemoryIncident = {
      id: existing?.id ?? `memory-${Date.now()}`,
      incident: incident.problem,
      eventType: incident.eventType,
      cause: incident.reason,
      actionsTaken: decision.recommendation,
      outcome: existing?.outcome ?? "Pending",
      confidence: decision.confidence,
      affectedBuildings: incident.affectedBuildings,
      affectedDepartments: incident.responsibleDepartments,
      time: existing?.time ?? incident.createdAt,
      weather: "Weather feed not connected",
      occupancy: buildings.reduce((sum, building) => sum + building.occupancy, 0),
      sensors: buildings.map((building) => ({ building: building.name, temperature: building.temperature, smoke: building.smoke, power: building.power, airQuality: building.airQuality })),
      predictions: [incident.expectedImpact],
      finalResolution: existing?.finalResolution ?? "Response in progress",
      resolutionMinutes: existing?.resolutionMinutes,
    };
    write([record, ...records.filter((item) => item.id !== record.id)]);
    return record;
  },
  resolve(id: string, outcome: MemoryIncident["outcome"], finalResolution: string, resolutionMinutes: number) {
    write(read().map((record) => record.id === id ? { ...record, outcome, finalResolution, resolutionMinutes } : record));
  },
};
