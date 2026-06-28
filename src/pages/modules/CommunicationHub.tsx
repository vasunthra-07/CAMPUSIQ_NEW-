import { useState } from "react";
import { PageHeader, MetricTile, WorkspacePanel, StatusBadge } from "@/components/workspace";
import { Users, Bell, Send, Pin, Megaphone, Radio, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

const ANNOUNCEMENTS = [
  { id: "AN01", title: "Campus Maintenance on Saturday", body: "Scheduled power outage from 6AM–10AM affecting Labs B and C.", author: "Admin Office", time: "2h ago", pinned: true, category: "Infrastructure" },
  { id: "AN02", title: "Hackathon 2.0 — Final Registrations Open", body: "Last day to register for the annual hackathon is July 5th. Teams of 3–4.", author: "Student Affairs", time: "5h ago", pinned: false, category: "Events" },
  { id: "AN03", title: "End-Semester Exam Schedule Released", body: "Check the academic portal for your individual schedule.", author: "Academics Cell", time: "1d ago", pinned: false, category: "Academic" },
  { id: "AN04", title: "New Library Timing (Effective July 1)", body: "Library will now be open until 10PM on weekdays.", author: "Librarian", time: "2d ago", pinned: false, category: "Facilities" },
];

const DEPARTMENT_CHANNELS = [
  { name: "Computer Science", members: 420, unread: 3 },
  { name: "Electronics", members: 380, unread: 0 },
  { name: "Mechanical", members: 350, unread: 1 },
  { name: "Administration", members: 45, unread: 5 },
];

export default function CommunicationHub() {
  const [compose, setCompose] = useState(false);
  const [message, setMessage] = useState("");
  const [recipient, setRecipient] = useState("All Students");

  const sendAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Broadcast sent to " + recipient);
    setCompose(false);
    setMessage("");
  };

  return (
    <div className="space-y-6 pb-10">
      <PageHeader
        eyebrow="Communications"
        title="Campus Communications Center"
        description="Announcements, department channels, and broadcast messaging"
        actions={
          <button onClick={() => setCompose(true)} className="btn-primary px-4 py-2 text-sm flex items-center gap-2 rounded-lg">
            <Megaphone className="h-4 w-4" /> Broadcast
          </button>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <MetricTile label="Announcements" value={ANNOUNCEMENTS.length} icon={Bell} variant="primary" delay={0} />
        <MetricTile label="Pinned" value={ANNOUNCEMENTS.filter(a => a.pinned).length} icon={Pin} variant="warning" delay={0.05} />
        <MetricTile label="Channels" value={DEPARTMENT_CHANNELS.length} icon={Radio} variant="default" delay={0.1} />
        <MetricTile label="Reach" value="3.4K" icon={Users} variant="success" delay={0.15} subtitle="Active recipients" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <WorkspacePanel title="Announcements" description="Official campus notices" icon={Bell} delay={0.2}>
            <div className="space-y-3">
              {ANNOUNCEMENTS.map(ann => (
                <article key={ann.id} className={`rounded-lg border p-4 ${ann.pinned ? "border-primary/30 bg-primary/5" : "border-border"}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex gap-2 min-w-0">
                      {ann.pinned && <Pin className="h-4 w-4 shrink-0 text-primary mt-0.5" />}
                      <div>
                        <p className="font-medium text-foreground">{ann.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{ann.author} · {ann.time}</p>
                      </div>
                    </div>
                    <StatusBadge variant="info">{ann.category}</StatusBadge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{ann.body}</p>
                </article>
              ))}
            </div>
          </WorkspacePanel>
        </div>

        <div className="space-y-4">
          <WorkspacePanel title="Department Channels" description="Internal communications" icon={Users} delay={0.25}>
            <ul className="space-y-2">
              {DEPARTMENT_CHANNELS.map(ch => (
                <li key={ch.name} className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5 cursor-pointer hover:bg-muted/50 transition-colors">
                  <div>
                    <p className="text-sm font-medium text-foreground">{ch.name}</p>
                    <p className="text-xs text-muted-foreground">{ch.members} members</p>
                  </div>
                  {ch.unread > 0 && (
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-semibold text-primary-foreground">
                      {ch.unread}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </WorkspacePanel>

          <WorkspacePanel title="Emergency Alerts" description="Critical broadcast channel" icon={AlertTriangle} delay={0.3}>
            <p className="text-sm text-muted-foreground mb-3">No active emergency alerts. System status: normal.</p>
            <button className="btn-secondary w-full py-2 text-xs rounded-lg text-destructive border-destructive/30 hover:bg-destructive/5">
              Send Emergency Alert
            </button>
          </WorkspacePanel>
        </div>
      </div>

      {compose && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20" onClick={() => setCompose(false)}>
          <form onSubmit={sendAnnouncement} onClick={e => e.stopPropagation()} className="workspace-panel w-full max-w-md p-6 space-y-4 m-4">
            <h2 className="text-lg font-semibold">Broadcast Message</h2>
            <div className="space-y-1.5">
              <label className="section-label">Recipients</label>
              <select value={recipient} onChange={e => setRecipient(e.target.value)} className="w-full input-warm px-3 py-2.5 text-sm">
                {["All Students", "All Faculty", "HODs Only", "Final Year Students"].map(r => <option key={r}>{r}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="section-label">Message</label>
              <textarea value={message} onChange={e => setMessage(e.target.value)} required rows={4} placeholder="Write your message…" className="w-full input-warm px-3 py-2.5 text-sm resize-none" />
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={() => setCompose(false)} className="btn-secondary flex-1 py-2.5 text-sm rounded-lg">Cancel</button>
              <button type="submit" className="btn-primary flex-1 py-2.5 text-sm rounded-lg flex items-center justify-center gap-2"><Send className="h-4 w-4" />Send</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
