import { useState } from "react";
import { useTransportRoutes, useRequestTransportSeat, useCancelTransportSeat } from "@/hooks/useCampusData";
import { useAuth } from "@/context/AuthContext";
import { AnimatedNumber } from "@/components/motion/AnimatedNumber";
import { PageHeader, MetricTile, WorkspacePanel, StatusBadge } from "@/components/workspace";
import { Car, Users, MapPin, User, Activity, Navigation, Plus, X, Phone, Clock, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { TransportRoute } from "@/services/campusStore";

const STOP_OPTIONS = ["Tambaram", "Velachery", "Guindy", "Porur", "Chromepet", "Pallavaram", "Saidapet", "Adyar"];

export default function TransportManagement() {
  const { user } = useAuth();
  const { data: routes, isLoading } = useTransportRoutes();
  const requestSeat = useRequestTransportSeat();
  const cancelSeat = useCancelTransportSeat();

  const [requestOpen, setRequestOpen] = useState<TransportRoute | null>(null);
  const [selectedStop, setSelectedStop] = useState(STOP_OPTIONS[0]);
  const [detailRoute, setDetailRoute] = useState<TransportRoute | null>(null);

  const userId = user?.userId ?? "guest";
  const userName = user?.name ?? "Student";

  if (isLoading || !routes) {
    return (
      <div className="space-y-6 pb-10">
        <div className="h-12 w-64 rounded-lg bg-muted animate-pulse" />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[0, 1, 2, 3].map(i => <div key={i} className="h-24 rounded-xl bg-muted animate-pulse" />)}
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {[0, 1, 2, 3].map(i => <div key={i} className="h-40 rounded-xl bg-muted animate-pulse" />)}
        </div>
      </div>
    );
  }

  const totalPassengers = routes.reduce((a, r) => a + r.passengers, 0);
  const totalCapacity = routes.reduce((a, r) => a + r.capacity, 0);
  const avgUtil = Math.round((totalPassengers / Math.max(totalCapacity, 1)) * 100);
  const runningRoutes = routes.filter(r => r.status === "Running").length;

  const myRoute = routes.find(r => r.requestedSeats.some(s => s.userId === userId));

  const handleRequest = () => {
    if (!requestOpen) return;
    requestSeat.mutate({ routeId: requestOpen.id, userId, name: userName, stop: selectedStop }, {
      onSuccess: () => {
        toast.success(`Seat requested on ${requestOpen.route} at ${selectedStop} stop. You will be notified.`);
        setRequestOpen(null);
      },
    });
  };

  const handleCancel = (routeId: string) => {
    cancelSeat.mutate({ routeId, userId }, {
      onSuccess: () => toast.success("Seat request cancelled"),
    });
  };

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

      {/* My booking */}
      {myRoute && (
        <WorkspacePanel title="My Seat Request" description="Your active transport booking" icon={CheckCircle} delay={0.18}>
          <div className="flex items-center justify-between rounded-lg border border-primary/20 bg-primary/5 p-4">
            <div>
              <p className="text-sm font-semibold text-foreground">{myRoute.route}</p>
              <p className="text-xs text-muted-foreground">{myRoute.busNo} · Departure: {myRoute.departureTime}</p>
              <p className="text-xs text-muted-foreground">Stop: {myRoute.requestedSeats.find(s => s.userId === userId)?.stop ?? "—"}</p>
            </div>
            <button onClick={() => handleCancel(myRoute.id)} className="btn-secondary text-xs px-3 py-2 rounded-lg text-destructive border-destructive/20">
              Cancel Request
            </button>
          </div>
        </WorkspacePanel>
      )}

      <WorkspacePanel title="Route Status" description="Live fleet tracking" icon={MapPin} delay={0.2}>
        <div className="grid gap-3 md:grid-cols-2">
          {routes.map(route => {
            const util = Math.round((route.passengers / route.capacity) * 100);
            const isFull = route.status === "Full";
            const hasRequested = route.requestedSeats.some(s => s.userId === userId);
            return (
              <div key={route.id} className="rounded-lg border border-border p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <Car className="h-4 w-4 text-primary" />
                      <p className="font-medium text-foreground">{route.route}</p>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{route.busNo} · {route.stops} stops</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" />Dep: {route.departureTime}</span>
                      <span className="flex items-center gap-1"><Navigation className="h-3 w-3" />Arr: {route.arrivalTime}</span>
                    </div>
                  </div>
                  <StatusBadge variant={route.status === "Running" ? "success" : route.status === "Full" ? "danger" : "warning"}>{route.status}</StatusBadge>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                  <User className="h-3.5 w-3.5" />
                  <span>Driver: <span className="text-foreground font-medium">{route.driverName}</span></span>
                  <a href={`tel:${route.driverPhone.replace(/[^0-9]/g, "")}`} className="ml-auto flex items-center gap-1 text-primary hover:underline">
                    <Phone className="h-3 w-3" /> Call
                  </a>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>{route.passengers} / {route.capacity} seats</span>
                  <span className="font-medium tabular-nums">{util}%</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden mb-3">
                  <div className="h-full rounded-full transition-all" style={{ width: `${util}%`, background: isFull ? "hsl(var(--destructive))" : "hsl(var(--primary))" }} />
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setDetailRoute(route)} className="btn-secondary flex-1 py-2 text-xs rounded-lg">View Stops</button>
                  {hasRequested ? (
                    <button onClick={() => handleCancel(route.id)} className="flex-1 py-2 text-xs rounded-lg border border-destructive/20 text-destructive hover:bg-destructive/10 transition-colors">
                      Cancel Request
                    </button>
                  ) : !isFull ? (
                    <button onClick={() => setRequestOpen(route)} className="btn-primary flex-1 py-2 text-xs rounded-lg">
                      Request Seat
                    </button>
                  ) : (
                    <div className="flex-1 py-2 text-xs text-center text-muted-foreground border border-border rounded-lg">Bus Full</div>
                  )}
                </div>
                {route.requestedSeats.length > 0 && (
                  <p className="text-[10px] text-muted-foreground mt-2">{route.requestedSeats.length} seat request{route.requestedSeats.length !== 1 ? "s" : ""} pending</p>
                )}
              </div>
            );
          })}
        </div>
      </WorkspacePanel>

      {/* Request Seat Modal */}
      {requestOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 backdrop-blur-sm" onClick={() => setRequestOpen(null)}>
          <div className="workspace-panel w-full max-w-sm p-6 space-y-4 m-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">Request Seat</h2>
              <button onClick={() => setRequestOpen(null)} className="p-1 text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
            </div>
            <div className="rounded-lg bg-muted/50 p-3">
              <p className="text-sm font-medium text-foreground">{requestOpen.route}</p>
              <p className="text-xs text-muted-foreground">{requestOpen.busNo} · Departure: {requestOpen.departureTime}</p>
              <p className="text-xs text-muted-foreground">{requestOpen.capacity - requestOpen.passengers} seats available</p>
            </div>
            <div className="space-y-1.5">
              <label className="section-label">Your Boarding Stop</label>
              <select value={selectedStop} onChange={e => setSelectedStop(e.target.value)} className="w-full input-warm px-3 py-2.5 text-sm">
                {STOP_OPTIONS.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setRequestOpen(null)} className="btn-secondary flex-1 py-2.5 text-sm rounded-lg">Cancel</button>
              <button onClick={handleRequest} disabled={requestSeat.isPending} className="btn-primary flex-1 py-2.5 text-sm rounded-lg">
                {requestSeat.isPending ? "Requesting…" : "Confirm Request"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Route Detail Modal */}
      {detailRoute && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 backdrop-blur-sm" onClick={() => setDetailRoute(null)}>
          <div className="workspace-panel w-full max-w-sm p-6 space-y-4 m-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold text-foreground">{detailRoute.route}</h2>
                <p className="text-xs text-muted-foreground">{detailRoute.busNo}</p>
              </div>
              <button onClick={() => setDetailRoute(null)} className="p-1 text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Driver</span><span>{detailRoute.driverName}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Phone</span><a href={`tel:${detailRoute.driverPhone.replace(/[^0-9]/g, "")}`} className="text-primary">{detailRoute.driverPhone}</a></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Departure</span><span>{detailRoute.departureTime}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Arrival</span><span>{detailRoute.arrivalTime}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Stops</span><span>{detailRoute.stops} stops</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Occupancy</span><span>{detailRoute.passengers}/{detailRoute.capacity}</span></div>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">Route stops (approximate)</p>
              <div className="flex flex-wrap gap-1">
                {STOP_OPTIONS.slice(0, detailRoute.stops).map(s => (
                  <span key={s} className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">{s}</span>
                ))}
              </div>
            </div>
            <button onClick={() => setDetailRoute(null)} className="w-full btn-secondary py-2.5 text-sm rounded-lg">Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
