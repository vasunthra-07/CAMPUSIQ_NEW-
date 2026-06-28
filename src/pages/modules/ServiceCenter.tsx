import { useState } from "react";
import { useCampusComplaints, useAddTicket, useUpdateTicket, useAddTicketComment, useDeleteTicket } from "@/hooks/useCampusData";
import { useAuth } from "@/context/AuthContext";
import { AnimatedNumber } from "@/components/motion/AnimatedNumber";
import { PageHeader, MetricTile, WorkspacePanel, StatusBadge } from "@/components/workspace";
import { Headset, Clock, CheckCircle, Circle, Plus, AlertTriangle, MessageSquare, Trash2, Edit2, ChevronDown, ChevronRight, Send, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { Ticket } from "@/services/campusStore";

const PRIORITY_VARIANT = {
  Critical: "danger",
  High: "warning",
  Medium: "info",
  Low: "neutral",
} as const;

const CATEGORIES = ["Maintenance", "Hostel", "Academic", "Safety", "Library", "Transport", "IT", "Other"];
const ASSIGNEES = ["Maintenance Dept", "Hostel Warden", "Academics Cell", "Civil Dept", "Librarian", "Transport Dept", "IT Dept", "Admin Office"];

interface TicketFormData {
  category: string;
  subject: string;
  description: string;
  priority: Ticket["priority"];
}

const EMPTY_FORM: TicketFormData = { category: "Maintenance", subject: "", description: "", priority: "Medium" };

export default function ServiceCenter() {
  const { user } = useAuth();
  const { data: complaints, isLoading } = useCampusComplaints();
  const addTicket = useAddTicket();
  const updateTicket = useUpdateTicket();
  const addComment = useAddTicketComment();
  const deleteTicket = useDeleteTicket();

  const [statusFilter, setStatusFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [newOpen, setNewOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Ticket | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [form, setForm] = useState<TicketFormData>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<TicketFormData>>({});

  if (isLoading || !complaints) {
    return (
      <div className="space-y-6 pb-10">
        <div className="h-12 w-64 rounded-lg bg-muted animate-pulse" />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[0, 1, 2, 3].map(i => <div key={i} className="h-24 rounded-xl bg-muted animate-pulse" />)}
        </div>
        <div className="h-64 rounded-xl bg-muted animate-pulse" />
      </div>
    );
  }

  const filtered = complaints
    .filter(c => statusFilter === "All" || c.status === statusFilter)
    .filter(c => !search || c.subject.toLowerCase().includes(search.toLowerCase()) || c.category.toLowerCase().includes(search.toLowerCase()) || c.id.toLowerCase().includes(search.toLowerCase()));

  const openCount = complaints.filter(c => c.status === "Open").length;
  const inProgressCount = complaints.filter(c => c.status === "In Progress").length;
  const resolvedCount = complaints.filter(c => c.status === "Resolved").length;
  const criticalCount = complaints.filter(c => c.priority === "Critical" && c.status !== "Resolved").length;

  const validate = (): boolean => {
    const e: Partial<TicketFormData> = {};
    if (!form.subject.trim()) e.subject = "Subject is required";
    if (form.subject.trim().length < 10) e.subject = "Subject must be at least 10 characters";
    if (!form.description.trim()) e.description = "Description is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submitTicket = (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    if (editTarget) {
      updateTicket.mutate({ id: editTarget.id, patch: { subject: form.subject, category: form.category, priority: form.priority, description: form.description } }, {
        onSuccess: () => { toast.success("Ticket updated successfully"); closeForm(); },
        onError: () => toast.error("Failed to update ticket"),
      });
    } else {
      addTicket.mutate({ ...form, status: "Open", assignedTo: ASSIGNEES[CATEGORIES.indexOf(form.category)] ?? "Admin Office", raisedBy: user?.name ?? "System" }, {
        onSuccess: (t) => { toast.success(`Ticket ${t.id} submitted successfully`); closeForm(); },
        onError: () => toast.error("Failed to submit ticket"),
      });
    }
  };

  const closeForm = () => { setNewOpen(false); setEditTarget(null); setForm(EMPTY_FORM); setErrors({}); };

  const openEdit = (ticket: Ticket) => {
    setEditTarget(ticket);
    setForm({ category: ticket.category, subject: ticket.subject, description: ticket.description, priority: ticket.priority });
    setErrors({});
    setNewOpen(true);
  };

  const handleStatusChange = (id: string, status: Ticket["status"]) => {
    updateTicket.mutate({ id, patch: { status } }, {
      onSuccess: () => toast.success(`Status updated to ${status}`),
    });
  };

  const handleAssignChange = (id: string, assignedTo: string) => {
    updateTicket.mutate({ id, patch: { assignedTo } }, {
      onSuccess: () => toast.success(`Ticket assigned to ${assignedTo}`),
    });
  };

  const submitComment = (ticketId: string) => {
    if (!commentText.trim()) return;
    addComment.mutate({ id: ticketId, author: user?.name ?? "Admin", body: commentText }, {
      onSuccess: () => { toast.success("Comment added"); setCommentText(""); },
    });
  };

  const confirmDelete = (id: string) => {
    deleteTicket.mutate(id, {
      onSuccess: () => { toast.success("Ticket deleted"); setDeleteConfirm(null); if (expandedId === id) setExpandedId(null); },
    });
  };

  const exportCSV = () => {
    const rows = [["ID", "Category", "Subject", "Status", "Priority", "Assigned To", "Created", "Raised By"]];
    complaints.forEach(c => rows.push([c.id, c.category, c.subject, c.status, c.priority, c.assignedTo, c.createdAt, c.raisedBy]));
    const csv = rows.map(r => r.join(",")).join("\n");
    const a = document.createElement("a");
    a.href = "data:text/csv," + encodeURIComponent(csv);
    a.download = "tickets.csv";
    a.click();
    toast.success("Tickets exported to CSV");
  };

  return (
    <div className="space-y-6 pb-10">
      <PageHeader
        eyebrow="Service Operations"
        title="Campus Service Center"
        description="Priority matrix, ticket queue, and resolution tracking"
        actions={
          <div className="flex gap-2">
            <button onClick={exportCSV} className="btn-secondary px-4 py-2 text-sm rounded-lg">Export CSV</button>
            <button onClick={() => { setEditTarget(null); setForm(EMPTY_FORM); setErrors({}); setNewOpen(true); }} className="btn-primary px-4 py-2 text-sm flex items-center gap-2 rounded-lg">
              <Plus className="h-4 w-4" /> New Ticket
            </button>
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <MetricTile label="Open Tickets" value={<AnimatedNumber value={openCount} />} icon={Circle} variant="danger" delay={0} />
        <MetricTile label="In Progress" value={<AnimatedNumber value={inProgressCount} />} icon={Clock} variant="warning" delay={0.05} />
        <MetricTile label="Resolved" value={<AnimatedNumber value={resolvedCount} />} icon={CheckCircle} variant="success" delay={0.1} />
        <MetricTile label="Escalations" value={<AnimatedNumber value={criticalCount} />} icon={AlertTriangle} variant="danger" delay={0.15} subtitle="SLA: 48hr avg" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <WorkspacePanel title="Priority Matrix" description="Active tickets by urgency" icon={AlertTriangle} className="lg:col-span-1" delay={0.2}>
          {(["Critical", "High", "Medium", "Low"] as const).map(priority => {
            const count = complaints.filter(c => c.priority === priority && c.status !== "Resolved").length;
            return (
              <div key={priority} className="flex items-center justify-between py-2 border-b border-border/60 last:border-0 cursor-pointer hover:bg-muted/30 rounded px-1 transition-colors"
                onClick={() => setStatusFilter("Open")}>
                <StatusBadge variant={PRIORITY_VARIANT[priority] as "danger" | "warning" | "info" | "neutral"}>{priority}</StatusBadge>
                <span className="text-sm font-semibold tabular-nums">{count}</span>
              </div>
            );
          })}
        </WorkspacePanel>

        <WorkspacePanel
          title="Ticket Queue"
          description={`${filtered.length} of ${complaints.length} tickets`}
          icon={Headset}
          className="lg:col-span-2"
          actions={
            <div className="flex gap-1 flex-wrap">
              {["All", "Open", "In Progress", "Resolved"].map(s => (
                <button key={s} onClick={() => setStatusFilter(s)}
                  className={cn("rounded-md px-2.5 py-1 text-xs font-medium transition-colors", statusFilter === s ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted")}>
                  {s}
                </button>
              ))}
            </div>
          }
          delay={0.25}
        >
          <div className="mb-3">
            <input type="text" placeholder="Search tickets by subject, ID, or category…" value={search} onChange={e => setSearch(e.target.value)}
              className="w-full input-warm px-3 py-2 text-sm" />
          </div>
          <div className="space-y-2">
            {filtered.length === 0 && (
              <div className="py-8 text-center text-muted-foreground text-sm">
                {search ? "No tickets match your search." : "No tickets in this category."}
              </div>
            )}
            {filtered.map(c => {
              const isExpanded = expandedId === c.id;
              return (
                <div key={c.id} className="rounded-lg border border-border overflow-hidden">
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <button onClick={() => setExpandedId(isExpanded ? null : c.id)} className="p-0.5 hover:text-primary transition-colors">
                            {isExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                          </button>
                          <p className="text-sm font-medium text-foreground">{c.subject}</p>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 ml-5">{c.id} · {c.category} · {c.createdAt}</p>
                        <p className="text-xs text-muted-foreground mt-1 ml-5">Raised by: <span className="text-foreground">{c.raisedBy}</span></p>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <StatusBadge variant={c.status === "Resolved" ? "success" : c.status === "Open" ? "danger" : c.status === "Closed" ? "neutral" : "warning"}>{c.status}</StatusBadge>
                        <StatusBadge variant={PRIORITY_VARIANT[c.priority as keyof typeof PRIORITY_VARIANT] as "danger" | "warning" | "info" | "neutral"}>{c.priority}</StatusBadge>
                      </div>
                    </div>
                    <div className="mt-3 ml-5 flex flex-wrap gap-2">
                      <select value={c.status} onChange={e => handleStatusChange(c.id, e.target.value as Ticket["status"])}
                        className="text-xs input-warm px-2 py-1 rounded-md">
                        {["Open", "In Progress", "Resolved", "Closed"].map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                      <select value={c.assignedTo} onChange={e => handleAssignChange(c.id, e.target.value)}
                        className="text-xs input-warm px-2 py-1 rounded-md">
                        {ASSIGNEES.map(a => <option key={a} value={a}>{a}</option>)}
                      </select>
                      <button onClick={() => openEdit(c)} className="btn-ghost text-xs px-2 py-1 rounded-md flex items-center gap-1">
                        <Edit2 className="h-3 w-3" /> Edit
                      </button>
                      <button onClick={() => setDeleteConfirm(c.id)} className="text-xs px-2 py-1 rounded-md text-destructive hover:bg-destructive/10 transition-colors flex items-center gap-1">
                        <Trash2 className="h-3 w-3" /> Delete
                      </button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="border-t border-border bg-muted/20 p-4 space-y-3">
                      {c.description && (
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-1">Description</p>
                          <p className="text-sm text-foreground">{c.description}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                          <MessageSquare className="h-3 w-3" /> Comments ({c.comments.length})
                        </p>
                        <div className="space-y-2 mb-3">
                          {c.comments.map(cm => (
                            <div key={cm.id} className="rounded-lg bg-background border border-border p-2.5">
                              <p className="text-xs font-medium text-foreground">{cm.author}</p>
                              <p className="text-xs text-muted-foreground mt-0.5">{cm.body}</p>
                              <p className="text-[10px] text-muted-foreground mt-1">{new Date(cm.createdAt).toLocaleString()}</p>
                            </div>
                          ))}
                          {c.comments.length === 0 && <p className="text-xs text-muted-foreground">No comments yet.</p>}
                        </div>
                        <div className="flex gap-2">
                          <input value={commentText} onChange={e => setCommentText(e.target.value)}
                            placeholder="Add a comment…" className="flex-1 input-warm px-3 py-2 text-xs"
                            onKeyDown={e => e.key === "Enter" && submitComment(c.id)} />
                          <button onClick={() => submitComment(c.id)} className="btn-primary px-3 py-2 text-xs rounded-lg flex items-center gap-1">
                            <Send className="h-3 w-3" /> Post
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </WorkspacePanel>
      </div>

      {/* Create / Edit Modal */}
      {newOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 backdrop-blur-sm" onClick={closeForm}>
          <form onSubmit={submitTicket} onClick={e => e.stopPropagation()} className="workspace-panel w-full max-w-lg p-6 space-y-4 m-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">{editTarget ? "Edit Ticket" : "Submit Service Request"}</h2>
              <button type="button" onClick={closeForm} className="p-1 hover:text-foreground text-muted-foreground"><X className="h-4 w-4" /></button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="section-label">Category *</label>
                <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className="w-full input-warm px-3 py-2.5 text-sm">
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="section-label">Priority *</label>
                <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value as Ticket["priority"] }))} className="w-full input-warm px-3 py-2.5 text-sm">
                  {["Critical", "High", "Medium", "Low"].map(p => <option key={p}>{p}</option>)}
                </select>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="section-label">Subject *</label>
              <input value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} required
                placeholder="Briefly describe the issue (min 10 characters)…" className={cn("w-full input-warm px-3 py-2.5 text-sm", errors.subject && "border-destructive")} />
              {errors.subject && <p className="text-xs text-destructive">{errors.subject}</p>}
            </div>
            <div className="space-y-1.5">
              <label className="section-label">Description *</label>
              <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} required rows={4}
                placeholder="Provide detailed information about the issue…" className={cn("w-full input-warm px-3 py-2.5 text-sm resize-none", errors.description && "border-destructive")} />
              {errors.description && <p className="text-xs text-destructive">{errors.description}</p>}
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={closeForm} className="btn-secondary flex-1 py-2.5 text-sm rounded-lg">Cancel</button>
              <button type="submit" disabled={addTicket.isPending || updateTicket.isPending} className="btn-primary flex-1 py-2.5 text-sm rounded-lg">
                {addTicket.isPending || updateTicket.isPending ? "Saving…" : editTarget ? "Update Ticket" : "Submit Ticket"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 backdrop-blur-sm">
          <div className="workspace-panel w-full max-w-sm p-6 m-4 space-y-4">
            <h2 className="text-lg font-semibold text-foreground">Delete Ticket?</h2>
            <p className="text-sm text-muted-foreground">This action cannot be undone. The ticket and all its comments will be permanently deleted.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="btn-secondary flex-1 py-2.5 text-sm rounded-lg">Cancel</button>
              <button onClick={() => confirmDelete(deleteConfirm)} className="flex-1 py-2.5 text-sm rounded-lg bg-destructive text-destructive-foreground font-medium hover:bg-destructive/90 transition-colors">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
