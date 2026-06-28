import { useState } from "react";
import { useMaintenanceTasks, useAddMaintenanceTask, useUpdateMaintenanceTask, useDeleteMaintenanceTask } from "@/hooks/useCampusData";
import { AnimatedNumber } from "@/components/motion/AnimatedNumber";
import { PageHeader, MetricTile, WorkspacePanel, StatusBadge } from "@/components/workspace";
import { Activity, Clock, CheckCircle, AlertTriangle, Circle, Plus, Trash2, Edit2, X, Filter } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { MaintenanceTask } from "@/services/campusStore";

const CATEGORIES = ["HVAC", "Electrical", "Civil", "IT", "Plumbing", "Security", "Cleaning", "Other"];
const ASSIGNEES = ["Rajan Kumar", "Murugan T.", "Selvam P.", "IT Dept", "Civil Team", "Security Dept", "Unassigned"];
const PRIORITY_STYLE = {
  Critical: "border-red-500/40 text-red-400 bg-red-500/10",
  High: "border-orange-500/40 text-orange-400 bg-orange-500/10",
  Medium: "border-yellow-500/40 text-yellow-400 bg-yellow-500/10",
  Low: "border-blue-500/40 text-blue-400 bg-blue-500/10",
} as const;
const STATUS_ICON = { Open: Circle, "In Progress": Clock, Done: CheckCircle, Cancelled: X } as const;
const STATUS_COLOR = { Open: "text-red-400", "In Progress": "text-blue-400", Done: "text-emerald-400", Cancelled: "text-muted-foreground" } as const;

const EMPTY_FORM = { title: "", description: "", priority: "Medium" as MaintenanceTask["priority"], status: "Open" as MaintenanceTask["status"], dueDate: "", assignee: "Unassigned", category: "HVAC" };

