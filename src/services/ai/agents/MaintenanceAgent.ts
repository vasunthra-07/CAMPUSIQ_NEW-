import type { SpecialistAgent } from "../types";
import { affected, result } from "./helpers";

export const MaintenanceAgent: SpecialistAgent = {
  name: "Maintenance Agent",
  isRelevant: ({ incident }) => ["fire", "power-failure", "flood", "hvac-failure", "internet-outage"].includes(incident.eventType),
  analyze(context) {
    const building = affected(context)[0];
    const evidence = building ? [
      { source: "IoT" as const, detail: "Temperature", value: `${building.temperature}°C` },
      { source: "IoT" as const, detail: "Smoke", value: `${building.smoke} ppm` },
      { source: "Maintenance" as const, detail: "Open maintenance", value: building.maintenanceOpen },
    ] : context.incident.evidence;
    return result(this.name, "Assets and predictive maintenance", context,
      "Dispatch the appropriate maintenance crew, isolate affected equipment, and capture verification readings.",
      evidence, 91, ["Validated sensor threshold", "Checked asset exposure", "Prioritised isolation before repair"]);
  },
};
