import type { SpecialistAgent } from "../types";
import { affected, result } from "./helpers";

export const AcademicAgent: SpecialistAgent = {
  name: "Academic Agent",
  isRelevant: ({ incident }) => ["bus-delay", "overcrowding", "hvac-failure", "internet-outage"].includes(incident.eventType),
  analyze(context) {
    const occupancy = affected(context).reduce((sum, building) => sum + building.occupancy, 0);
    return result(this.name, "Attendance, performance and classroom continuity", context,
      context.incident.eventType === "bus-delay" ? "Apply an attendance grace period and alert first-period faculty." : "Relocate affected classes and preserve attendance records.",
      [{ source: "Attendance", detail: "Estimated affected students", value: context.incident.affectedStudents }, { source: "Resources", detail: "Affected building occupancy", value: occupancy }],
      84, ["Estimated student exposure", "Mapped event to teaching continuity", "Checked classroom capacity alternatives"],
      context.incident.eventType === "overcrowding" ? "caution" : "support");
  },
};
