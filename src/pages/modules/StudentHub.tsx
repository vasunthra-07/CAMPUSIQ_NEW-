import { useState } from "react";
import { useStudents } from "@/hooks/useStudents";
import { getPulseColor, getPulseLabel } from "@/lib/scoring";
import { AnimatedNumber } from "@/components/motion/AnimatedNumber";
import { PageHeader, MetricTile, WorkspacePanel, StatusBadge, QuickActionBar } from "@/components/workspace";
import { Search, AlertTriangle, CheckCircle, BookOpen, Target, Brain, Calendar, Bell, ClipboardList, GraduationCap } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

const SCHEDULE = [
  { time: "09:00", subject: "Data Structures", room: "Lab 204" },
  { time: "11:00", subject: "Operating Systems", room: "Hall A" },
  { time: "14:00", subject: "Machine Learning", room: "Lab 301" },
];

const TASKS = [
  { id: "1", label: "Submit ML assignment", due: "Today", done: false },
  { id: "2", label: "Register for Hackathon 2.0", due: "Jul 5", done: false },
  { id: "3", label: "Complete LMS module 4", due: "Jul 8", done: true },
];

export default function StudentHub() {
  const { data: students, isLoading } = useStudents();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  if (isLoading || !students) {
    return <div className="flex h-64 items-center justify-center text-muted-foreground">Loading…</div>;
  }

  const student = students[0];
  const criticalCount = students.filter(s => s.status === "Critical").length;

  return (
    <div className="space-y-6 pb-10">
      <PageHeader
        eyebrow="Student Workspace"
        title="Student Experience Hub"
        description="Your academic command center — schedule, progress, tasks, and campus resources"
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <MetricTile label="Campus Pulse" value={<AnimatedNumber value={student?.pulseScore ?? 0} />} icon={Target} variant="primary" subtitle={student ? getPulseLabel(student.pulseScore) : ""} delay={0} />
        <MetricTile label="Attendance" value={<AnimatedNumber value={student?.attendance ?? 0} suffix="%" />} icon={GraduationCap} variant={(student?.attendance ?? 0) < 75 ? "warning" : "success"} delay={0.05} />
        <MetricTile label="Active Tasks" value={TASKS.filter(t => !t.done).length} icon={ClipboardList} variant="default" delay={0.1} />
        <MetricTile label="Notifications" value={3} icon={Bell} variant="warning" delay={0.15} />
      </div>

      <QuickActionBar actions={[
        { id: "copilot", label: "AI Academic Assistant", icon: Brain, onClick: () => navigate("/app/assistant") },
        { id: "events", label: "Campus Events", icon: Calendar, onClick: () => navigate("/app/events") },
        { id: "library", label: "Knowledge Center", icon: BookOpen, onClick: () => navigate("/app/library") },
        { id: "service", label: "Raise Ticket", icon: AlertTriangle, onClick: () => navigate("/app/service-center") },
      ]} />

      <div className="grid gap-4 lg:grid-cols-3">
        <WorkspacePanel title="Today's Schedule" description="Class timetable" icon={Calendar} delay={0.2}>
          <ul className="space-y-2">
            {SCHEDULE.map(item => (
              <li key={item.time} className="flex items-center gap-3 rounded-lg border border-border px-3 py-2.5">
                <span className="text-xs font-medium text-primary tabular-nums w-12">{item.time}</span>
                <div>
                  <p className="text-sm font-medium text-foreground">{item.subject}</p>
                  <p className="text-xs text-muted-foreground">{item.room}</p>
                </div>
              </li>
            ))}
          </ul>
        </WorkspacePanel>

        <WorkspacePanel title="Academic Progress" description="Performance overview" icon={Target} delay={0.25}>
          {student && (
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">Campus Pulse</span>
                  <span className="font-medium" style={{ color: getPulseColor(student.pulseScore) }}>{student.pulseScore}</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${student.pulseScore}%`, background: getPulseColor(student.pulseScore) }} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded-lg bg-muted/50 p-2">
                  <p className="text-lg font-semibold tabular-nums">{student.iat1 + student.iat2}</p>
                  <p className="text-[10px] text-muted-foreground">IAT</p>
                </div>
                <div className="rounded-lg bg-muted/50 p-2">
                  <p className="text-lg font-semibold tabular-nums">{student.model}</p>
                  <p className="text-[10px] text-muted-foreground">Model</p>
                </div>
                <div className="rounded-lg bg-muted/50 p-2">
                  <p className="text-lg font-semibold tabular-nums">{student.lmsActivity}</p>
                  <p className="text-[10px] text-muted-foreground">LMS</p>
                </div>
              </div>
            </div>
          )}
        </WorkspacePanel>

        <WorkspacePanel title="Tasks" description="Action items" icon={ClipboardList} delay={0.3}>
          <ul className="space-y-2">
            {TASKS.map(task => (
              <li key={task.id} className="flex items-center gap-3 text-sm">
                <span className={cn("h-4 w-4 rounded border flex items-center justify-center shrink-0", task.done ? "bg-emerald-50 border-emerald-500" : "border-border")}>
                  {task.done && <CheckCircle className="h-3 w-3 text-emerald-600" />}
                </span>
                <span className={task.done ? "text-muted-foreground line-through" : "text-foreground"}>{task.label}</span>
                <span className="ml-auto text-xs text-muted-foreground">{task.due}</span>
              </li>
            ))}
          </ul>
        </WorkspacePanel>
      </div>

      <WorkspacePanel title="Campus Directory" description={`${students.length} students monitored`} icon={Brain} delay={0.35}>
        <div className="mb-4 relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input type="text" placeholder="Search students…" value={search} onChange={e => setSearch(e.target.value)} className="w-full input-warm pl-9 pr-4 py-2 text-sm" />
        </div>
        <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
          {students.filter(s => s.name.toLowerCase().includes(search.toLowerCase())).slice(0, 6).map(s => (
            <div key={s.id} className="rounded-lg border border-border p-3">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium">{s.name}</p>
                  <p className="text-xs text-muted-foreground">{s.department}</p>
                </div>
                <StatusBadge variant={s.status === "Critical" ? "danger" : s.status === "Safe" ? "success" : "warning"}>{s.status}</StatusBadge>
              </div>
            </div>
          ))}
        </div>
      </WorkspacePanel>
    </div>
  );
}
