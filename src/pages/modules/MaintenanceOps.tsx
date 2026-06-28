import { useMaintenanceTasks } from "@/hooks/useCampusData";
import { fadeUpStyle } from "@/lib/motion";
import { AnimatedNumber } from "@/components/motion/AnimatedNumber";
import { Activity, Clock, CheckCircle, AlertTriangle, Circle } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const PRIORITY_STYLE = {
  Critical: "border-red-500/40 text-red-400 bg-red-500/10",
  High: "border-orange-500/40 text-orange-400 bg-orange-500/10",
  Medium: "border-yellow-500/40 text-yellow-400 bg-yellow-500/10",
  Low: "border-blue-500/40 text-blue-400 bg-blue-500/10",
} as const;

const STATUS_ICON = { Open: Circle, "In Progress": Clock, Done: CheckCircle } as const;
const STATUS_COLOR = { Open: "text-red-400", "In Progress": "text-blue-400", Done: "text-emerald-400" } as const;

export default function MaintenanceOps() {
  const { data: tasks, isLoading } = useMaintenanceTasks();

  if (isLoading || !tasks) {
    return <div className="flex h-64 items-center justify-center text-muted-foreground animate-pulse">Loading…</div>;
  }

  const openCount = tasks.filter(t => t.status === "Open").length;
  const inProgressCount = tasks.filter(t => t.status === "In Progress").length;
  const doneCount = tasks.filter(t => t.status === "Done").length;

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-10">
      <div style={fadeUpStyle(0)} className="border-b border-border/50 pb-6">
        <p className="section-label mb-1">Facilities Management</p>
        <h1 className="text-3xl font-bold font-syne gradient-text-gold tracking-tight">Maintenance Operations</h1>
        <p className="text-sm text-muted-foreground mt-1">{tasks.length} work orders · Live task board</p>
      </div>

      <div className="grid grid-cols-3 gap-4" style={fadeUpStyle(1)}>
        {[
          { label: "Open", value: openCount, icon: Circle, color: "text-red-400" },
          { label: "In Progress", value: inProgressCount, icon: Clock, color: "text-blue-400" },
          { label: "Completed", value: doneCount, icon: CheckCircle, color: "text-emerald-400" },
        ].map((s, i) => (
          <div key={s.label} className="card-warm p-5 text-center card-glow-hover" style={fadeUpStyle(i, 80)}>
            <s.icon className={cn("h-5 w-5 mx-auto mb-2", s.color)} />
            <p className="text-3xl font-bold font-mono gradient-text-gold"><AnimatedNumber value={s.value} /></p>
            <p className="text-[11px] text-muted-foreground mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Task Board */}
      <div className="grid grid-cols-1 gap-3" style={fadeUpStyle(2)}>
        {tasks.map((task, i) => {
          const StatusIcon = STATUS_ICON[task.status as keyof typeof STATUS_ICON] ?? Circle;
          const statusColor = STATUS_COLOR[task.status as keyof typeof STATUS_COLOR] ?? "text-muted-foreground";
          const priorityStyle = PRIORITY_STYLE[task.priority as keyof typeof PRIORITY_STYLE] ?? "";
          const isOverdue = task.status !== "Done" && new Date(task.dueDate) < new Date();

          return (
            <div key={task.id} className={cn("card-warm card-glow-hover p-4 flex items-center gap-4 border", isOverdue ? "border-red-500/30 bg-red-500/5" : "border-border/50")} style={fadeUpStyle(i, 50)}>
              <StatusIcon className={cn("h-5 w-5 flex-shrink-0", statusColor)} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="font-semibold text-sm text-foreground truncate">{task.title}</p>
                  {isOverdue && <span className="text-[9px] font-bold text-red-400 border border-red-500/30 px-1.5 py-0.5 rounded-full bg-red-500/10 flex-shrink-0">OVERDUE</span>}
                </div>
                <p className="text-[10px] text-muted-foreground font-mono">{task.id} · {task.category} · Due {task.dueDate}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-[11px] text-muted-foreground hidden sm:block">{task.assignee}</span>
                <span className={cn("text-[10px] font-bold px-2 py-1 rounded-full border", priorityStyle)}>{task.priority}</span>
                <button onClick={() => toast.success(`Work order ${task.id} updated!`)}
                  className="btn-ghost p-1.5 rounded-lg text-xs hover:text-accent"><Activity className="h-3.5 w-3.5" /></button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
