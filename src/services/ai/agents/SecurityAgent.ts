import type { SpecialistAgent } from "../types";
import { affected, result } from "./helpers";

export const SecurityAgent: SpecialistAgent = {
  name: "Security Agent",
  isRelevant: ({ incident }) => ["fire", "flood", "overcrowding", "medical-emergency"].includes(incident.eventType),
  analyze(context) {
    const building = affected(context)[0];
    return result(this.name, "Emergency, crowd and building risk", context,
      context.incident.eventType === "fire" ? "Initiate staged evacuation, secure exits, and establish incident command." : "Secure the affected zone and control occupant movement.",
      [{ source: "Safety", detail: "Incident severity", value: context.incident.severity }, { source: "Resources", detail: "People exposed", value: building?.occupancy ?? context.incident.affectedStudents + context.incident.affectedStaff }],
      95, ["Classified life-safety risk", "Calculated occupant exposure", "Prioritised exit and responder access"]);
  },
};
