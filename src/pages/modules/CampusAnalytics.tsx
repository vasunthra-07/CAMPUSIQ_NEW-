import { useCampusPulse, useStudents, useDepartmentStats, useWeeklyRiskTrend } from "@/hooks/useStudents";
import { PageHeader, MetricTile, WorkspacePanel } from "@/components/workspace";
import { StatCard } from "@/components/motion/AnimatedCard";
import { AnimatedNumber } from "@/components/motion/AnimatedNumber";
import { getPulseColor, getPulseLabel, PULSE_SCORE_WEIGHTS, RISK_THRESHOLDS } from "@/lib/scoring";
import { fadeUpStyle } from "@/lib/motion";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Users, TrendingUp, AlertTriangle, CheckCircle, Brain, Activity, ShieldAlert, Target } from "lucide-react";
import { cn } from "@/lib/utils";

function PulseRing({ score }: { score: number }) {
  const radius = 45;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (circ * score) / 100;
  const color = getPulseColor(score);
  return (
    <div className="relative h-40 w-40 mx-auto">
      <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
        <circle stroke="hsl(214 32% 91%)" strokeWidth="8" fill="transparent" r={radius} cx="50" cy="50" />
        <circle stroke={color} strokeWidth="8" strokeLinecap="round" fill="transparent"
          r={radius} cx="50" cy="50" strokeDasharray={circ}
          strokeDashoffset={offset} style={{ transition: "stroke-dashoffset 1s ease", filter: `drop-shadow(0 0 8px ${color})` }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-bold font-mono gradient-text-gold"><AnimatedNumber value={score} /></span>
        <span className="text-[10px] section-label mt-1">{getPulseLabel(score)}</span>
      </div>
    </div>
  );
}

export default function CampusAnalytics() {
  const { data: pulse, isLoading: pLoading } = useCampusPulse();
  const { data: students } = useStudents();
  const { data: deptStats } = useDepartmentStats();
  const { data: trend } = useWeeklyRiskTrend();

  if (pLoading || !pulse) {
    return <div className="flex h-64 items-center justify-center text-muted-foreground animate-pulse">Loading campus analytics…</div>;
  }

  const trendData = trend?.map(t => ({ week: `W${t.week}`, critical: t.critical, atRisk: t.atRisk, safe: t.safe })) ?? [];

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-10">
      <PageHeader
        eyebrow="Analytics Operations"
        title="Campus Analytics Center"
        description={`Live institutional overview · ${students?.length ?? 0} students monitored`}
      />

      {/* Campus Pulse Score + Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6" style={fadeUpStyle(1)}>
        {/* Pulse Ring */}
        <div className="card-warm p-6 flex flex-col items-center gap-4">
          <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Campus Pulse Score</h3>
          <PulseRing score={pulse.avgPulseScore} />
          {/* Math methodology disclosure */}
          <div className="w-full rounded-xl bg-background/50 border border-border/50 p-3 space-y-1.5">
            <p className="section-label mb-2">Methodology</p>
            {Object.entries(PULSE_SCORE_WEIGHTS).map(([k, w]) => (
              <div key={k} className="flex items-center justify-between text-[11px]">
                <span className="text-muted-foreground capitalize">{k.replace(/([A-Z])/g, ' $1')}</span>
                <div className="flex items-center gap-2">
                  <div className="h-1 rounded-full bg-accent/30" style={{ width: `${w * 80}px` }}>
                    <div className="h-full rounded-full bg-accent" style={{ width: `${w * 100}%` }} />
                  </div>
                  <span className="font-mono text-accent font-bold">{Math.round(w * 100)}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="md:col-span-2 grid grid-cols-2 gap-4">
          <StatCard index={0} title="Total Students" value={pulse.total} icon={Users} subtitle="Across all departments" />
          <StatCard index={1} title="At-Risk Students" value={pulse.criticalCount + pulse.atRiskCount}
            icon={AlertTriangle} subtitle={`${pulse.interventionRate}% intervention rate`}
            className={pulse.criticalCount > 5 ? "border-red-500/30" : ""} />
          <StatCard index={2} title="Safe Students" value={pulse.safeCount} icon={CheckCircle} subtitle="Pulse score ≥ 75" />
          <StatCard index={3} title="Intervention Rate" value={`${pulse.interventionRate}%`} icon={Target}
            subtitle="Active cases this semester" trend={pulse.interventionRate > 30 ? "down" : "stable"} trendValue={`${pulse.interventionRate}%`} />
        </div>
      </div>

      {/* Weekly Risk Trend */}
      <div className="card-warm p-6" style={fadeUpStyle(2)}>
        <h3 className="text-sm font-bold font-syne mb-4 flex items-center gap-2">
          <Activity className="h-4 w-4 text-accent" /> Weekly Risk Trend (8 Weeks)
        </h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trendData}>
              <defs>
                <linearGradient id="gCritical" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(0 84% 60%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(0 84% 60%)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gSafe" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(145 60% 42%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(145 60% 42%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 20%)" vertical={false} />
              <XAxis dataKey="week" tick={{ fill: "hsl(0 0% 60%)", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "hsl(0 0% 60%)", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: "hsl(0 0% 12%)", border: "1px solid hsl(0 0% 20%)", borderRadius: 8 }} />
              <Area type="monotone" dataKey="safe" stroke="hsl(145 60% 42%)" fill="url(#gSafe)" strokeWidth={2} />
              <Area type="monotone" dataKey="atRisk" stroke="hsl(210 100% 60%)" fill="none" strokeWidth={2} strokeDasharray="4 2" />
              <Area type="monotone" dataKey="critical" stroke="hsl(0 84% 60%)" fill="url(#gCritical)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Department Breakdown */}
      <div className="card-warm p-6" style={fadeUpStyle(3)}>
        <h3 className="text-sm font-bold font-syne mb-4 flex items-center gap-2">
          <Brain className="h-4 w-4 text-accent" /> Department Performance
        </h3>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={deptStats ?? []}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 20%)" vertical={false} />
              <XAxis dataKey="dept" tick={{ fill: "hsl(0 0% 60%)", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fill: "hsl(0 0% 60%)", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: "hsl(0 0% 12%)", border: "1px solid hsl(0 0% 20%)", borderRadius: 8 }} />
              <Bar dataKey="avgPulse" name="Avg Pulse Score" fill="hsl(210 100% 60%)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="avgAttendance" name="Avg Attendance" fill="hsl(145 60% 42%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Risk Students */}
      <div className="card-warm p-6" style={fadeUpStyle(4)}>
        <h3 className="text-sm font-bold font-syne mb-4 flex items-center gap-2">
          <ShieldAlert className="h-4 w-4 text-red-400" /> Top Risk Students
        </h3>
        <div className="space-y-2">
          {pulse.topRiskStudents.map((s, i) => (
            <div key={s.id} className={cn("flex items-center justify-between p-3 rounded-xl border", i === 0 ? "border-red-500/30 bg-red-500/5" : "border-border/50 bg-surface/50")} style={fadeUpStyle(i, 200)}>
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-surface flex items-center justify-center text-xs font-bold font-mono text-muted-foreground">{i + 1}</div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{s.name}</p>
                  <p className="text-[10px] text-muted-foreground font-mono">{s.id} · {s.department}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-xs font-mono" style={{ color: getPulseColor(s.pulseScore) }}>{s.pulseScore}</p>
                  <p className="text-[10px] text-muted-foreground">Pulse</p>
                </div>
                <span className={cn("text-[10px] font-bold px-2 py-1 rounded-full border", s.status === "Critical" ? "border-red-500/30 text-red-400 bg-red-500/10" : "border-orange-500/30 text-orange-400 bg-orange-500/10")}>
                  {s.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
