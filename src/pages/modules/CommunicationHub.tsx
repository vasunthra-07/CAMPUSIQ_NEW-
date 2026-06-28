import { useState } from "react";
import { useAnnouncements, useAddAnnouncement, useDeleteAnnouncement, useToggleAnnouncementPin, useMarkAnnouncementRead } from "@/hooks/useCampusData";
import { useAuth } from "@/context/AuthContext";
import { PageHeader, MetricTile, WorkspacePanel, StatusBadge } from "@/components/workspace";
import { AnimatedNumber } from "@/components/motion/AnimatedNumber";
import { Users, Bell, Send, Pin, Megaphone, Radio, AlertTriangle, Plus, Trash2, X, CheckCircle, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { Announcement } from "@/services/campusStore";

const CATEGORIES = ["Infrastructure", "Events", "Academic", "Facilities", "Safety", "General"];
const DEPT_CHANNELS = [
  { id: "dc1", name: "Computer Science", members: 420, unread: 3, lastMsg: "Lab 3 booking confirmed for Thursday." },
  { id: "dc2", name: "Electronics", members: 380, unread: 0, lastMsg: "PCB lab schedule posted." },
  { id: "dc3", name: "Mechanical", members: 350, unread: 1, lastMsg: "Workshop safety briefing mandatory." },
  { id: "dc4", name: "Administration", members: 45, unread: 5, lastMsg: "Board meeting minutes shared." },
  { id: "dc5", name: "All Students", members: 1850, unread: 2, lastMsg: "Exam fee payment deadline extended." },
];

const RECIPIENTS = ["All Students", "All Faculty", "HODs Only", "Final Year Students", "1st Year Students", "All Staff"];

const EMPTY_FORM = { title: "", body: "", category: CATEGORIES[0], priority: "Normal" as Announcement["priority"], pinned: false };

export default function CommunicationHub() {
  const { user } = useAuth();
  const { data: announcements, isLoading } = useAnnouncements();
  const addAnn = useAddAnnouncement();
  const deleteAnn = useDeleteAnnouncement();
  const togglePin = useToggleAnnouncementPin();
  const markRead = useMarkAnnouncementRead();

  const [compose, setCompose] = useState(false);
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [broadcastTitle, setBroadcastTitle] = useState("");
  const [recipient, setRecipient] = useState("All Students");
  const [broadcastOpen, setBroadcastOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [emergencyConfirm, setEmergencyConfirm] = useState(false);
  const [emergencyMsg, setEmergencyMsg] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [form, setForm] = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState<Partial<typeof EMPTY_FORM>>({});
  const [selectedChannel, setSelectedChannel] = useState<string | null>(null);

  const userId = user?.userId ?? "guest";

  if (isLoading || !announcements) {
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

  const pinned = announcements.filter(a => a.pinned);
  const filtered = announcements.filter(a => categoryFilter === "All" || a.category === categoryFilter);
  const sorted = [...filtered].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const validateForm = () => {
    const e: Partial<typeof EMPTY_FORM> = {};
    if (!form.title.trim()) e.title = "Title is required";
    if (!form.body.trim()) e.body = "Body is required";
    setFormErrors(e);
    return Object.keys(e).length === 0;
  };

  const submitAnnouncement = (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validateForm()) return;
    addAnn.mutate({ ...form, author: user?.name ?? "Admin", readBy: [] }, {
      onSuccess: () => { toast.success("Announcement published"); setCompose(false); setForm(EMPTY_FORM); setFormErrors({}); },
    });
  };

  const sendBroadcast = (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!broadcastTitle.trim() || !broadcastMessage.trim()) { toast.error("Title and message are required"); return; }
    addAnn.mutate({ title: broadcastTitle, body: broadcastMessage, author: user?.name ?? "Admin", category: "General", priority: "Important", pinned: false, readBy: [] }, {
      onSuccess: () => {
        toast.success(`Broadcast sent to ${recipient} (${DEPT_CHANNELS.find(c => c.name === recipient)?.members ?? 0} recipients)`);
        setBroadcastOpen(false); setBroadcastTitle(""); setBroadcastMessage("");
      },
    });
  };

  const sendEmergencyAlert = () => {
    if (!emergencyMsg.trim()) { toast.error("Emergency message is required"); return; }
    addAnn.mutate({ title: "🚨 EMERGENCY ALERT", body: emergencyMsg, author: user?.name ?? "Admin", category: "Safety", priority: "Urgent", pinned: true, readBy: [] }, {
      onSuccess: () => {
        toast.error("Emergency alert sent to all campus members!", { duration: 8000 });
        setEmergencyConfirm(false); setEmergencyMsg("");
      },
    });
  };

  const handleMarkRead = (id: string) => {
    markRead.mutate({ id, userId }, {
      onSuccess: () => toast.success("Marked as read"),
    });
  };

  const timeAgo = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  const totalReach = DEPT_CHANNELS.reduce((a, c) => a + c.members, 0);
  const totalUnread = DEPT_CHANNELS.reduce((a, c) => a + c.unread, 0);

  return (
    <div className="space-y-6 pb-10">
      <PageHeader
        eyebrow="Communications"
        title="Campus Communications Center"
        description="Announcements, department channels, and broadcast messaging"
        actions={
          <div className="flex gap-2">
            <button onClick={() => setBroadcastOpen(true)} className="btn-secondary px-4 py-2 text-sm flex items-center gap-2 rounded-lg">
              <Send className="h-4 w-4" /> Broadcast
            </button>
            <button onClick={() => setCompose(true)} className="btn-primary px-4 py-2 text-sm flex items-center gap-2 rounded-lg">
              <Plus className="h-4 w-4" /> New Announcement
            </button>
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <MetricTile label="Announcements" value={<AnimatedNumber value={announcements.length} />} icon={Bell} variant="primary" delay={0} />
        <MetricTile label="Pinned" value={<AnimatedNumber value={pinned.length} />} icon={Pin} variant="warning" delay={0.05} />
        <MetricTile label="Channels" value={<AnimatedNumber value={DEPT_CHANNELS.length} />} icon={Radio} variant="default" delay={0.1} />
        <MetricTile label="Total Reach" value={<AnimatedNumber value={totalReach} />} icon={Users} variant="success" delay={0.15} subtitle="Active recipients" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <WorkspacePanel
            title="Announcements"
            description="Official campus notices"
            icon={Bell}
            actions={
              <div className="flex gap-1">
                {["All", ...CATEGORIES].map(c => (
                  <button key={c} onClick={() => setCategoryFilter(c)}
                    className={cn("rounded-md px-2.5 py-1 text-xs font-medium transition-colors", categoryFilter === c ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted")}>
                    {c}
                  </button>
                ))}
              </div>
            }
            delay={0.2}
          >
            <div className="space-y-3">
              {sorted.length === 0 && <div className="py-8 text-center text-muted-foreground text-sm">No announcements yet.</div>}
              {sorted.map(ann => {
                const isRead = ann.readBy.includes(userId);
                const priorityColor = ann.priority === "Urgent" ? "border-destructive/40 bg-destructive/5" : ann.pinned ? "border-primary/30 bg-primary/5" : "border-border";
                return (
                  <article key={ann.id} className={`rounded-lg border p-4 ${priorityColor} ${!isRead ? "ring-1 ring-primary/20" : ""}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex gap-2 min-w-0 flex-1">
                        {ann.pinned && <Pin className="h-4 w-4 shrink-0 text-primary mt-0.5" />}
                        {ann.priority === "Urgent" && <AlertTriangle className="h-4 w-4 shrink-0 text-destructive mt-0.5" />}
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className={cn("font-medium text-foreground", !isRead && "font-semibold")}>{ann.title}</p>
                            {!isRead && <span className="h-2 w-2 rounded-full bg-primary animate-pulse shrink-0" />}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">{ann.author} · {timeAgo(ann.createdAt)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <StatusBadge variant={ann.priority === "Urgent" ? "danger" : ann.priority === "Important" ? "warning" : "info"}>{ann.category}</StatusBadge>
                        <button onClick={() => togglePin.mutate(ann.id)} className={cn("p-1 rounded hover:bg-muted/50 transition-colors", ann.pinned ? "text-primary" : "text-muted-foreground")} title={ann.pinned ? "Unpin" : "Pin"}>
                          <Pin className="h-3.5 w-3.5" />
                        </button>
                        {!isRead && (
                          <button onClick={() => handleMarkRead(ann.id)} className="p-1 rounded text-muted-foreground hover:text-emerald-600 hover:bg-emerald-50 transition-colors" title="Mark as read">
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                        )}
                        {isRead && <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />}
                        <button onClick={() => setDeleteConfirm(ann.id)} className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{ann.body}</p>
                    <p className="text-[10px] text-muted-foreground mt-2">{ann.readBy.length} read</p>
                  </article>
                );
              })}
            </div>
          </WorkspacePanel>
        </div>

        <div className="space-y-4">
          <WorkspacePanel title="Department Channels" description={`${totalUnread} unread messages`} icon={Users} delay={0.25}>
            <ul className="space-y-2">
              {DEPT_CHANNELS.map(ch => (
                <li key={ch.id} onClick={() => { setSelectedChannel(selectedChannel === ch.id ? null : ch.id); if (ch.unread > 0) toast.info(`Opening ${ch.name} channel`); }}
                  className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5 cursor-pointer hover:bg-muted/50 transition-colors">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground">{ch.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{ch.lastMsg}</p>
                    <p className="text-[10px] text-muted-foreground">{ch.members} members</p>
                  </div>
                  {ch.unread > 0 && (
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-semibold text-primary-foreground ml-2">
                      {ch.unread}
                    </span>
                  )}
                </li>
              ))}
            </ul>
            {selectedChannel && (
              <div className="mt-3 p-3 rounded-lg border border-border bg-muted/30">
                <p className="text-xs text-muted-foreground mb-2">Post to {DEPT_CHANNELS.find(c => c.id === selectedChannel)?.name}</p>
                <div className="flex gap-2">
                  <input placeholder="Type a message…" className="flex-1 input-warm px-3 py-2 text-xs"
                    onKeyDown={e => { if (e.key === "Enter" && (e.target as HTMLInputElement).value.trim()) { toast.success("Message posted to channel"); (e.target as HTMLInputElement).value = ""; } }} />
                  <button className="btn-primary px-3 py-2 text-xs rounded-lg"><Send className="h-3 w-3" /></button>
                </div>
              </div>
            )}
          </WorkspacePanel>

          <WorkspacePanel title="Emergency Alerts" description="Critical broadcast channel" icon={AlertTriangle} delay={0.3}>
            <p className="text-sm text-muted-foreground mb-3">
              {announcements.some(a => a.priority === "Urgent") ? "⚠️ Active emergency alert in system." : "No active emergency alerts. System status: normal."}
            </p>
            <button onClick={() => setEmergencyConfirm(true)} className="w-full py-2 text-xs rounded-lg border border-destructive/30 text-destructive hover:bg-destructive/10 transition-colors font-medium">
              Send Emergency Alert
            </button>
          </WorkspacePanel>
        </div>
      </div>

      {/* New Announcement Modal */}
      {compose && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 backdrop-blur-sm" onClick={() => setCompose(false)}>
          <form onSubmit={submitAnnouncement} onClick={e => e.stopPropagation()} className="workspace-panel w-full max-w-md p-6 space-y-4 m-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">New Announcement</h2>
              <button type="button" onClick={() => setCompose(false)} className="p-1 text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 space-y-1.5">
                <label className="section-label">Title *</label>
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required placeholder="Announcement title…"
                  className={cn("w-full input-warm px-3 py-2.5 text-sm", formErrors.title && "border-destructive")} />
                {formErrors.title && <p className="text-xs text-destructive">{formErrors.title}</p>}
              </div>
              <div className="space-y-1.5">
                <label className="section-label">Category</label>
                <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className="w-full input-warm px-3 py-2.5 text-sm">
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="section-label">Priority</label>
                <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value as Announcement["priority"] }))} className="w-full input-warm px-3 py-2.5 text-sm">
                  {(["Normal", "Important", "Urgent"] as const).map(p => <option key={p}>{p}</option>)}
                </select>
              </div>
              <div className="col-span-2 space-y-1.5">
                <label className="section-label">Message *</label>
                <textarea value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))} required rows={4}
                  placeholder="Announcement body…" className={cn("w-full input-warm px-3 py-2.5 text-sm resize-none", formErrors.body && "border-destructive")} />
                {formErrors.body && <p className="text-xs text-destructive">{formErrors.body}</p>}
              </div>
              <div className="col-span-2 flex items-center gap-2">
                <input type="checkbox" id="pin-check" checked={form.pinned} onChange={e => setForm(f => ({ ...f, pinned: e.target.checked }))} className="h-4 w-4 accent-primary" />
                <label htmlFor="pin-check" className="text-sm text-foreground cursor-pointer">Pin this announcement</label>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setCompose(false)} className="btn-secondary flex-1 py-2.5 text-sm rounded-lg">Cancel</button>
              <button type="submit" disabled={addAnn.isPending} className="btn-primary flex-1 py-2.5 text-sm rounded-lg">
                {addAnn.isPending ? "Publishing…" : "Publish"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Broadcast Modal */}
      {broadcastOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 backdrop-blur-sm" onClick={() => setBroadcastOpen(false)}>
          <form onSubmit={sendBroadcast} onClick={e => e.stopPropagation()} className="workspace-panel w-full max-w-md p-6 space-y-4 m-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">Broadcast Message</h2>
              <button type="button" onClick={() => setBroadcastOpen(false)} className="p-1 text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
            </div>
            <div className="space-y-1.5">
              <label className="section-label">Recipients</label>
              <select value={recipient} onChange={e => setRecipient(e.target.value)} className="w-full input-warm px-3 py-2.5 text-sm">
                {RECIPIENTS.map(r => <option key={r}>{r}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="section-label">Subject *</label>
              <input value={broadcastTitle} onChange={e => setBroadcastTitle(e.target.value)} required placeholder="Broadcast subject…" className="w-full input-warm px-3 py-2.5 text-sm" />
            </div>
            <div className="space-y-1.5">
              <label className="section-label">Message *</label>
              <textarea value={broadcastMessage} onChange={e => setBroadcastMessage(e.target.value)} required rows={4}
                placeholder="Write your broadcast message…" className="w-full input-warm px-3 py-2.5 text-sm resize-none" />
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={() => setBroadcastOpen(false)} className="btn-secondary flex-1 py-2.5 text-sm rounded-lg">Cancel</button>
              <button type="submit" disabled={addAnn.isPending} className="btn-primary flex-1 py-2.5 text-sm rounded-lg flex items-center justify-center gap-2">
                <Send className="h-4 w-4" />{addAnn.isPending ? "Sending…" : "Send Broadcast"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Emergency Alert Modal */}
      {emergencyConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/30 backdrop-blur-sm">
          <div className="workspace-panel w-full max-w-sm p-6 m-4 space-y-4 border-destructive/40 border">
            <div className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              <h2 className="text-lg font-bold">Send Emergency Alert</h2>
            </div>
            <p className="text-sm text-muted-foreground">This will immediately notify ALL campus members. Use only for genuine emergencies.</p>
            <div className="space-y-1.5">
              <label className="section-label">Emergency Message *</label>
              <textarea value={emergencyMsg} onChange={e => setEmergencyMsg(e.target.value)} rows={3} required
                placeholder="Describe the emergency…" className="w-full input-warm px-3 py-2.5 text-sm resize-none border-destructive/40" />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setEmergencyConfirm(false)} className="btn-secondary flex-1 py-2.5 text-sm rounded-lg">Cancel</button>
              <button onClick={sendEmergencyAlert} className="flex-1 py-2.5 text-sm rounded-lg bg-destructive text-destructive-foreground font-bold">
                Send Emergency Alert
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 backdrop-blur-sm">
          <div className="workspace-panel w-full max-w-sm p-6 m-4 space-y-4">
            <h2 className="text-lg font-semibold text-foreground">Delete Announcement?</h2>
            <p className="text-sm text-muted-foreground">This announcement will be permanently removed.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="btn-secondary flex-1 py-2.5 text-sm rounded-lg">Cancel</button>
              <button onClick={() => deleteAnn.mutate(deleteConfirm, { onSuccess: () => { toast.success("Announcement deleted"); setDeleteConfirm(null); } })}
                className="flex-1 py-2.5 text-sm rounded-lg bg-destructive text-destructive-foreground font-medium">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
