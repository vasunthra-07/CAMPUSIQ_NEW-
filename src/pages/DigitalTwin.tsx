import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, Building2, Droplets, Gauge, Users, Wind, Zap, Thermometer, Volume2, Flame, Wifi } from "lucide-react";
import { PageHeader, WorkspacePanel, MetricTile, StatusBadge } from "@/components/workspace";
import { useRealtime, type BuildingTelemetry, type BuildingStatus } from "@/services/realtime/RealtimeContext";
import { cn } from "@/lib/utils";
import { SimulationPanel } from "@/components/orchestrator/ExecutiveOrchestration";

const STATUS_STYLE: Record<BuildingStatus, string> = {
  green: "border-emerald-500/50 bg-emerald-500/10 text-emerald-500",
  yellow: "border-yellow-500/60 bg-yellow-500/10 text-yellow-500",
  orange: "border-orange-500/60 bg-orange-500/10 text-orange-500",
  red: "border-red-500/70 bg-red-500/10 text-red-500",
  blue: "border-blue-500/50 bg-blue-500/10 text-blue-500",
};

export default function DigitalTwin() {
  const { telemetry, connection, alerts } = useRealtime();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const buildings = useMemo(() => telemetry?.buildings ?? [], [telemetry]);
  const selected = buildings.find((building) => building.id === selectedId) ?? buildings[0];
  const totals = useMemo(() => ({
    occupancy: buildings.reduce((sum, building) => sum + building.occupancy, 0),
    capacity: buildings.reduce((sum, building) => sum + building.capacity, 0),
    power: Math.round(buildings.reduce((sum, building) => sum + building.power, 0)),
    alerts: buildings.reduce((sum, building) => sum + building.alerts.length, 0),
  }), [buildings]);

  return (
    <div className="space-y-6 pb-12">
      <PageHeader eyebrow="Live Smart Campus" title="Campus Digital Twin" description="A real-time operational model driven by building sensors and module events." actions={
        <StatusBadge variant={connection === "connected" ? "success" : connection === "offline" ? "danger" : "warning"}>
          <Wifi className={cn("mr-1 h-3 w-3", connection !== "connected" && "animate-pulse")} /> {connection}
        </StatusBadge>
      } />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetricTile label="Buildings Online" value={buildings.length} icon={Building2} variant="success" subtitle="Sensor-linked" />
        <MetricTile label="Live Occupancy" value={totals.occupancy} icon={Users} variant="primary" subtitle={`of ${totals.capacity} capacity`} />
        <MetricTile label="Campus Power" value={`${totals.power} kW`} icon={Zap} variant="warning" subtitle="Current demand" />
        <MetricTile label="Active Alerts" value={totals.alerts} icon={Activity} variant={totals.alerts ? "danger" : "success"} subtitle={`${alerts.length} events captured`} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.45fr_0.75fr]">
        <WorkspacePanel title="Interactive Campus Model" description="Select a building for operational detail" icon={Building2}>
          {!telemetry ? (
            <div className="flex min-h-[430px] items-center justify-center rounded-xl border border-dashed border-border text-sm text-muted-foreground">
              Connecting to campus sensor network…
            </div>
          ) : (
            <div className="relative grid min-h-[430px] grid-cols-2 gap-4 overflow-hidden rounded-xl border border-border bg-muted/20 p-5 sm:grid-cols-3">
              <div className="pointer-events-none absolute inset-0 opacity-25" style={{ backgroundImage: "linear-gradient(hsl(var(--border)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--border)) 1px, transparent 1px)", backgroundSize: "28px 28px" }} />
              {buildings.map((building, index) => (
                <motion.button
                  key={building.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.04 }}
                  onClick={() => setSelectedId(building.id)}
                  className={cn("relative z-10 min-h-36 rounded-xl border-2 p-4 text-left shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg", STATUS_STYLE[building.status], selected?.id === building.id && "ring-2 ring-primary ring-offset-2 ring-offset-background")}
                >
                  <div className="flex items-start justify-between">
                    <Building2 className="h-7 w-7" />
                    <span className="relative flex h-2.5 w-2.5"><span className="absolute h-full w-full animate-ping rounded-full bg-current opacity-50" /><span className="relative h-2.5 w-2.5 rounded-full bg-current" /></span>
                  </div>
                  <p className="mt-4 text-sm font-semibold text-foreground">{building.name}</p>
                  <div className="mt-2 flex items-center justify-between text-xs">
                    <span>{building.health}% health</span><span>{building.occupancy}/{building.capacity}</span>
                  </div>
                </motion.button>
              ))}
            </div>
          )}
          <div className="mt-3 flex flex-wrap gap-3 text-[11px] text-muted-foreground">
            {Object.keys(STATUS_STYLE).map((status) => <span key={status} className="flex items-center gap-1.5 capitalize"><span className={cn("h-2.5 w-2.5 rounded-full border", STATUS_STYLE[status as BuildingStatus])} />{status}</span>)}
          </div>
        </WorkspacePanel>

        <WorkspacePanel title="Operational Detail" description={selected?.name ?? "Awaiting telemetry"} icon={Gauge}>
          <AnimatePresence mode="wait">
            {selected && <motion.div key={selected.id} initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
              <div className={cn("rounded-xl border p-4", STATUS_STYLE[selected.status])}>
                <div className="flex items-center justify-between"><span className="text-sm font-semibold uppercase">{selected.status} state</span><span className="text-2xl font-bold">{selected.health}</span></div>
                <p className="mt-1 text-xs text-muted-foreground">Updated {new Date(selected.updatedAt).toLocaleTimeString()}</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Sensor icon={Thermometer} label="Temperature" value={`${selected.temperature}°C`} />
                <Sensor icon={Droplets} label="Humidity" value={`${selected.humidity}%`} />
                <Sensor icon={Flame} label="Smoke" value={`${selected.smoke} ppm`} />
                <Sensor icon={Volume2} label="Noise" value={`${selected.noise} dB`} />
                <Sensor icon={Users} label="Occupancy" value={`${selected.occupancy}/${selected.capacity}`} />
                <Sensor icon={Zap} label="Power" value={`${selected.power} kW`} />
                <Sensor icon={Droplets} label="Water" value={selected.waterLeakage ? "Leak detected" : "Normal"} danger={selected.waterLeakage} />
                <Sensor icon={Wind} label="Air Quality" value={`AQI ${selected.airQuality}`} danger={selected.airQuality >= 130} />
              </div>
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Maintenance & alerts</p>
                <p className="text-sm text-foreground">{selected.maintenanceOpen} open maintenance task(s)</p>
                {selected.alerts.length ? selected.alerts.map((alert) => <p key={alert} className="mt-2 rounded-md border border-red-500/30 bg-red-500/10 p-2 text-xs text-red-500">{alert}</p>) : <p className="mt-2 text-xs text-emerald-500">All sensors within operating thresholds.</p>}
              </div>
            </motion.div>}
          </AnimatePresence>
        </WorkspacePanel>
      </div>
      <SimulationPanel />
    </div>
  );
}

function Sensor({ icon: Icon, label, value, danger }: { icon: typeof Activity; label: string; value: string; danger?: boolean }) {
  return <div className={cn("rounded-lg border border-border bg-muted/20 p-3", danger && "border-red-500/40 bg-red-500/10")}><Icon className={cn("h-4 w-4 text-primary", danger && "text-red-500")} /><p className="mt-2 text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p><p className="mt-0.5 text-sm font-semibold text-foreground">{value}</p></div>;
}
