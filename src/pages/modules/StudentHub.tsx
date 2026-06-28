import { useState } from "react";
import { useStudents } from "@/hooks/useStudents";
import { useStudentTasks, useToggleTask, useAddTask, useDeleteTask } from "@/hooks/useCampusData";
import { getPulseColor, getPulseLabel } from "@/lib/scoring";
import { AnimatedNumber } from "@/components/motion/AnimatedNumber";
import { PageHeader, MetricTile, WorkspacePanel, StatusBadge, QuickActionBar } from "@/components/workspace";
import { Search, AlertTriangle, CheckCircle, BookOpen, Target, Brain, Calendar, Bell, ClipboardList, GraduationCap, Plus, Trash2, X, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const SCHEDULE = [
  { time: "09:00", subject: "Data Structures", room: "Lab 204", type: "Lab" },
  { time: "11:00", subject: "Operating Systems", room: "Hall A", type: "Theory" },
  { time: "14:00", subject: "Machine Learning", room: "Lab 301", type: "Lab" },
  { time: "16:00", subject: "Technical Writing", room: "Hall B", type: "Theory" },
];

const NOTIFICATIONS_DATA = [
  { id: "n1", text: "ML assignment due today", type: "warning", time: "Just now" },
  { id: "n2", text: "Hackathon 2.0 registration closes Jul 5", type: "info", time: "2h ago" },
  { id: "n3", text: "Attendance below 75% alert — Theory", type: "danger", time: "Yesterday" },
];

export default function StudentHub() {
  const { data: students, isLoading: studentsLoading } = useStudents();
  const { data: tasks, isLoading: tasksLoading } = useStudentTasks();
  const toggleTask = useToggleTask();
  const addTask = useAddTask();
  const deleteTask = useDeleteTask();

  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [taskFormOpen, setTaskFormOpen] = useState(false);
  const [newTaskLabel, setNewTaskLabel] = useState("");
  const [newTaskDue, setNewTaskDue] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState<"High" | "Medium" | "Low">("Medium");
  const [newTaskCategory, setNewTaskCategory] = useState("Academic");
  const [taskFilter, setTaskFilter] = useState<"All" | "Pending" | "Done">("All");
  const [detailStudent, setDetailStudent] = useState<typeof students extends Array<infer T> ? T : never | null>(null);

  const isLoading = studentsLoading || tasksLoading;

  if (isLoading || !students || !tasks) {
    return (
      <div className="space-y-6 pb-10">
        <div className="h-12 w-64 rounded-lg bg-muted animate-pulse" />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[0, 1, 2, 3].map(i => <div key={i} className="h-24 rounded-xl bg-muted animate-pulse" />)}
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          {[0, 1, 2].map(i => <div key={i} className="h-48 rounded-xl bg-muted animate-pulse" />)}
        </div>
      </div>
    );
  }

  const student = students[0];
  const pendingTasks = tasks.filter(t => !t.done);
  const doneTasks = tasks.filter(t => t.done);

  const filteredTasks = taskFilter === "Pending" ? pendingTasks : taskFilter === "Done" ? doneTasks : tasks;
  const filteredStudents = students.filter(s => s.name.toLowerCase().includes(search.toLowerCase()) || s.department.toLowerCase().includes(search.toLowerCase()));

  const submitTask = (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!newTaskLabel.trim()) { toast.error("Task name is required"); return; }
    addTask.mutate({ label: newTaskLabel, due: newTaskDue || "No due date", priority: newTaskPriority, category: newTaskCategory }, {
      onSuccess: () => { toast.success("Task added"); setTaskFormOpen(false); setNewTaskLabel(""); setNewTaskDue(""); },
    });
  };

  const handleToggle = (id: string, done: boolean) => {
    toggleTask.mutate(id, {
      onSuccess: () => toast.success(done ? "Task reopened" : "Task completed! 🎉"),
    });
  };

  const priorityColor = { High: "text-red-500", Medium: "text-amber-500", Low: "text-blue-500" };
  const typeColor = { Lab: "bg-blue-500/10 text-blue-600 border-blue-200", Theory: "bg-purple-500/10 text-purple-600 border-purple-200" };

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
        <MetricTile label="Pending Tasks" value={<AnimatedNumber value={pendingTasks.length} />} icon={ClipboardList} variant={pendingTasks.length > 3 ? "warning" : "default"} delay={0.1} />
        <MetricTile label="Notifications" value={<AnimatedNumber value={NOTIFICATIONS_DATA.length} />} icon={Bell} variant="warning" delay={0.15} />
      </div>

      <QuickActionBar actions={[
        { id: "copilot", label: "AI Academic Assistant", icon: Brain, onClick: () => navigate("/app/assistant") },
        { id: "events", label: "Campus Events", icon: Calendar, onClick: () => navigate("/app/events") },
        { id: "library", label: "Knowledge Center", icon: BookOpen, onClick: () => navigate("/app/library") },
        { id: "service", label: "Raise Ticket", icon: AlertTriangle, onClick: () => navigate("/app/service-center") },
      ]} />

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Today's Schedule */}
        <WorkspacePanel title="Today's Schedule" description="Class timetable" icon={Calendar} delay={0.2}>
          <ul className="space-y-2">
            {SCHEDULE.map(item => {
              const now = new Date();
              const [h, m] = item.time.split(":").map(Number);
              const itemTime = new Date(); itemTime.setHours(h, m, 0, 0);
              const isNow = Math.abs(now.getTime() - itemTime.getTime()) < 60 * 60 * 1000;
              return (
                <li key={item.time} className={cn("flex items-center gap-3 rounded-lg border px-3 py-2.5 transition-colors", isNow ? "border-primary/40 bg-primary/5" : "border-border")}>
                  <span className={cn("text-xs font-medium tabular-nums w-12 shrink-0", isNow ? "text-primary" : "text-muted-foreground")}>{item.time}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{item.subject}</p>
                    <p className="text-xs text-muted-foreground">{item.room}</p>
                  </div>
                  <span className={cn("text-[10px] px-1.5 py-0.5 rounded border font-medium", typeColor[item.type as keyof typeof typeColor])}>{item.type}</span>
                  {isNow && <span className="h-2 w-2 rounded-full bg-primary animate-pulse shrink-0" />}
                </li>
              );
            })}
          </ul>
        </WorkspacePanel>

        {/* Academic Progress */}
        <WorkspacePanel title="Academic Progress" description="Performance overview" icon={Target} delay={0.25}>
          {student && (
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">Campus Pulse Score</span>
                  <span className="font-medium" style={{ color: getPulseColor(student.pulseScore) }}>{student.pulseScore} / 100</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${student.pulseScore}%`, background: getPulseColor(student.pulseScore) }} />
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">{getPulseLabel(student.pulseScore)}</p>
              </div>
              <div className="grid grid-cols-2 gap-2 text-center">
                {[
                  { label: "IAT", value: student.iat1 + student.iat2, sub: "/100", warn: (student.iat1 + student.iat2) < 50 },
                  { label: "Model", value: student.model, sub: "/100", warn: student.model < 50 },
                  { label: "LMS", value: student.lmsActivity, sub: "%", warn: student.lmsActivity < 60 },
                  { label: "CGPA", value: student.cgpa, sub: "/10", warn: student.cgpa < 6 },
                ].map(m => (
                  <div key={m.label} className="rounded-lg bg-muted/50 p-2.5">
                    <p className={cn("text-lg font-semibold tabular-nums", m.warn ? "text-amber-500" : "text-foreground")}>{m.value}{m.sub}</p>
                    <p className="text-[10px] text-muted-foreground">{m.label}</p>
                  </div>
                ))}
              </div>
              <div className="pt-2 border-t border-border">
                <p className="text-xs text-muted-foreground leading-relaxed">{student.reasoningNote}</p>
              </div>
            </div>
          )}
        </WorkspacePanel>

        {/* Tasks */}
        <WorkspacePanel
          title="My Tasks"
          description={`${pendingTasks.length} pending · ${doneTasks.length} done`}
          icon={ClipboardList}
          actions={
            <div className="flex gap-1">
              {(["All", "Pending", "Done"] as const).map(f => (
                <button key={f} onClick={() => setTaskFilter(f)}
                  className={cn("rounded-md px-2 py-0.5 text-xs font-medium transition-colors", taskFilter === f ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted")}>
                  {f}
                </button>
              ))}
            </div>
          }
          delay={0.3}
        >
          <button onClick={() => setTaskFormOpen(true)} className="w-full btn-secondary py-2 text-xs rounded-lg flex items-center justify-center gap-1 mb-3">
            <Plus className="h-3.5 w-3.5" /> Add Task
          </button>
          <ul className="space-y-2">
            {filteredTasks.length === 0 && <li className="text-xs text-muted-foreground text-center py-3">No tasks here.</li>}
            {filteredTasks.map(task => (
              <li key={task.id} className={cn("flex items-center gap-2.5 text-sm rounded-lg px-2 py-2 transition-colors hover:bg-muted/30", task.done && "opacity-60")}>
                <button onClick={() => handleToggle(task.id, task.done)}
                  className={cn("h-4 w-4 rounded border flex items-center justify-center shrink-0 transition-colors", task.done ? "bg-emerald-50 border-emerald-500" : "border-border hover:border-primary")}>
                  {task.done && <CheckCircle className="h-3 w-3 text-emerald-600" />}
                </button>
                <div className="flex-1 min-w-0">
                  <p className={cn("text-sm leading-tight", task.done ? "text-muted-foreground line-through" : "text-foreground")}>{task.label}</p>
                  <p className="text-[10px] text-muted-foreground">{task.due} · {task.category}</p>
                </div>
                <span className={cn("text-[10px] font-semibold shrink-0", priorityColor[task.priority])}>{task.priority}</span>
                <button onClick={() => deleteTask.mutate(task.id, { onSuccess: () => toast.success("Task removed") })}
                  className="p-0.5 text-muted-foreground hover:text-destructive transition-colors shrink-0">
                  <Trash2 className="h-3 w-3" />
                </button>
              </li>
            ))}
          </ul>
        </WorkspacePanel>
      </div>

      {/* Notifications */}
      <WorkspacePanel title="Recent Notifications" description="Campus alerts and reminders" icon={Bell} delay={0.35}>
        <div className="space-y-2">
          {NOTIFICATIONS_DATA.map(n => (
            <div key={n.id} className={cn("flex items-start gap-3 rounded-lg border px-3 py-2.5",
              n.type === "danger" ? "border-red-200 bg-red-50/50" : n.type === "warning" ? "border-amber-200 bg-amber-50/50" : "border-border")}>
              <div className={cn("h-2 w-2 rounded-full mt-1.5 shrink-0", n.type === "danger" ? "bg-red-500" : n.type === "warning" ? "bg-amber-500" : "bg-blue-500")} />
              <p className="text-sm text-foreground flex-1">{n.text}</p>
              <span className="text-xs text-muted-foreground shrink-0">{n.time}</span>
            </div>
          ))}
        </div>
      </WorkspacePanel>

      {/* Campus Directory */}
      <WorkspacePanel title="Campus Directory" description={`${students.length} students`} icon={Brain} delay={0.4}>
        <div className="mb-4 relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input type="text" placeholder="Search students by name or department…" value={search} onChange={e => setSearch(e.target.value)} className="w-full input-warm pl-9 pr-4 py-2 text-sm" />
        </div>
        {filteredStudents.length === 0 ? (
          <div className="py-6 text-center text-muted-foreground text-sm">No students match your search.</div>
        ) : (
          <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
            {filteredStudents.slice(0, 9).map(s => (
              <button key={s.id} onClick={() => setDetailStudent(s as any)} className="rounded-lg border border-border p-3 text-left hover:bg-muted/30 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{s.name}</p>
                    <p className="text-xs text-muted-foreground">{s.department} · Year {s.year}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <TrendingUp className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs tabular-nums" style={{ color: getPulseColor(s.pulseScore) }}>{s.pulseScore}</span>
                    </div>
                  </div>
                  <StatusBadge variant={s.status === "Critical" ? "danger" : s.status === "Safe" ? "success" : "warning"}>{s.status}</StatusBadge>
                </div>
              </button>
            ))}
          </div>
        )}
        {filteredStudents.length > 9 && (
          <p className="text-xs text-muted-foreground mt-3 text-center">{filteredStudents.length - 9} more students — refine search to narrow results.</p>
        )}
      </WorkspacePanel>

      {/* Add Task Modal */}
      {taskFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 backdrop-blur-sm" onClick={() => setTaskFormOpen(false)}>
          <form onSubmit={submitTask} onClick={e => e.stopPropagation()} className="workspace-panel w-full max-w-sm p-6 space-y-4 m-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">Add Task</h2>
              <button type="button" onClick={() => setTaskFormOpen(false)} className="p-1 text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
            </div>
            <div className="space-y-1.5">
              <label className="section-label">Task Name *</label>
              <input value={newTaskLabel} onChange={e => setNewTaskLabel(e.target.value)} required placeholder="What needs to be done?" className="w-full input-warm px-3 py-2.5 text-sm" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="section-label">Due Date</label>
                <input type="date" value={newTaskDue} onChange={e => setNewTaskDue(e.target.value)} className="w-full input-warm px-3 py-2.5 text-sm" />
              </div>
              <div className="space-y-1.5">
                <label className="section-label">Priority</label>
                <select value={newTaskPriority} onChange={e => setNewTaskPriority(e.target.value as "High" | "Medium" | "Low")} className="w-full input-warm px-3 py-2.5 text-sm">
                  {["High", "Medium", "Low"].map(p => <option key={p}>{p}</option>)}
                </select>
              </div>
              <div className="col-span-2 space-y-1.5">
                <label className="section-label">Category</label>
                <select value={newTaskCategory} onChange={e => setNewTaskCategory(e.target.value)} className="w-full input-warm px-3 py-2.5 text-sm">
                  {["Academic", "Events", "Library", "Personal", "Administrative"].map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setTaskFormOpen(false)} className="btn-secondary flex-1 py-2.5 text-sm rounded-lg">Cancel</button>
              <button type="submit" disabled={addTask.isPending} className="btn-primary flex-1 py-2.5 text-sm rounded-lg">Add Task</button>
            </div>
          </form>
        </div>
      )}

      {/* Student Detail Modal */}
      {detailStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 backdrop-blur-sm" onClick={() => setDetailStudent(null)}>
          <div className="workspace-panel w-full max-w-md p-6 space-y-4 m-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold text-foreground">{(detailStudent as any).name}</h2>
                <p className="text-xs text-muted-foreground">{(detailStudent as any).id} · {(detailStudent as any).department} · Year {(detailStudent as any).year}</p>
              </div>
              <button onClick={() => setDetailStudent(null)} className="p-1 text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              {[
                { label: "Pulse", value: `${(detailStudent as any).pulseScore}` },
                { label: "Attendance", value: `${(detailStudent as any).attendance}%` },
                { label: "CGPA", value: `${(detailStudent as any).cgpa}/10` },
              ].map(m => (
                <div key={m.label} className="rounded-lg bg-muted/50 p-2">
                  <p className="text-base font-semibold tabular-nums">{m.value}</p>
                  <p className="text-[10px] text-muted-foreground">{m.label}</p>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Status</span>
              <StatusBadge variant={(detailStudent as any).status === "Critical" ? "danger" : (detailStudent as any).status === "Safe" ? "success" : "warning"}>{(detailStudent as any).status}</StatusBadge>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed border-t border-border pt-3">{(detailStudent as any).reasoningNote}</p>
            <button onClick={() => setDetailStudent(null)} className="w-full btn-secondary py-2.5 text-sm rounded-lg">Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
