import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { useRealtime, type SimulationType } from "@/services/realtime/RealtimeContext";
import { CampusOrchestrator } from "./CampusOrchestrator";
import type { OrchestratedDecision, ResilienceScore } from "./types";

interface PresentationState { active: boolean; step: number; progress: number; label: string; }
interface OrchestratorValue {
  decisions: OrchestratedDecision[];
  resilience: ResilienceScore | null;
  presentation: PresentationState;
  trigger: (type: SimulationType) => void;
  startPresentation: () => void;
}

const STEPS: Array<{ label: string; type?: SimulationType }> = [
  { label: "Transport delay detected", type: "bus-delay" },
  { label: "Attendance impact correlated" },
  { label: "HVAC overheating detected", type: "hvac-failure" },
  { label: "Smoke alert escalated", type: "fire" },
  { label: "Maintenance response assigned" },
  { label: "Campus Brain analysis completed" },
  { label: "Digital Twin and dashboard synchronized" },
  { label: "Final executive summary generated" },
];

const OrchestratorContext = createContext<OrchestratorValue>({
  decisions: [], resilience: null, presentation: { active: false, step: 0, progress: 0, label: "" },
  trigger: () => undefined, startPresentation: () => undefined,
});

export function OrchestratorProvider({ children }: { children: ReactNode }) {
  const { telemetry, simulationEvents, triggerSimulation } = useRealtime();
  const [previousScore, setPreviousScore] = useState(86);
  const [presentation, setPresentation] = useState<PresentationState>({ active: false, step: 0, progress: 0, label: "" });
  const timers = useRef<number[]>([]);
  const decisions = useMemo(() => telemetry ? CampusOrchestrator.coordinate(telemetry, simulationEvents) : [], [telemetry, simulationEvents]);
  const resilience = useMemo(() => telemetry ? CampusOrchestrator.resilience(telemetry, decisions, previousScore) : null, [telemetry, decisions, previousScore]);

  useEffect(() => {
    if (resilience) {
      const timer = window.setTimeout(() => setPreviousScore(resilience.current), 12_000);
      return () => window.clearTimeout(timer);
    }
  }, [resilience]);

  const trigger = useCallback((type: SimulationType) => {
    triggerSimulation(type);
    toast.info(`Campus Orchestrator: ${type.replace(/-/g, " ")} simulation started`);
  }, [triggerSimulation]);

  const startPresentation = useCallback(() => {
    if (presentation.active) return;
    timers.current.forEach(window.clearTimeout);
    setPresentation({ active: true, step: 0, progress: 0, label: STEPS[0].label });
    STEPS.forEach((step, index) => {
      const timer = window.setTimeout(() => {
        if (step.type) triggerSimulation(step.type);
        toast.info(step.label);
        setPresentation({ active: index < STEPS.length - 1, step: index, progress: Math.round(((index + 1) / STEPS.length) * 100), label: step.label });
      }, index * 7000);
      timers.current.push(timer);
    });
  }, [presentation.active, triggerSimulation]);

  useEffect(() => () => timers.current.forEach(window.clearTimeout), []);
  const value = useMemo(() => ({ decisions, resilience, presentation, trigger, startPresentation }), [decisions, resilience, presentation, trigger, startPresentation]);
  return <OrchestratorContext.Provider value={value}>{children}</OrchestratorContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export const useOrchestrator = () => useContext(OrchestratorContext);
export type { OrchestratedDecision, ResilienceScore } from "./types";
