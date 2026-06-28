import { useCampusResources } from "@/hooks/useCampusData";
import { AnimatedNumber } from "@/components/motion/AnimatedNumber";
import { PageHeader, MetricTile, WorkspacePanel, StatusBadge } from "@/components/workspace";
import { Building2, AlertTriangle, CheckCircle, Gauge, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from "recharts";

export default function CampusResources() {
  const { data: resources, isLoading } = useCampusResources();

  if (isLoading || !resources) {
    return <div className="flex h-64 items-center justify-center text-muted-foreground">Loading resource data…</div>;
  }

  const overCount = resources.filter(r => r.status === "over").length;
  const optimalCount = resources.filter(r => r.status === "optimal").length;
  const underCount = resources.filter(r => r.status === "under").length;
  const avgUtil = Math.round(resources.reduce((a, r) => a + r.utilizationPct, 0) / resources.length);

  const chartData = resources.map(r => ({
    name: r.label.split("—")[0].trim().slice(0, 12),
    utilization: r.utilizationPct,
    status: r.status,
  }));

  const statusConfig = {
    over: { bar: "#EF4444", label: "Over-utilized", variant: "danger" as const },
    optimal: { bar: "#2563EB", label: "Optimal", variant: "success" as const },
    under: { bar: "#64748B", label: "Under-utilized", variant: "neutral" as const },
  };

  return (
    <div className="space-y-6 pb-10">
      <PageHeader
        eyebrow="Resource Operations"
        title="Resource Operations Center"
        description="Real-time availability, reservations, and utilization across campus facilities"
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <MetricTile label="Avg Utilization" value={<AnimatedNumber value={avgUtil} suffix="%" />} icon={TrendingUp} variant="primary" delay={0} />
        <MetricTile label="Over-utilized" value={<AnimatedNumber value={overCount} />} icon={AlertTriangle} variant="danger" delay={0.05} />
        <MetricTile label="Optimal" value={<AnimatedNumber value={optimalCount} />} icon={CheckCircle} variant="success" delay={0.1} />
        <MetricTile label="Under-utilized" value={<AnimatedNumber value={underCount} />} icon={Gauge} variant="default" delay={0.15} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <WorkspacePanel title="Availability Grid" description="Live resource status" icon={Building2} delay={0.2}>
          <div className="space-y-3">
            {resources.map(r => {
              const cfg = statusConfig[r.status];
              return (
                <div key={r.label} className="rounded-lg border border-border p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-sm font-medium text-foreground">{r.label}</p>
                      <StatusBadge variant={cfg.variant === "danger" ? "danger" : cfg.variant === "success" ? "success" : "neutral"}>
                        {cfg.label}
                      </StatusBadge>
                    </div>
                    <span className="text-xl font-semibold tabular-nums text-foreground">
                      <AnimatedNumber value={r.utilizationPct} suffix="%" />
                    </span>
                  </div>
                  <div className="mt-3 h-2 w-full rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${r.utilizationPct}%`, background: cfg.bar }} />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">{r.recommendation}</p>
                </div>
              );
            })}
          </div>
        </WorkspacePanel>

        <div className="space-y-4">
          <WorkspacePanel title="Occupancy Analytics" description="Utilization by resource" icon={TrendingUp} delay={0.25}>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="vertical" margin={{ left: 8, right: 16 }}>
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: "#64748B" }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "#64748B" }} width={90} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 8, fontSize: 12 }} />
                  <Bar dataKey="utilization" radius={[0, 4, 4, 0]}>
                    {chartData.map((entry, i) => (
                      <Cell key={i} fill={statusConfig[entry.status as keyof typeof statusConfig].bar} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </WorkspacePanel>

          <WorkspacePanel title="Resource Health" description="Optimization insights" icon={CheckCircle} delay={0.3}>
            <ul className="space-y-2 text-sm text-foreground">
              {resources.filter(r => r.status === "over").map(r => (
                <li key={r.label} className="flex gap-2 rounded-lg border border-red-200 bg-red-50/50 px-3 py-2">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-red-500 mt-0.5" />
                  <span>{r.label}: {r.recommendation}</span>
                </li>
              ))}
              {overCount === 0 && (
                <li className="text-muted-foreground">All resources within optimal operating parameters.</li>
              )}
            </ul>
          </WorkspacePanel>
        </div>
      </div>
    </div>
  );
}
