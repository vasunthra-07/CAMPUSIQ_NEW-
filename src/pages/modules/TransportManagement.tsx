import { useTransportRoutes } from "@/hooks/useCampusData";
import { AnimatedNumber } from "@/components/motion/AnimatedNumber";
import { PageHeader, MetricTile, WorkspacePanel, StatusBadge } from "@/components/workspace";
import { Car, Users, MapPin, User, Activity, Navigation } from "lucide-react";

export default function TransportManagement() {
  const { data: routes, isLoading } = useTransportRoutes();

  if (isLoading || !routes) {
    return <div className="flex h-64 items-center justify-center text-muted-foreground">Loading transport data…</div>;
  }

  const totalPassengers = routes.reduce((a, r) => a + r.passengers, 0);
  const totalCapacity = routes.reduce((a, r) => a + r.capacity, 0);
  const avgUtil = Math.round((totalPassengers / totalCapacity) * 100);
  const runningRoutes = routes.filter(r => r.status === "Running").length;

  return (
    <div className="space-y-6 pb-10">
      <PageHeader
        eyebrow="Mobility Operations"
        title="Mobility Operations Center"
        description="Route management, vehicle tracking, and occupancy monitoring"
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <MetricTile label="Active Routes" value={<AnimatedNumber value={routes.length} />} icon={Car} variant="primary" delay={0} />
        <MetricTile label="Passengers" value={<AnimatedNumber value={totalPassengers} />} icon={Users} variant="default" delay={0.05} />
        <MetricTile label="Occupancy" value={<AnimatedNumber value={avgUtil} suffix="%" />} icon={Activity} variant={avgUtil > 85 ? "warning" : "success"} delay={0.1} />
        <MetricTile label="Running" value={<AnimatedNumber value={runningRoutes} />} icon={Navigation} variant="success" delay={0.15} />
      </div>

      <WorkspacePanel title="Route Status" description="Live fleet tracking" icon={MapPin} delay={0.2}>
        <div className="grid gap-3 md:grid-cols-2">
          {routes.map(route => {
            const util = Math.round((route.passengers / route.capacity) * 100);
            const isFull = route.status === "Full";
            return (
              <div key={route.id} className="rounded-lg border border-border p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <Car className="h-4 w-4 text-primary" />
                      <p className="font-medium text-foreground">{route.route}</p>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{route.busNo} · {route.stops} stops</p>
                  </div>
                  <StatusBadge variant={isFull ? "danger" : "success"}>{route.status}</StatusBadge>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                  <User className="h-3.5 w-3.5" />
                  <span>Driver: <span className="text-foreground font-medium">{route.driverName}</span></span>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>{route.passengers} / {route.capacity} seats</span>
                  <span className="font-medium tabular-nums">{util}%</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${util}%`, background: isFull ? "#EF4444" : "#2563EB" }} />
                </div>
              </div>
            );
          })}
        </div>
      </WorkspacePanel>
    </div>
  );
}
