import { useState } from "react";
import { useCampusEvents, useAddEvent, useUpdateEvent, useDeleteEvent, useRegisterEvent, useUnregisterEvent } from "@/hooks/useCampusData";
import { useAuth } from "@/context/AuthContext";
import { AnimatedNumber } from "@/components/motion/AnimatedNumber";
import { PageHeader, MetricTile, WorkspacePanel, StatusBadge } from "@/components/workspace";
import { Calendar, Users, MapPin, Zap, Clock, Plus, Edit2, Trash2, X, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { CampusEvent } from "@/services/campusStore";

const CATEGORIES = ["Technical", "Career", "Sports", "Cultural", "Academic", "Workshop", "Seminar", "Other"];
const VENUES = ["Main Auditorium", "Seminar Hall A", "Seminar Hall B", "Ground", "Lab Complex", "Conference Room", "Open Air Theatre"];

const EMPTY_FORM = { title: "", description: "", date: "", time: "09:00 AM", venue: VENUES[0], organizer: "", capacity: 100, category: CATEGORIES[0] };

export default function EventManagement() {
  const { user } = useAuth();
  const { data: events, isLoading } = useCampusEvents();
  const addEvent = useAddEvent();
  const updateEvent = useUpdateEvent();
  const deleteEvent = useDeleteEvent();
  const registerEvent = useRegisterEvent();
  const unregisterEvent = useUnregisterEvent();

  const [filter, setFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<CampusEvent | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [detailView, setDetailView] = useState<CampusEvent | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<typeof EMPTY_FORM & { capacity: string }>>({});

  if (isLoading || !events) {
    return (
      <div className="space-y-6 pb-10">
        <div className="h-12 w-64 rounded-lg bg-muted animate-pulse" />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[0, 1, 2, 3].map(i => <div key={i} className="h-24 rounded-xl bg-muted animate-pulse" />)}
        </div>
        <div className="h-96 rounded-xl bg-muted animate-pulse" />
      </div>
    );
  }

  const userId = user?.userId ?? "guest";
  const statuses = ["All", "Open", "Full", "Cancelled", "Completed"];
  const categoryOptions = ["All", ...CATEGORIES];

  const filtered = events
    .filter(e => filter === "All" || e.status === filter)
    .filter(e => categoryFilter === "All" || e.category === categoryFilter)
    .filter(e => !search || e.title.toLowerCase().includes(search.toLowerCase()) || e.venue.toLowerCase().includes(search.toLowerCase()));

  const totalReg = events.reduce((a, e) => a + e.registrations, 0);
  const totalCap = events.reduce((a, e) => a + e.capacity, 0);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.title.trim()) e.title = "Title is required";
    if (!form.date) e.date = "Date is required";
    if (!form.organizer.trim()) e.organizer = "Organizer is required";
    if (form.capacity < 1) e.capacity = "Capacity must be at least 1";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submitEvent = (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    if (editTarget) {
      updateEvent.mutate({ id: editTarget.id, patch: { ...form } }, {
        onSuccess: () => { toast.success("Event updated"); closeForm(); },
      });
    } else {
      addEvent.mutate({ ...form, capacity: Number(form.capacity) }, {
        onSuccess: () => { toast.success("Event created successfully"); closeForm(); },
      });
    }
  };

  const closeForm = () => { setFormOpen(false); setEditTarget(null); setForm(EMPTY_FORM); setErrors({}); };

  const openEdit = (event: CampusEvent) => {
    setEditTarget(event);
    setForm({ title: event.title, description: event.description, date: event.date, time: event.time, venue: event.venue, organizer: event.organizer, capacity: event.capacity, category: event.category });
    setErrors({});
    setFormOpen(true);
  };

  const handleRegister = (event: CampusEvent) => {
    const isRegistered = event.registeredUsers.includes(userId);
    if (isRegistered) {
      unregisterEvent.mutate({ eventId: event.id, userId }, {
        onSuccess: () => toast.success(`Unregistered from ${event.title}`),
      });
    } else {
      registerEvent.mutate({ eventId: event.id, userId }, {
        onSuccess: () => toast.success(`Registered for ${event.title}! Check your schedule.`),
      });
    }
  };

  const handleDelete = (id: string) => {
    deleteEvent.mutate(id, {
      onSuccess: () => { toast.success("Event deleted"); setDeleteConfirm(null); if (detailView?.id === id) setDetailView(null); },
    });
  };

  const exportCSV = () => {
    const rows = [["ID", "Title", "Category", "Date", "Time", "Venue", "Organizer", "Registrations", "Capacity", "Status"]];
    events.forEach(e => rows.push([e.id, e.title, e.category, e.date, e.time, e.venue, e.organizer, String(e.registrations), String(e.capacity), e.status]));
    const csv = rows.map(r => r.join(",")).join("\n");
    const a = document.createElement("a");
    a.href = "data:text/csv," + encodeURIComponent(csv);
    a.download = "events.csv";
    a.click();
    toast.success("Events exported to CSV");
  };

  return (
    <div className="space-y-6 pb-10">
      <PageHeader
        eyebrow="Event Operations"
        title="Event Operations Center"
        description={`${events.length} scheduled events · registration and venue management`}
        actions={
          <div className="flex gap-2">
            <button onClick={exportCSV} className="btn-secondary px-4 py-2 text-sm rounded-lg">Export CSV</button>
            <button onClick={() => { setEditTarget(null); setForm(EMPTY_FORM); setErrors({}); setFormOpen(true); }}
              className="btn-primary px-4 py-2 text-sm flex items-center gap-2 rounded-lg">
              <Plus className="h-4 w-4" /> Create Event
            </button>
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <MetricTile label="Total Events" value={<AnimatedNumber value={events.length} />} icon={Calendar} variant="primary" delay={0} />
        <MetricTile label="Registrations" value={<AnimatedNumber value={totalReg} />} icon={Users} variant="default" delay={0.05} />
        <MetricTile label="Capacity Filled" value={<AnimatedNumber value={Math.round((totalReg / Math.max(totalCap, 1)) * 100)} suffix="%" />} icon={Zap} variant="warning" delay={0.1} />
        <MetricTile label="Full Events" value={<AnimatedNumber value={events.filter(e => e.status === "Full").length} />} icon={Clock} variant="danger" delay={0.15} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <WorkspacePanel
            title="Event Timeline"
            description={`${filtered.length} events`}
            icon={Calendar}
            actions={
              <div className="flex gap-1 flex-wrap">
                {statuses.map(s => (
                  <button key={s} onClick={() => setFilter(s)}
                    className={cn("rounded-md px-2.5 py-1 text-xs font-medium transition-colors", filter === s ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted")}>
                    {s}
                  </button>
                ))}
              </div>
            }
            delay={0.2}
          >
            <div className="mb-3 flex gap-2">
              <input type="text" placeholder="Search events…" value={search} onChange={e => setSearch(e.target.value)} className="flex-1 input-warm px-3 py-2 text-sm" />
              <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="input-warm px-2 py-2 text-sm">
                {categoryOptions.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="space-y-3">
              {filtered.length === 0 && <div className="py-8 text-center text-muted-foreground text-sm">No events match your filters.</div>}
              {filtered.map(event => {
                const fillPct = Math.round((event.registrations / Math.max(event.capacity, 1)) * 100);
                const isFull = event.status === "Full";
                const isRegistered = event.registeredUsers.includes(userId);
                return (
                  <div key={event.id} className="rounded-lg border border-border p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium text-foreground">{event.title}</p>
                          <StatusBadge variant="info">{event.category}</StatusBadge>
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{event.date}</span>
                          <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{event.time}</span>
                          <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{event.venue}</span>
                        </div>
                        {event.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{event.description}</p>}
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <StatusBadge variant={isFull ? "danger" : event.status === "Cancelled" ? "neutral" : "success"}>{event.status}</StatusBadge>
                        <div className="flex gap-1 mt-1">
                          <button onClick={() => openEdit(event)} className="btn-ghost p-1 rounded text-muted-foreground hover:text-foreground" title="Edit"><Edit2 className="h-3.5 w-3.5" /></button>
                          <button onClick={() => setDetailView(event)} className="btn-ghost p-1 rounded text-muted-foreground hover:text-foreground" title="View details"><Users className="h-3.5 w-3.5" /></button>
                          <button onClick={() => setDeleteConfirm(event.id)} className="btn-ghost p-1 rounded text-destructive hover:text-destructive" title="Delete"><Trash2 className="h-3.5 w-3.5" /></button>
                        </div>
                      </div>
                    </div>
                    <div className="mt-3">
                      <div className="flex justify-between text-xs text-muted-foreground mb-1">
                        <span>{event.registrations} / {event.capacity} registered</span>
                        <span className="font-medium tabular-nums">{fillPct}%</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: `${fillPct}%`, background: isFull ? "hsl(var(--destructive))" : "hsl(var(--primary))" }} />
                      </div>
                    </div>
                    <div className="mt-3 flex gap-2">
                      {!isFull && event.status === "Open" ? (
                        <button onClick={() => handleRegister(event)}
                          className={cn("flex-1 py-2 text-xs rounded-lg flex items-center justify-center gap-1 transition-all", isRegistered ? "btn-secondary text-emerald-600 border-emerald-200" : "btn-primary")}>
                          {isRegistered ? <><CheckCircle className="h-3.5 w-3.5" /> Registered — Cancel</> : "Register Now"}
                        </button>
                      ) : (
                        <div className="flex-1 py-2 text-xs text-center text-muted-foreground rounded-lg border border-border">{event.status === "Full" ? "Event Full — Waitlist Closed" : event.status}</div>
                      )}
                      <button onClick={() => setDetailView(event)} className="btn-secondary px-3 py-2 text-xs rounded-lg">Details</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </WorkspacePanel>
        </div>

        <WorkspacePanel title="Venue Usage" description="Capacity by venue" icon={MapPin} delay={0.25}>
          <ul className="space-y-3">
            {[...new Set(events.map(e => e.venue))].map(venue => {
              const venueEvents = events.filter(e => e.venue === venue);
              const reg = venueEvents.reduce((a, e) => a + e.registrations, 0);
              const cap = venueEvents.reduce((a, e) => a + e.capacity, 0);
              const pct = Math.round((reg / Math.max(cap, 1)) * 100);
              return (
                <li key={venue} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-foreground">{venue}</span>
                    <span className="text-xs font-medium text-muted-foreground tabular-nums">{reg}/{cap}</span>
                  </div>
                  <div className="h-1 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </li>
              );
            })}
          </ul>
        </WorkspacePanel>
      </div>

      {/* Create / Edit Modal */}
      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 backdrop-blur-sm" onClick={closeForm}>
          <form onSubmit={submitEvent} onClick={e => e.stopPropagation()} className="workspace-panel w-full max-w-lg p-6 space-y-4 m-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">{editTarget ? "Edit Event" : "Create Event"}</h2>
              <button type="button" onClick={closeForm} className="p-1 text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 space-y-1.5">
                <label className="section-label">Event Title *</label>
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required placeholder="Event name…"
                  className={cn("w-full input-warm px-3 py-2.5 text-sm", errors.title && "border-destructive")} />
                {errors.title && <p className="text-xs text-destructive">{errors.title}</p>}
              </div>
              <div className="space-y-1.5">
                <label className="section-label">Date *</label>
                <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                  className={cn("w-full input-warm px-3 py-2.5 text-sm", errors.date && "border-destructive")} />
                {errors.date && <p className="text-xs text-destructive">{errors.date}</p>}
              </div>
              <div className="space-y-1.5">
                <label className="section-label">Time</label>
                <input value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))} placeholder="09:00 AM" className="w-full input-warm px-3 py-2.5 text-sm" />
              </div>
              <div className="space-y-1.5">
                <label className="section-label">Venue</label>
                <select value={form.venue} onChange={e => setForm(f => ({ ...f, venue: e.target.value }))} className="w-full input-warm px-3 py-2.5 text-sm">
                  {VENUES.map(v => <option key={v}>{v}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="section-label">Category</label>
                <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className="w-full input-warm px-3 py-2.5 text-sm">
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="section-label">Organizer *</label>
                <input value={form.organizer} onChange={e => setForm(f => ({ ...f, organizer: e.target.value }))} placeholder="Organizing dept…"
                  className={cn("w-full input-warm px-3 py-2.5 text-sm", errors.organizer && "border-destructive")} />
                {errors.organizer && <p className="text-xs text-destructive">{errors.organizer}</p>}
              </div>
              <div className="space-y-1.5">
                <label className="section-label">Capacity *</label>
                <input type="number" min={1} value={form.capacity} onChange={e => setForm(f => ({ ...f, capacity: Number(e.target.value) }))}
                  className={cn("w-full input-warm px-3 py-2.5 text-sm", errors.capacity && "border-destructive")} />
                {errors.capacity && <p className="text-xs text-destructive">{errors.capacity}</p>}
              </div>
              <div className="col-span-2 space-y-1.5">
                <label className="section-label">Description</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3}
                  placeholder="Event details…" className="w-full input-warm px-3 py-2.5 text-sm resize-none" />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={closeForm} className="btn-secondary flex-1 py-2.5 text-sm rounded-lg">Cancel</button>
              <button type="submit" disabled={addEvent.isPending || updateEvent.isPending} className="btn-primary flex-1 py-2.5 text-sm rounded-lg">
                {addEvent.isPending || updateEvent.isPending ? "Saving…" : editTarget ? "Update Event" : "Create Event"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Detail View Modal */}
      {detailView && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 backdrop-blur-sm" onClick={() => setDetailView(null)}>
          <div className="workspace-panel w-full max-w-md p-6 space-y-4 m-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold text-foreground">{detailView.title}</h2>
                <p className="text-xs text-muted-foreground mt-0.5">{detailView.id} · {detailView.category}</p>
              </div>
              <button onClick={() => setDetailView(null)} className="p-1 text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Date & Time</span><span>{detailView.date} · {detailView.time}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Venue</span><span>{detailView.venue}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Organizer</span><span>{detailView.organizer}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Status</span><StatusBadge variant={detailView.status === "Full" ? "danger" : "success"}>{detailView.status}</StatusBadge></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Registrations</span><span>{detailView.registrations} / {detailView.capacity}</span></div>
            </div>
            {detailView.description && <p className="text-sm text-muted-foreground border-t border-border pt-3">{detailView.description}</p>}
            <div className="flex gap-3 pt-2">
              <button onClick={() => setDetailView(null)} className="btn-secondary flex-1 py-2 text-sm rounded-lg">Close</button>
              {detailView.status === "Open" && (
                <button onClick={() => { handleRegister(detailView); setDetailView(null); }}
                  className={cn("flex-1 py-2 text-sm rounded-lg", detailView.registeredUsers.includes(userId) ? "btn-secondary text-emerald-600" : "btn-primary")}>
                  {detailView.registeredUsers.includes(userId) ? "Cancel Registration" : "Register"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 backdrop-blur-sm">
          <div className="workspace-panel w-full max-w-sm p-6 m-4 space-y-4">
            <h2 className="text-lg font-semibold text-foreground">Delete Event?</h2>
            <p className="text-sm text-muted-foreground">This will permanently delete the event and cancel all registrations.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="btn-secondary flex-1 py-2.5 text-sm rounded-lg">Cancel</button>
              <button onClick={() => handleDelete(deleteConfirm)} className="flex-1 py-2.5 text-sm rounded-lg bg-destructive text-destructive-foreground font-medium">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