export default function MaintenanceOps() {
  const { data: tasks, isLoading } = useMaintenanceTasks();
  const addTask = useAddMaintenanceTask();
  const updateTask = useUpdateMaintenanceTask();
  const deleteTask = useDeleteMaintenanceTask();

  const [statusFilter, setStatusFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<MaintenanceTask | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<typeof EMPTY_FORM>>({});

  if (isLoading || !tasks) {
    return (
      <div className="space-y-6 pb-10">
        <div className="h-12 w-64 rounded-lg bg-muted animate-pulse" />
        <div className="grid grid-cols-3 gap-4">
          {[0, 1, 2].map(i => <div key={i} className="h-24 rounded-xl bg-muted animate-pulse" />)}
        </div>
        {[0, 1, 2, 3].map(i => <div key={i} className="h-16 rounded-xl bg-muted animate-pulse" />)}
      </div>
    );
  }

  const openCount = tasks.filter(t => t.status === "Open").length;
  const inProgressCount = tasks.filter(t => t.status === "In Progress").length;
  const doneCount = tasks.filter(t => t.status === "Done").length;
  const overdueCount = tasks.filter(t => t.status !== "Done" && t.status !== "Cancelled" && new Date(t.dueDate) < new Date()).length;

  const filtered = tasks
    .filter(t => statusFilter === "All" || t.status === statusFilter)
    .filter(t => priorityFilter === "All" || t.priority === priorityFilter)
    .filter(t => !search || t.title.toLowerCase().includes(search.toLowerCase()) || t.category.toLowerCase().includes(search.toLowerCase()) || t.assignee.toLowerCase().includes(search.toLowerCase()));

  const validate = () => {
    const e: Partial<typeof EMPTY_FORM> = {};
    if (!form.title.trim()) e.title = "Title is required";
    if (!form.dueDate) e.dueDate = "Due date is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submitTask = (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    if (editTarget) {
      updateTask.mutate({ id: editTarget.id, patch: form }, {
        onSuccess: () => { toast.success("Work order updated"); closeForm(); },
      });
    } else {
      addTask.mutate(form, {
        onSuccess: t => { toast.success(`Work order ${t.id} created`); closeForm(); },
      });
    }
  };

  const closeForm = () => { setFormOpen(false); setEditTarget(null); setForm(EMPTY_FORM); setErrors({}); };

  const openEdit = (task: MaintenanceTask) => {
    setEditTarget(task);
    setForm({ title: task.title, description: task.description, priority: task.priority, status: task.status, dueDate: task.dueDate, assignee: task.assignee, category: task.category });
    setErrors({});
    setFormOpen(true);
  };

  const handleStatusChange = (id: string, status: MaintenanceTask["status"]) => {
    updateTask.mutate({ id, patch: { status } }, {
      onSuccess: () => toast.success(`Status updated to ${status}`),
    });
  };

  const exportCSV = () => {
    const rows = [["ID", "Title", "Category", "Priority", "Status", "Due Date", "Assignee"]];
    tasks.forEach(t => rows.push([t.id, t.title, t.category, t.priority, t.status, t.dueDate, t.assignee]));
    const csv = rows.map(r => r.join(",")).join("\n");
    const a = document.createElement("a");
    a.href = "data:text/csv," + encodeURIComponent(csv);
    a.download = "maintenance_tasks.csv";
    a.click();
    toast.success("Work orders exported");
  };

  return (
    <div className="space-y-6 pb-10">
      <PageHeader
        eyebrow="Facilities Management"
        title="Maintenance Operations"
        description={`${tasks.length} work orders · Live task board`}
        actions={
          <div className="flex gap-2">
            <button onClick={exportCSV} className="btn-secondary px-4 py-2 text-sm rounded-lg">Export CSV</button>
            <button onClick={() => { setEditTarget(null); setForm(EMPTY_FORM); setErrors({}); setFormOpen(true); }}
              className="btn-primary px-4 py-2 text-sm flex items-center gap-2 rounded-lg">
              <Plus className="h-4 w-4" /> New Work Order
            </button>
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <MetricTile label="Open" value={<AnimatedNumber value={openCount} />} icon={Circle} variant="danger" delay={0} />
        <MetricTile label="In Progress" value={<AnimatedNumber value={inProgressCount} />} icon={Clock} variant="warning" delay={0.05} />
        <MetricTile label="Completed" value={<AnimatedNumber value={doneCount} />} icon={CheckCircle} variant="success" delay={0.1} />
        <MetricTile label="Overdue" value={<AnimatedNumber value={overdueCount} />} icon={AlertTriangle} variant="danger" delay={0.15} />
      </div>

      <WorkspacePanel title="Work Orders" description={`${filtered.length} tasks`} icon={Activity} delay={0.2}
        actions={
          <div className="flex gap-1 flex-wrap">
            {["All", "Open", "In Progress", "Done", "Cancelled"].map(s => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={cn("rounded-md px-2.5 py-1 text-xs font-medium transition-colors", statusFilter === s ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted")}>
                {s}
              </button>
            ))}
          </div>
        }
      >
        <div className="mb-3 flex gap-2">
          <input type="text" placeholder="Search work orders…" value={search} onChange={e => setSearch(e.target.value)} className="flex-1 input-warm px-3 py-2 text-sm" />
          <select value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)} className="input-warm px-2 py-2 text-sm">
            {["All", "Critical", "High", "Medium", "Low"].map(p => <option key={p}>{p}</option>)}
          </select>
        </div>
        <div className="space-y-2">
          {filtered.length === 0 && <div className="py-8 text-center text-muted-foreground text-sm">No work orders match your filters.</div>}
          {filtered.map(task => {
            const StatusIcon = STATUS_ICON[task.status as keyof typeof STATUS_ICON] ?? Circle;
            const statusColor = STATUS_COLOR[task.status as keyof typeof STATUS_COLOR] ?? "text-muted-foreground";
            const priorityStyle = PRIORITY_STYLE[task.priority as keyof typeof PRIORITY_STYLE] ?? "";
            const isOverdue = task.status !== "Done" && task.status !== "Cancelled" && new Date(task.dueDate) < new Date();

            return (
              <div key={task.id} className={cn("rounded-lg border p-4 transition-colors", isOverdue ? "border-red-500/30 bg-red-500/5" : "border-border hover:bg-muted/20")}>
                <div className="flex items-start gap-3">
                  <StatusIcon className={cn("h-5 w-5 flex-shrink-0 mt-0.5", statusColor)} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-sm text-foreground">{task.title}</p>
                      {isOverdue && <span className="text-[9px] font-bold text-red-400 border border-red-500/30 px-1.5 py-0.5 rounded-full bg-red-500/10">OVERDUE</span>}
                      <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border", priorityStyle)}>{task.priority}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{task.id} · {task.category} · Due {task.dueDate}</p>
                    {task.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{task.description}</p>}
                    <div className="mt-2 flex flex-wrap gap-2 items-center">
                      <select value={task.status} onChange={e => handleStatusChange(task.id, e.target.value as MaintenanceTask["status"])}
                        className="text-xs input-warm px-2 py-1 rounded-md">
                        {["Open", "In Progress", "Done", "Cancelled"].map(s => <option key={s}>{s}</option>)}
                      </select>
                      <span className="text-xs text-muted-foreground">{task.assignee}</span>
                      {task.comments.length > 0 && <span className="text-xs text-muted-foreground">{task.comments.length} note{task.comments.length !== 1 ? "s" : ""}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => openEdit(task)} className="btn-ghost p-1.5 rounded-lg text-muted-foreground hover:text-foreground" title="Edit">
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => setDeleteConfirm(task.id)} className="btn-ghost p-1.5 rounded-lg text-destructive hover:bg-destructive/10" title="Delete">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </WorkspacePanel>

      {/* Create / Edit Modal */}
      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 backdrop-blur-sm" onClick={closeForm}>
          <form onSubmit={submitTask} onClick={e => e.stopPropagation()} className="workspace-panel w-full max-w-lg p-6 space-y-4 m-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">{editTarget ? "Edit Work Order" : "New Work Order"}</h2>
              <button type="button" onClick={closeForm} className="p-1 text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
            </div>
            <div className="col-span-2 space-y-1.5">
              <label className="section-label">Title *</label>
              <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required placeholder="Work order title…"
                className={cn("w-full input-warm px-3 py-2.5 text-sm", errors.title && "border-destructive")} />
              {errors.title && <p className="text-xs text-destructive">{errors.title}</p>}
            </div>
            <div className="space-y-1.5">
              <label className="section-label">Description</label>
              <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3}
                placeholder="Detailed description of the work…" className="w-full input-warm px-3 py-2.5 text-sm resize-none" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="section-label">Category</label>
                <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className="w-full input-warm px-3 py-2.5 text-sm">
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="section-label">Priority</label>
                <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value as MaintenanceTask["priority"] }))} className="w-full input-warm px-3 py-2.5 text-sm">
                  {["Critical", "High", "Medium", "Low"].map(p => <option key={p}>{p}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="section-label">Status</label>
                <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as MaintenanceTask["status"] }))} className="w-full input-warm px-3 py-2.5 text-sm">
                  {["Open", "In Progress", "Done", "Cancelled"].map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="section-label">Due Date *</label>
                <input type="date" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))}
                  className={cn("w-full input-warm px-3 py-2.5 text-sm", errors.dueDate && "border-destructive")} />
                {errors.dueDate && <p className="text-xs text-destructive">{errors.dueDate}</p>}
              </div>
              <div className="col-span-2 space-y-1.5">
                <label className="section-label">Assignee</label>
                <select value={form.assignee} onChange={e => setForm(f => ({ ...f, assignee: e.target.value }))} className="w-full input-warm px-3 py-2.5 text-sm">
                  {ASSIGNEES.map(a => <option key={a}>{a}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={closeForm} className="btn-secondary flex-1 py-2.5 text-sm rounded-lg">Cancel</button>
              <button type="submit" disabled={addTask.isPending || updateTask.isPending} className="btn-primary flex-1 py-2.5 text-sm rounded-lg">
                {addTask.isPending || updateTask.isPending ? "Saving…" : editTarget ? "Update" : "Create Work Order"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 backdrop-blur-sm">
          <div className="workspace-panel w-full max-w-sm p-6 m-4 space-y-4">
            <h2 className="text-lg font-semibold text-foreground">Delete Work Order?</h2>
            <p className="text-sm text-muted-foreground">This action is permanent and cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="btn-secondary flex-1 py-2.5 text-sm rounded-lg">Cancel</button>
              <button onClick={() => deleteTask.mutate(deleteConfirm, { onSuccess: () => { toast.success("Work order deleted"); setDeleteConfirm(null); } })}
                className="flex-1 py-2.5 text-sm rounded-lg bg-destructive text-destructive-foreground font-medium">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
