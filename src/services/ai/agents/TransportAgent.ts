import type { SpecialistAgent } from "../types";
import { result } from "./helpers";

export const TransportAgent: SpecialistAgent = {
  name: "Transport Agent",
  isRelevant: ({ incident }) => incident.eventType === "bus-delay",
  analyze(context) {
    return result(this.name, "Mobility and arrival prediction", context,
      "Dispatch a relief vehicle, publish revised ETAs, and rebalance nearby routes.",
      [{ source: "Transport", detail: "Estimated late students", value: context.incident.affectedStudents }, { source: "Attendance", detail: "Arrival risk window", value: "First period" }],
      89, ["Estimated passenger delay", "Compared alternate route capacity", "Projected arrival impact"]);
  },
};
