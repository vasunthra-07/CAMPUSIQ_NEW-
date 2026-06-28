import { useState } from "react";
import { useCampusComplaints } from "@/hooks/useCampusData";
import { AnimatedNumber } from "@/components/motion/AnimatedNumber";
import { PageHeader, MetricTile, WorkspacePanel, StatusBadge } from "@/components/workspace";
import { Headset, Clock, CheckCircle, Circle, Plus, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const PRIORITY_VARIANT = {
  Critical: "danger",
  High: "warning",
  Medium: "info",
  Low: "neutral",
} as const;

export default function ServiceCenter() {
  const { data: complaints, isLoading } = useCampusComplaints();
  const [statusFilter, setStatusFilter] = useState("All");
  const [newOpen, setNewOpen] = useState(false);
  const [newSubject, setNewSubject] = useState("");
  const [newCategory, setNewCategory] = useState("Maintenance");

  if (isLoading || !complaints) {
    return <div className="flex h-64 items-center justify-center text-muted-foreground">Loading…</div>;
  }

  const filtered = statusFilter === "All" ? complaints : complaints.filter(c => c.status === statusFilter);
  const openCount = complaints.filter(c => c.status === "Open").length;
  const inProgressCount = complaints.filter(c => c.status === "In Progress").length;
  const resolvedCount = complaints.filter(c => c.status === "Resolved").length;
  const criticalCount = complaints.filter(c => c.priority === "Critical" && c.status !== "Resolved").length;

  const submitComplaint = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubject.trim()) return;
    toast.success("Ticket submitted! Reference: C00" + Math.floor(Math.random() * 99));
    setNewOpen(false);
    setNewSubject("");
  };

  return (
    <div className="space-y-6 pb-10">
      <PageHeader
        eyebrow="Service Operations"
        title="Campus Service Center"
        description="Priority matrix, ticket queue, and resolution tracking"
        actions={
          <button onClick={() => setNewOpen(true)} className="btn-primary px-4 py-2 text-sm flex items-center gap-2 rounded-lg">
            <Plus className="h-4 w-4" /> New Ticket
          </button>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <MetricTile label="Open Tickets" value={<AnimatedNumber value={openCount} />} icon={Circle} variant="danger" delay={0} />
        <MetricTile label="In Progress" value={<AnimatedNumber value={inProgressCount} />} icon={Clock} variant="warning" delay={0.05} />
        <MetricTile label="Resolved" value={<AnimatedNumber value={resolvedCount} />} icon={CheckCircle} variant="success" delay={0.1} />
        <MetricTile label="Escalations" value={<AnimatedNumber value={criticalCount} />} icon={AlertTriangle} variant="danger" delay={0.15} subtitle="SLA: 48hr avg" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <WorkspacePanel
          title="Priority Matrix"
          description="Tickets by urgency"
          icon={AlertTriangle}
          className="lg:col-span-1"
          delay={0.2}
        >
          {(["Critical", "High", "Medium", "Low"] as const).map(priority => {
            const count = complaints.filter(c => c.priority === priority && c.status !== "Resolved").length;
            return (
              <div key={priority} className="flex items-center justify-between py-2 border-b border-border/60 last:border-0">
                <StatusBadge variant={PRIORITY_VARIANT[priority] as "danger" | "warning" | "info" | "neutral"}>{priority}</StatusBadge>
                <span className="text-sm font-semibold tabular-nums">{count}</span>
              </div>
            );
          })}
        </WorkspacePanel>

        <WorkspacePanel
          title="Ticket Queue"
          description="Active service requests"
          icon={Headset}
          className="lg:col-span-2"
          actions={
            <div className="flex gap-1">
              {["All", "Open", "In Progress", "Resolved"].map(s => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={cn(
                    "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                    statusFilter === s ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          }
          delay={0.25}
        >
          <div className="space-y-2">
            {filtered.map(c => (
              <div key={c.id} className="rounded-lg border border-border p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">{c.subject}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{c.id} · {c.category} · {c.createdAt}</p>
                    <p className="text-xs text-muted-foreground mt-1">Assigned: <span className="text-foreground">{c.assignedTo}</span></p>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <StatusBadge variant={c.status === "Resolved" ? "success" : c.status === "Open" ? "danger" : "warning"}>{c.status}</StatusBadge>
                    <StatusBadge variant={PRIORITY_VARIANT[c.priority as keyof typeof PRIORITY_VARIANT] as "danger" | "warning" | "info" | "neutral"}>{c.priority}</StatusBadge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </WorkspacePanel>
      </div>

      {newOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20" onClick={() => setNewOpen(false)}>
          <form onSubmit={submitComplaint} onClick={e => e.stopPropagation()} className="workspace-panel w-full max-w-md p-6 space-y-4 m-4">
            <h2 className="text-lg font-semibold text-foreground">Submit Service Request</h2>
            <div className="space-y-1.5">
              <label className="section-label">Category</label>
              <select value={newCategory} onChange={e => setNewCategory(e.target.value)} className="w-full input-warm px-3 py-2.5 text-sm">
                {["Maintenance", "Hostel", "Academic", "Safety", "Library", "Transport", "Other"].map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="section-label">Subject</label>
              <input value={newSubject} onChange={e => setNewSubject(e.target.value)} required placeholder="Describe the issue…" className="w-full input-warm px-3 py-2.5 text-sm" />
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setNewOpen(false)} className="btn-secondary flex-1 py-2.5 text-sm rounded-lg">Cancel</button>
              <button type="submit" className="btn-primary flex-1 py-2.5 text-sm rounded-lg">Submit</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
