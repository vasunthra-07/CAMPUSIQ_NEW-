import type { SpecialistAgent } from "../types";
import { result } from "./helpers";

export const CommunicationAgent: SpecialistAgent = {
  name: "Communication Agent",
  isRelevant: () => true,
  analyze(context) {
    return result(this.name, "Stakeholder communication and escalation", context,
      `Notify ${context.incident.responsibleDepartments.join(", ")}, affected faculty, staff and students with role-specific instructions.`,
      [{ source: "Communications", detail: "Responsible departments", value: context.incident.responsibleDepartments.join(", ") }, { source: "Students", detail: "Affected recipients", value: context.incident.affectedStudents + context.incident.affectedStaff }],
      93, ["Identified response owners", "Segmented affected stakeholders", "Selected severity-matched escalation path"]);
  },
};
