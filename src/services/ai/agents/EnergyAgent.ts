import type { SpecialistAgent } from "../types";
import { affected, result } from "./helpers";

export const EnergyAgent: SpecialistAgent = {
  name: "Energy Agent",
  isRelevant: ({ incident }) => ["fire", "power-failure", "flood", "hvac-failure", "overcrowding"].includes(incident.eventType),
  analyze(context) {
    const building = affected(context)[0];
    const riskyIsolation = context.incident.eventType === "fire" && (building?.occupancy ?? 0) > 300;
    return result(this.name, "Energy, HVAC and sustainability", context,
      riskyIsolation ? "Use controlled zone isolation; preserve emergency lighting while reducing HVAC and non-critical load." : "Reduce non-critical load and verify backup energy capacity.",
      [{ source: "IoT", detail: "Power draw", value: `${building?.power ?? 0} kW` }, { source: "IoT", detail: "HVAC temperature", value: `${building?.temperature ?? 0}°C` }],
      86, ["Compared draw with building baseline", "Protected emergency circuits", "Estimated load-reduction benefit"],
      riskyIsolation ? "caution" : "support");
  },
};
