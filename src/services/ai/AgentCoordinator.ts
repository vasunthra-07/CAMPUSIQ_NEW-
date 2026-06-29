import type { AgentAnalysis, AgentContext } from "./types";
import { AcademicAgent } from "./agents/AcademicAgent";
import { MaintenanceAgent } from "./agents/MaintenanceAgent";
import { TransportAgent } from "./agents/TransportAgent";
import { SecurityAgent } from "./agents/SecurityAgent";
import { EnergyAgent } from "./agents/EnergyAgent";
import { CommunicationAgent } from "./agents/CommunicationAgent";

export const CAMPUS_AGENTS = [AcademicAgent, MaintenanceAgent, TransportAgent, SecurityAgent, EnergyAgent, CommunicationAgent];

export const AgentCoordinator = {
  coordinate(context: AgentContext): AgentAnalysis[] {
    return CAMPUS_AGENTS.filter((agent) => agent.isRelevant(context)).map((agent) => agent.analyze(context));
  },
};
