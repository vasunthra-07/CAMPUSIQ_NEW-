import { useState } from "react";
import { useCampusEvents } from "@/hooks/useCampusData";
import { AnimatedNumber } from "@/components/motion/AnimatedNumber";
import { PageHeader, MetricTile, WorkspacePanel, StatusBadge } from "@/components/workspace";
import { Calendar, Users, MapPin, Zap, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

export default function EventManagement() {
  const { data: events, isLoading } = useCampusEvents();
  const [filter, setFilter] = useState("All");

  if (isLoading || !events) {
    return <div className="flex h-64 items-center justify-center text-muted-foreground">Loading events…</div>;
  }

  const statuses = ["All", "Open", "Full"];
  const filtered = filter === "All" ? events : events.filter(e => e.status === filter);
  const totalReg = events.reduce((a, e) => a + e.registrations, 0);
  const totalCap = events.reduce((a, e) => a + e.capacity, 0);

  return (
    <div className="space-y-6 pb-10">
      <PageHeader
        eyebrow="Event Operations"
        title="Event Operations Center"
        description={`${events.length} scheduled events · registration and venue management`}
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <MetricTile label="Total Events" value={<AnimatedNumber value={events.length} />} icon={Calendar} variant="primary" delay={0} />
        <MetricTile label="Registrations" value={<AnimatedNumber value={totalReg} />} icon={Users} variant="default" delay={0.05} />
        <MetricTile label="Capacity Filled" value={<AnimatedNumber value={Math.round((totalReg / totalCap) * 100)} suffix="%" />} icon={Zap} variant="warning" delay={0.1} />
        <MetricTile label="Full Events" value={<AnimatedNumber value={events.filter(e => e.status === "Full").length} />} icon={Clock} variant="danger" delay={0.15} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <WorkspacePanel
            title="Event Timeline"
            description="Upcoming campus events"
            icon={Calendar}
            actions={
              <div className="flex gap-1">
                {statuses.map(s => (
                  <button
                    key={s}
                    onClick={() => setFilter(s)}
                    className={cn(
                      "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                      filter === s ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>
            }
            delay={0.2}
          >
            <div className="space-y-3">
              {filtered.map(event => {
                const fillPct = Math.round((event.registrations / event.capacity) * 100);
                const isFull = event.status === "Full";
                return (
                  <div key={event.id} className="rounded-lg border border-border p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-foreground">{event.title}</p>
                        <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{event.date}</span>
                          <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{event.venue}</span>
                        </div>
                      </div>
                      <StatusBadge variant={isFull ? "danger" : "success"}>{event.status}</StatusBadge>
                    </div>
                    <div className="mt-3">
                      <div className="flex justify-between text-xs text-muted-foreground mb-1">
                        <span>{event.registrations} / {event.capacity} registered</span>
                        <span className="font-medium tabular-nums">{fillPct}%</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: `${fillPct}%`, background: isFull ? "#EF4444" : "#2563EB" }} />
                      </div>
                    </div>
                    {!isFull && (
                      <button className="btn-primary mt-3 w-full py-2 text-xs rounded-lg">Register</button>
                    )}
                  </div>
                );
              })}
            </div>
          </WorkspacePanel>
        </div>

        <WorkspacePanel title="Venue Usage" description="Capacity by venue" icon={MapPin} delay={0.25}>
          <ul className="space-y-3">
            {[...new Set(events.map(e => e.venue))].map(venue => {
              const venueEvents = events.filter(e => e.venue === venue);
              const reg = venueEvents.reduce((a, e) => a + e.registrations, 0);
              const cap = venueEvents.reduce((a, e) => a + e.capacity, 0);
              return (
                <li key={venue} className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5">
                  <span className="text-sm text-foreground">{venue}</span>
                  <span className="text-xs font-medium text-muted-foreground tabular-nums">{reg}/{cap}</span>
                </li>
              );
            })}
          </ul>
        </WorkspacePanel>
      </div>
    </div>
  );
}
