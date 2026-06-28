import { useStudents } from "@/hooks/useStudents";
import { AnimatedNumber } from "@/components/motion/AnimatedNumber";
import { PageHeader, MetricTile, WorkspacePanel, StatusBadge } from "@/components/workspace";
import { AlertTriangle, BarChart3, Users, Edit3, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export default function FacultyWorkspace() {
  const { data: students } = useStudents();

  const myStudents = students?.slice(0, 20) ?? [];
  const atRisk = myStudents.filter(s => s.status === "Critical" || s.status === "At-Risk");
  const avgAttend = myStudents.length ? Math.round(myStudents.reduce((a, s) => a + s.attendance, 0) / myStudents.length) : 0;
  const avgPulse = myStudents.length ? Math.round(myStudents.reduce((a, s) => a + s.pulseScore, 0) / myStudents.length) : 0;

  const statusVariant = (status: string) =>
    status === "Critical" ? "danger" : status === "At-Risk" ? "warning" : status === "Safe" ? "success" : "info";

  return (
    <div className="space-y-6 pb-10">
      <PageHeader
        eyebrow="Faculty Operations"
        title="Faculty Workspace"
        description="Class performance, mark entry, and at-risk student monitoring"
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <MetricTile label="My Students" value={<AnimatedNumber value={myStudents.length} />} icon={Users} variant="primary" delay={0} />
        <MetricTile label="At-Risk Cases" value={<AnimatedNumber value={atRisk.length} />} icon={AlertTriangle} variant={atRisk.length > 3 ? "warning" : "default"} delay={0.05} />
        <MetricTile label="Avg Attendance" value={<AnimatedNumber value={avgAttend} suffix="%" />} icon={BarChart3} variant="default" delay={0.1} />
        <MetricTile label="Avg Pulse" value={<AnimatedNumber value={avgPulse} />} icon={CheckCircle} variant="success" delay={0.15} />
      </div>

      <WorkspacePanel title="Class Register" description="Quick performance view" icon={Edit3} delay={0.2}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-xs text-muted-foreground">
                <th className="text-left py-2 pr-4 font-medium">Student</th>
                <th className="text-center py-2 px-3 font-medium">Attendance</th>
                <th className="text-center py-2 px-3 font-medium">IAT</th>
                <th className="text-center py-2 px-3 font-medium">Model</th>
                <th className="text-center py-2 px-3 font-medium">Pulse</th>
                <th className="text-center py-2 px-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {myStudents.map(s => (
                <tr key={s.id} className="hover:bg-muted/30 transition-colors">
                  <td className="py-2.5 pr-4">
                    <p className="font-medium">{s.name}</p>
                    <p className="text-xs text-muted-foreground">{s.id}</p>
                  </td>
                  <td className={cn("text-center py-2.5 px-3 tabular-nums font-medium", s.attendance < 75 ? "text-red-600" : "")}>{s.attendance}%</td>
                  <td className="text-center py-2.5 px-3 tabular-nums">{s.iat1 + s.iat2}</td>
                  <td className="text-center py-2.5 px-3 tabular-nums">{s.model}</td>
                  <td className="text-center py-2.5 px-3 tabular-nums font-medium text-primary">{s.pulseScore}</td>
                  <td className="text-center py-2.5 px-3">
                    <StatusBadge variant={statusVariant(s.status) as "danger" | "warning" | "success" | "info"}>{s.status}</StatusBadge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </WorkspacePanel>

      {atRisk.length > 0 && (
        <WorkspacePanel title="Action Required" description="At-risk students needing intervention" icon={AlertTriangle} delay={0.25}>
          <div className="space-y-2">
            {atRisk.slice(0, 5).map(s => (
              <div key={s.id} className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50/50 p-3">
                <div>
                  <p className="text-sm font-medium">{s.name}</p>
                  <p className="text-xs text-muted-foreground">{s.reasoningNote}</p>
                </div>
                <button className="btn-secondary text-xs px-3 py-1.5 rounded-lg">Intervene</button>
              </div>
            ))}
          </div>
        </WorkspacePanel>
      )}
    </div>
  );
}
