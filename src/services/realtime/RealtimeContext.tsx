import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { io, type Socket } from "socket.io-client";
import { toast } from "sonner";
import type { CampusTelemetry, ConnectionState, LiveAlert, SimulationEvent, SimulationType } from "./types";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";
const TELEMETRY_KEY = "campusiq.telemetry.latest";

interface RealtimeValue {
  telemetry: CampusTelemetry | null;
  connection: ConnectionState;
  alerts: LiveAlert[];
  revision: number;
  simulationEvents: SimulationEvent[];
  triggerSimulation: (type: SimulationType) => void;
}

const RealtimeContext = createContext<RealtimeValue>({ telemetry: null, connection: "connecting", alerts: [], revision: 0, simulationEvents: [], triggerSimulation: () => undefined });

function cachedTelemetry(): CampusTelemetry | null {
  try { return JSON.parse(localStorage.getItem(TELEMETRY_KEY) ?? "null"); } catch { return null; }
}

export function RealtimeProvider({ children }: { children: ReactNode }) {
  const [telemetry, setTelemetry] = useState<CampusTelemetry | null>(cachedTelemetry);
  const [connection, setConnection] = useState<ConnectionState>("connecting");
  const [alerts, setAlerts] = useState<LiveAlert[]>([]);
  const [revision, setRevision] = useState(0);
  const [simulationEvents, setSimulationEvents] = useState<SimulationEvent[]>([]);
  const socketRef = useRef<Socket | null>(null);

  const acceptTelemetry = useCallback((next: CampusTelemetry) => {
    setTelemetry(next);
    localStorage.setItem(TELEMETRY_KEY, JSON.stringify(next));
    setRevision((value) => value + 1);
    window.dispatchEvent(new CustomEvent("campusiq:telemetry", { detail: next }));
  }, []);

  useEffect(() => {
    const socket: Socket = io(API_URL, { reconnection: true, reconnectionAttempts: Infinity, reconnectionDelay: 800, reconnectionDelayMax: 5000 });
    socketRef.current = socket;
    socket.on("connect", () => setConnection("connected"));
    socket.on("disconnect", () => setConnection("reconnecting"));
    socket.io.on("reconnect_attempt", () => setConnection("reconnecting"));
    socket.io.on("reconnect_failed", () => setConnection("offline"));
    socket.on("campus:snapshot", acceptTelemetry);
    socket.on("iot:update", acceptTelemetry);
    socket.on("module:changed", () => setRevision((value) => value + 1));
    socket.on("simulation:event", (event: SimulationEvent) => {
      setSimulationEvents((current) => [event, ...current].slice(0, 20));
      setRevision((value) => value + 1);
    });
    socket.on("campus:alerts", (incoming: LiveAlert[]) => {
      setAlerts((current) => [...incoming, ...current].slice(0, 30));
      incoming.slice(0, 2).forEach((alert) => toast.warning(`${alert.buildingName}: ${alert.message}`));
    });
    const publish = (event: Event) => {
      const detail = (event as CustomEvent).detail;
      socket.emit("module:changed", detail);
      setRevision((value) => value + 1);
    };
    window.addEventListener("campusiq:module-change", publish);
    return () => {
      window.removeEventListener("campusiq:module-change", publish);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [acceptTelemetry]);

  const triggerSimulation = useCallback((type: SimulationType) => socketRef.current?.emit("simulation:trigger", { type }), []);
  const value = useMemo(() => ({ telemetry, connection, alerts, revision, simulationEvents, triggerSimulation }), [telemetry, connection, alerts, revision, simulationEvents, triggerSimulation]);
  return <RealtimeContext.Provider value={value}>{children}</RealtimeContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export const useRealtime = () => useContext(RealtimeContext);
export type { CampusTelemetry, BuildingTelemetry, BuildingStatus, LiveAlert, ConnectionState, SimulationType, SimulationEvent } from "./types";
