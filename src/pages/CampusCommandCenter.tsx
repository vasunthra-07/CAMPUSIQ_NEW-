import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useStudents } from "@/hooks/useStudents";
import {
  useCampusResources,
  useCampusEvents,
  useCampusComplaints,
  useMaintenanceTasks,
} from "@/hooks/useCampusData";
import { getPulseColor, getPulseLabel } from "@/lib/scoring";
import { AnimatedNumber } from "@/components/motion/AnimatedNumber";
import {
  PageHeader,
  MetricTile,
  WorkspacePanel,
  ActivityFeed,
  StatusBadge,
  QuickActionBar,
  type ActivityItem,
  type QuickAction,
} from "@/components/workspace";
import {
  Activity,
  AlertTriangle,
  Brain,
  Building2,
  Calendar,
  CheckCircle2,
  ClipboardList,
  Headset,
  Sparkles,
  TrendingUp,
  Zap,
  Radio,
  Clock,
} from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";

const PULSE_TREND = [
  { day: "Mon", score: 72 },
  { day: "Tue", score: 74 },
  { day: "Wed", score: 71 },
  { day: "Thu", score: 76 },
  { day: "Fri", score: 78 },
  { day: "Sat", score: 77 },
  { day: "Sun", score: 79 },
];

export default function CampusCommandCenter() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: students } = useStudents();
  const { data: resources } = useCampusResources();
  const { data: events } = useCampusEvents();
  const { data: complaints } = useCampusComplaints();
  const { data: maintenance } = useMaintenanceTasks();

  const avgPulse = useMemo(() => {
    if (!students?.length) return 0;
    return Math.round(students.reduce((a, s) => a + s.pulseScore, 0) / students.length);
  }, [students]);

  const campusHealth = useMemo(() => {
    const resourceScore = resources
      ? Math.round(resources.reduce((a, r) => a + (r.status === "optimal" ? 100 : r.status === "under" ? 70 : 50), 0) / resources.length)
      : 75;
    const complaintScore = complaints
      ? Math.max(0, 100 - complaints.filter(c => c.status === "Open").length * 8)
      : 80;
    return Math.round((avgPulse + resourceScore + complaintScore) / 3);
  }, [avgPulse, resources, complaints]);

  const avgUtilization = useMemo(() => {
    if (!resources?.length) return 0;
    return Math.round(resources.reduce((a, r) => a + r.utilizationPct, 0) / resources.length);
  }, [resources]);

  const openComplaints = complaints?.filter(c => c.status === "Open" || c.status === "In Progress").length ?? 0;
  const activeEvents = events?.filter(e => e.status === "Open" || e.status === "Full").length ?? 0;
  const pendingMaintenance = maintenance?.filter(m => m.status === "Open" || m.status === "In Progress").length ?? 0;
  const criticalStudents = students?.filter(s => s.status === "Critical").length ?? 0;

  const activityItems: ActivityItem[] = useMemo(() => {
    const items: ActivityItem[] = [];
    complaints?.slice(0, 2).forEach(c => {
      items.push({
        id: c.id,
        title: c.subject,
        description: `${c.category} · ${c.priority} priority`,
        time: c.createdAt,
        variant: c.priority === "Critical" ? "danger" : c.priority === "High" ? "warning" : "default",
      });
    });
    events?.slice(0, 2).forEach(e => {
      items.push({
        id: e.id,
        title: e.title,
        description: `${e.registrations}/${e.capacity} registered · ${e.venue}`,
        time: e.date,
        variant: "primary",
      });
    });
    maintenance?.slice(0, 2).forEach(m => {
      items.push({
        id: m.id,
        title: m.title,
        description: `${m.category} · ${m.assignee}`,
        time: m.dueDate,
        variant: m.priority === "Critical" ? "danger" : "warning",
      });
    });
    return items.slice(0, 6);
  }, [complaints, events, maintenance]);

  const aiRecommendations = useMemo(() => {
    const recs: string[] = [];
    if (criticalStudents > 0) recs.push(`Review ${criticalStudents} critical student cases — schedule mentor interventions today.`);
    if (avgUtilization > 85) recs.push("Computer Labs at 92% utilization — consider extending evening lab hours.");
    if (openComplaints > 2) recs.push(`${openComplaints} open service requests — prioritize HVAC and safety tickets.`);
    if (recs.length === 0) recs.push("Campus operations are stable. Review weekly analytics for optimization opportunities.");
    return recs;
  }, [criticalStudents, avgUtilization, openComplaints]);

  const todayActions = useMemo(() => {
    const actions: { id: string; label: string; done: boolean }[] = [];
    if (user?.role !== "Student") {
      actions.push({ id: "1", label: "Review critical student escalations", done: false });
      actions.push({ id: "2", label: "Approve pending event registrations", done: false });
    }
    actions.push({ id: "3", label: "Check operational alerts", done: true });
    actions.push({ id: "4", label: "Respond to high-priority tickets", done: false });
    return actions;
  }, [user?.role]);

  const quickActions: QuickAction[] = [
    { id: "copilot", label: "Ask Campus Copilot", icon: Brain, onClick: () => navigate("/app/assistant") },
    { id: "service", label: "Service Center", icon: Headset, onClick: () => navigate("/app/service-center") },
    { id: "events", label: "Event Operations", icon: Calendar, onClick: () => navigate("/app/events") },
    { id: "resources", label: "Resource Ops", icon: Building2, onClick: () => navigate("/app/resources") },
  ];

  const alerts = useMemo(() => {
    const list: { id: string; message: string; severity: "danger" | "warning" | "info" }[] = [];
    if (criticalStudents > 0) list.push({ id: "a1", message: `${criticalStudents} students in critical status`, severity: "danger" });
    complaints?.filter(c => c.priority === "Critical" && c.status === "Open").forEach(c => {
      list.push({ id: c.id, message: c.subject, severity: "danger" });
    });
    maintenance?.filter(m => m.priority === "Critical" && m.status === "Open").forEach(m => {
      list.push({ id: m.id, message: m.title, severity: "warning" });
    });
    if (list.length === 0) list.push({ id: "ok", message: "No critical operational alerts", severity: "info" });
    return list.slice(0, 4);
  }, [criticalStudents, complaints, maintenance]);

  return (
    <div className="space-y-6 pb-10">
      <PageHeader
        eyebrow="Operations Command"
        title="Campus Command Center"
        description={`Real-time campus intelligence for ${user?.name} · ${user?.role}`}
        actions={
          <div className="flex items-center gap-2">
            <StatusBadge variant="success">Live</StatusBadge>
            <span className="text-xs text-muted-foreground tabular-nums">Updated just now</span>
          </div>
        }
      />

      {/* Operational status strip */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3 shadow-sm">
        <div className="flex items-center gap-2">
          <Radio className="h-4 w-4 text-emerald-600" />
          <span className="text-xs font-semibold text-foreground">Operational Status</span>
          <StatusBadge variant="success">All Systems Normal</StatusBadge>
        </div>
        <div className="hidden sm:block h-4 w-px bg-border" />
        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
          <span><span className="font-medium text-foreground tabular-nums">{students?.length ?? 0}</span> students monitored</span>
          <span><span className="font-medium text-foreground tabular-nums">{activeEvents}</span> events active</span>
          <span><span className="font-medium text-foreground tabular-nums">{openComplaints}</span> service alerts</span>
          <span><span className="font-medium text-foreground tabular-nums">{avgUtilization}%</span> resource usage</span>
        </div>
      </div>

      {/* Primary metrics */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <MetricTile
          label="Campus Health Score"
          value={<AnimatedNumber value={campusHealth} suffix="/100" />}
          icon={Activity}
          variant={campusHealth >= 75 ? "success" : campusHealth >= 60 ? "warning" : "danger"}
          subtitle={campusHealth >= 75 ? "Operational excellence" : "Needs attention"}
          delay={0}
        />
        <MetricTile
          label="Resource Utilization"
          value={<AnimatedNumber value={avgUtilization} suffix="%" />}
          icon={Building2}
          variant={avgUtilization > 85 ? "warning" : "primary"}
          subtitle={`${resources?.length ?? 0} resources monitored`}
          delay={0.05}
        />
        <MetricTile
          label="Active Events"
          value={<AnimatedNumber value={activeEvents} />}
          icon={Calendar}
          variant="primary"
          subtitle={`${events?.reduce((a, e) => a + e.registrations, 0) ?? 0} total registrations`}
          delay={0.1}
        />
        <MetricTile
          label="Pending Requests"
          value={<AnimatedNumber value={pendingMaintenance + openComplaints} />}
          icon={ClipboardList}
          variant={openComplaints > 3 ? "warning" : "default"}
          subtitle="Maintenance + service desk"
          delay={0.15}
        />
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <MetricTile
          label="Open Complaints"
          value={<AnimatedNumber value={openComplaints} />}
          icon={Headset}
          variant={openComplaints > 2 ? "danger" : "default"}
          delay={0.1}
        />
        <MetricTile
          label="Campus Pulse"
          value={<AnimatedNumber value={avgPulse} />}
          icon={TrendingUp}
          variant={avgPulse >= 75 ? "success" : avgPulse >= 60 ? "warning" : "danger"}
          subtitle={getPulseLabel(avgPulse)}
          delay={0.15}
        />
        <MetricTile
          label="Students Monitored"
          value={<AnimatedNumber value={students?.length ?? 0} />}
          icon={CheckCircle2}
          variant="primary"
          subtitle={`${criticalStudents} critical`}
          delay={0.2}
        />
        <MetricTile
          label="Operational Alerts"
          value={<AnimatedNumber value={alerts.filter(a => a.severity !== "info").length} />}
          icon={AlertTriangle}
          variant={alerts.some(a => a.severity === "danger") ? "danger" : "warning"}
          delay={0.25}
        />
      </div>

      {/* Events timeline + Resource usage */}
      <div className="grid gap-4 lg:grid-cols-2">
        <WorkspacePanel title="Events Timeline" description="Upcoming campus operations" icon={Calendar} delay={0.18}>
          <div className="space-y-0">
            {events?.slice(0, 5).map((event, i) => (
              <div key={event.id} className={`flex gap-4 py-3 ${i !== (events.length - 1) ? "border-b border-border/60" : ""}`}>
                <div className="flex flex-col items-center pt-0.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary text-[10px] font-bold">
                    {event.date.slice(8, 10)}
                  </span>
                  {i < (events?.length ?? 0) - 1 && <span className="mt-1 w-px flex-1 bg-border min-h-[16px]" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground">{event.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{event.venue} · {event.registrations}/{event.capacity} registered</p>
                  <StatusBadge variant={event.status === "Full" ? "danger" : "success"} className="mt-1.5">{event.status}</StatusBadge>
                </div>
              </div>
            ))}
          </div>
        </WorkspacePanel>

        <WorkspacePanel title="Resource Usage" description="Facility utilization overview" icon={Building2} delay={0.2}>
          <div className="space-y-3">
            {resources?.slice(0, 5).map(r => (
              <div key={r.label}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-foreground font-medium truncate pr-2">{r.label.split("—")[0].trim()}</span>
                  <span className="text-muted-foreground tabular-nums shrink-0">{r.utilizationPct}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${r.utilizationPct}%`,
                      background: r.status === "over" ? "#EF4444" : r.status === "optimal" ? "#2563EB" : "#64748B",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </WorkspacePanel>
      </div>

      {/* Main workspace grid */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <WorkspacePanel
            title="Campus Pulse Trend"
            description="7-day composite operational score"
            icon={TrendingUp}
            delay={0.2}
          >
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={PULSE_TREND}>
                  <defs>
                    <linearGradient id="pulseGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(221 83% 53%)" stopOpacity={0.2} />
                      <stop offset="100%" stopColor="hsl(221 83% 53%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="day" tick={{ fontSize: 11, fill: "hsl(215 16% 47%)" }} axisLine={false} tickLine={false} />
                  <YAxis domain={[60, 85]} tick={{ fontSize: 11, fill: "hsl(215 16% 47%)" }} axisLine={false} tickLine={false} width={28} />
                  <Tooltip
                    contentStyle={{
                      background: "hsl(0 0% 100%)",
                      border: "1px solid hsl(214 32% 91%)",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  />
                  <Area type="monotone" dataKey="score" stroke="hsl(221 83% 53%)" fill="url(#pulseGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <span className="text-2xl font-semibold tabular-nums" style={{ color: getPulseColor(avgPulse) }}>
                {avgPulse}
              </span>
              <span className="text-sm text-muted-foreground">{getPulseLabel(avgPulse)} · institutional average</span>
            </div>
          </WorkspacePanel>

          <WorkspacePanel
            title="Live Activity Feed"
            description="Cross-module operational events"
            icon={Zap}
            delay={0.25}
          >
            <ActivityFeed items={activityItems} />
          </WorkspacePanel>
        </div>

        <div className="space-y-4">
          <WorkspacePanel
            title="Service Alerts"
            description="Open service desk items"
            icon={Headset}
            delay={0.22}
          >
            <ul className="space-y-2">
              {(complaints?.filter(c => c.status !== "Resolved").slice(0, 4) ?? []).map(c => (
                <li key={c.id} className="flex items-start justify-between gap-2 rounded-lg border border-border px-3 py-2.5">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{c.subject}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Clock className="h-3 w-3" />{c.createdAt}
                    </p>
                  </div>
                  <StatusBadge variant={c.priority === "Critical" ? "danger" : c.priority === "High" ? "warning" : "info"}>
                    {c.priority}
                  </StatusBadge>
                </li>
              ))}
            </ul>
          </WorkspacePanel>

          <WorkspacePanel
            title="Operational Alerts"
            description="Requires immediate attention"
            icon={AlertTriangle}
            delay={0.2}
          >
            <ul className="space-y-2">
              {alerts.map(alert => (
                <li
                  key={alert.id}
                  className="flex items-start gap-2 rounded-lg border border-border px-3 py-2.5 text-sm"
                >
                  <AlertTriangle
                    className={`h-4 w-4 shrink-0 mt-0.5 ${
                      alert.severity === "danger"
                        ? "text-red-500"
                        : alert.severity === "warning"
                          ? "text-amber-500"
                          : "text-blue-500"
                    }`}
                  />
                  <span className="text-foreground leading-snug">{alert.message}</span>
                </li>
              ))}
            </ul>
          </WorkspacePanel>

          <WorkspacePanel
            title="AI Recommendations"
            description="Campus Copilot insights"
            icon={Sparkles}
            delay={0.3}
          >
            <ul className="space-y-3">
              {aiRecommendations.map((rec, i) => (
                <li key={i} className="flex gap-2 text-sm text-foreground leading-relaxed">
                  <Brain className="h-4 w-4 shrink-0 text-primary mt-0.5" />
                  {rec}
                </li>
              ))}
            </ul>
          </WorkspacePanel>

          <WorkspacePanel
            title="Pending Actions"
            description="Requires your attention today"
            icon={ClipboardList}
            delay={0.32}
          >
            <ul className="space-y-2">
              {todayActions.map(action => (
                <li key={action.id} className="flex items-center gap-3 text-sm">
                  <span
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                      action.done
                        ? "border-emerald-500 bg-emerald-50 text-emerald-600"
                        : "border-border bg-muted"
                    }`}
                  >
                    {action.done && <CheckCircle2 className="h-3 w-3" />}
                  </span>
                  <span className={action.done ? "text-muted-foreground line-through" : "text-foreground"}>
                    {action.label}
                  </span>
                </li>
              ))}
            </ul>
          </WorkspacePanel>
        </div>
      </div>

      <WorkspacePanel title="Quick Actions" icon={Zap} delay={0.4} noPadding>
        <div className="p-4 sm:p-5">
          <QuickActionBar actions={quickActions} />
        </div>
      </WorkspacePanel>
    </div>
  );
}
