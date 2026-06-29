export type BuildingStatus = "green" | "yellow" | "orange" | "red" | "blue";
export interface BuildingTelemetry {
  id: string;
  name: string;
  capacity: number;
  occupancy: number;
  health: number;
  status: BuildingStatus;
  temperature: number;
  humidity: number;
  smoke: number;
  noise: number;
  power: number;
  powerBase: number;
  waterLeakage: boolean;
  airQuality: number;
  maintenanceOpen: number;
  alerts: string[];
  updatedAt: string;
}
export interface CampusTelemetry {
  generatedAt: string;
  buildings: BuildingTelemetry[];
}
export interface LiveAlert {
  id: string;
  buildingId: string;
  buildingName: string;
  message: string;
  at: string;
}
export type ConnectionState = "connecting" | "connected" | "reconnecting" | "offline";
export type SimulationType = "fire" | "power-failure" | "flood" | "bus-delay" | "internet-outage" | "hvac-failure" | "overcrowding" | "medical-emergency";
export interface SimulationEvent { id: string; type: SimulationType; at: string; }
