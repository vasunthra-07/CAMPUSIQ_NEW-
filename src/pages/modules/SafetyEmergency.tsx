import { useState } from "react";
import { useSafetyIncidents, useReportIncident, useUpdateIncident } from "@/hooks/useCampusData";
import { useAuth } from "@/context/AuthContext";
import { fadeUpStyle } from "@/lib/motion";
import { AnimatedNumber } from "@/components/motion/AnimatedNumber";
import { ShieldAlert, Phone, MapPin, AlertTriangle, CheckCircle, Flame, Activity, Zap, Plus, X, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { SafetyIncident } from "@/services/campusStore";

const SAFETY_ZONES = [
  { zone: "Main Block", status: "Safe", cameras: 12, activeAlerts: 0 },
  { zone: "Hostel Block A", status: "Safe", cameras: 8, activeAlerts: 0 },
  { zone: "Hostel Block B", status: "Alert", cameras: 8, activeAlerts: 1 },
  { zone: "Lab Complex", status: "Safe", cameras: 16, activeAlerts: 0 },
  { zone: "Sports Ground", status: "Safe", cameras: 4, activeAlerts: 0 },
  { zone: "Admin Block", status: "Safe", cameras: 6, activeAlerts: 0 },
];

const EMERGENCY_CONTACTS = [
  { role: "Campus Security", number: "044-2690-0100", available: true },
  { role: "Medical Center", number: "044-2690-0200", available: true },
  { role: "Fire Station", number: "101", available: true },
  { role: "Police Outpost", number: "100", available: true },
  { role: "Warden (Boys)", number: "98400-00001", available: true },
  { role: "Warden (Girls)", number: "98400-00002", available: true },
];

const INCIDENT_TYPES: SafetyIncident["type"][] = ["Accident", "Fire", "Medical", "Security", "Infrastructure", "Other"];
const LOCATIONS = SAFETY_ZONES.map(z => z.zone);
const SEVERITY_STYLES = {
  Low: "border-blue-500/40 text-blue-400 bg-blue-500/10",
  Medium: "border-yellow-500/40 text-yellow-400 bg-yellow-500/10",
  High: "border-orange-500/40 text-orange-400 bg-orange-500/10",
  Critical: "border-red-500/40 text-red-400 bg-red-500/10",
};

const EMPTY_FORM = { type: "Accident" as SafetyIncident["type"], description: "", location: LOCATIONS[0], severity: "Medium" as SafetyIncident["severity"] };

export default function SafetyEmergency() {
  const { user } = useAuth();
  const { data: incidents, isLoading } = useSafetyIncidents();
  const reportIncident = useReportIncident();
  const updateIncident = useUpdateIncident();

  const [drillMode, setDrillMode] = useState(false);
  const [drillCountdown, setDrillCountdown] = useState(0);
  const [reportOpen, setReportOpen] = useState(false);
  const [sosActive, setSosActive] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<typeof EMPTY_FORM>>({});

  const activeAlerts = SAFETY_ZONES.filter(z => z.status === "Alert").length;
  const totalCameras = SAFETY_ZONES.reduce((a, z) => a + z.cameras, 0);

  const triggerDrill = () => {
    setDrillMode(true);
    setDrillCountdown(30);
    toast.warning("🚨 Emergency Drill Mode Activated — This is a DRILL. Not a real emergency.", { duration: 5000 });
    const interval = setInterval(() => {
      setDrillCountdown(prev => {
        if (prev <= 1) { clearInterval(interval); setDrillMode(false); toast.success("✅ Drill completed successfully. All clear."); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  const handleSOS = () => {
    setSosActive(true);
    toast.error("🆘 SOS ACTIVATED — Emergency services being notified. Security team dispatched.", { duration: 10000 });
    reportIncident.mutate({ type: "Security", description: "SOS activated from admin panel. Immediate response required.", location: "Campus Main", severity: "Critical", reportedBy: user?.name ?? "Admin" }, {
      onSuccess: () => toast.info("SOS incident logged. Reference ID generated."),
    });
    setTimeout(() => setSosActive(false), 10000);
  };

  const validate = () => {
    const e: Partial<typeof EMPTY_FORM> = {};
    if (!form.description.trim()) e.description = "Description is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submitIncident = (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    reportIncident.mutate({ ...form, reportedBy: user?.name ?? "Admin" }, {
      onSuccess: inc => {
        toast.success(`Incident ${inc.id} reported. Response team notified.`);
        setReportOpen(false);
        setForm(EMPTY_FORM);
        setErrors({});
      },
    });
  };

  const resolveIncident = (id: string) => {
    updateIncident.mutate({ id, patch: { status: "Resolved", resolvedAt: new Date().toISOString() } }, {
      onSuccess: () => toast.success("Incident marked as resolved"),
    });
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-10">
      {/* Header */}
      <div style={fadeUpStyle(0)} className="border-b border-border/50 pb-6">
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <p className="section-label mb-1">Campus Safety</p>
            <h1 className={cn("text-3xl font-bold font-syne tracking-tight transition-colors", drillMode ? "text-red-500" : sosActive ? "text-red-600 animate-pulse" : "")}>
              {sosActive ? "🆘 SOS ACTIVE — EMERGENCY" : drillMode ? `⚠️ DRILL ACTIVE (${drillCountdown}s)` : "Safety & Emergency Center"}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">24/7 surveillance · Incident response · Emergency protocols</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => setReportOpen(true)} className="px-4 py-2.5 text-sm font-medium flex items-center gap-2 rounded-xl border border-orange-500/40 text-orange-400 bg-orange-500/10 hover:bg-orange-500/20 transition-all">
              <Plus className="h-4 w-4" /> Report Incident
            </button>
            <button onClick={triggerDrill} disabled={drillMode}
              className={cn("px-4 py-2.5 text-sm font-bold flex items-center gap-2 rounded-xl border transition-all", drillMode ? "border-red-500/60 text-red-400 bg-red-500/20 animate-pulse" : "border-red-500/40 text-red-400 bg-red-500/10 hover:bg-red-500/20")}>
              <Zap className="h-4 w-4" /> {drillMode ? `Drill Running… ${drillCountdown}s` : "Run Safety Drill"}
            </button>
            <button onClick={handleSOS} disabled={sosActive}
              className={cn("px-4 py-2.5 text-sm font-black flex items-center gap-2 rounded-xl border-2 transition-all", sosActive ? "border-red-700 text-white bg-red-700 animate-pulse" : "border-red-600 text-red-600 hover:bg-red-600 hover:text-white")}>
              🆘 SOS
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4" style={fadeUpStyle(1)}>
        {[
          { label: "Active Alerts", value: activeAlerts + (incidents?.filter(i => i.status === "Reported" || i.status === "Responding").length ?? 0), icon: AlertTriangle, color: "text-red-400" },
          { label: "Safe Zones", value: SAFETY_ZONES.filter(z => z.status === "Safe").length, icon: CheckCircle, color: "text-emerald-400" },
          { label: "CCTV Cameras", value: totalCameras, icon: Activity, color: "text-blue-400" },
        ].map((s, i) => (
          <div key={s.label} className="card-warm p-5 text-center card-glow-hover" style={fadeUpStyle(i, 80)}>
            <s.icon className={cn("h-5 w-5 mx-auto mb-2", s.color)} />
            <p className="text-3xl font-bold font-mono gradient-text-gold"><AnimatedNumber value={s.value} /></p>
            <p className="text-[11px] text-muted-foreground mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Zone Status */}
      <div className="card-warm p-6" style={fadeUpStyle(2)}>
        <h3 className="text-sm font-bold font-syne mb-4 flex items-center gap-2">
          <MapPin className="h-4 w-4 text-accent" /> Campus Zone Status
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {SAFETY_ZONES.map((zone, i) => (
            <div key={zone.zone} className={cn("p-3 rounded-xl border flex items-center gap-3", zone.status === "Alert" ? "border-red-500/30 bg-red-500/10 animate-pulse" : "border-border/50 bg-surface/50")} style={fadeUpStyle(i, 60)}>
              {zone.status === "Alert" ? <Flame className="h-4 w-4 text-red-400 flex-shrink-0" /> : <ShieldAlert className="h-4 w-4 text-emerald-400 flex-shrink-0" />}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">{zone.zone}</p>
                <p className="text-[10px] text-muted-foreground">{zone.cameras} cameras · {zone.status === "Alert" ? <span className="text-red-400 font-bold">{zone.activeAlerts} alert</span> : "All clear"}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Incidents Log */}
      {!isLoading && incidents && (
        <div className="card-warm p-6" style={fadeUpStyle(3)}>
          <h3 className="text-sm font-bold font-syne mb-4 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-accent" /> Incident Log ({incidents.length})
          </h3>
          {incidents.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No incidents reported.</p>
          ) : (
            <div className="space-y-3">
              {incidents.map((inc, i) => (
                <div key={inc.id} style={fadeUpStyle(i, 40)} className={cn("p-4 rounded-xl border", inc.status === "Resolved" ? "border-emerald-500/20 bg-emerald-500/5" : inc.severity === "Critical" ? "border-red-500/30 bg-red-500/10" : "border-border/50")}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-foreground">{inc.type}</span>
                        <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border", SEVERITY_STYLES[inc.severity])}>{inc.severity}</span>
                        <span className={cn("text-[10px] font-medium px-2 py-0.5 rounded-full", inc.status === "Resolved" ? "text-emerald-400 bg-emerald-500/10" : inc.status === "Responding" ? "text-blue-400 bg-blue-500/10" : "text-orange-400 bg-orange-500/10")}>
                          {inc.status}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{inc.id} · {inc.location} · {new Date(inc.reportedAt).toLocaleString()}</p>
                      <p className="text-sm text-foreground mt-1">{inc.description}</p>
                      <p className="text-xs text-muted-foreground mt-1">Reported by: {inc.reportedBy}</p>
                    </div>
                    {inc.status !== "Resolved" && (
                      <button onClick={() => resolveIncident(inc.id)} className="btn-ghost p-1.5 rounded-lg text-emerald-500 hover:bg-emerald-500/10 shrink-0" title="Mark Resolved">
                        <CheckCircle className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Emergency Contacts */}
      <div className="card-warm p-6" style={fadeUpStyle(4)}>
        <h3 className="text-sm font-bold font-syne mb-4 flex items-center gap-2">
          <Phone className="h-4 w-4 text-accent" /> Emergency Contacts
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {EMERGENCY_CONTACTS.map((c, i) => (
            <a key={c.role} href={`tel:${c.number.replace(/[^0-9]/g, "")}`}
              className="flex items-center gap-3 p-3 rounded-xl border border-border/50 bg-surface/50 hover:border-accent/30 hover:bg-accent/5 transition-all cursor-pointer group" style={fadeUpStyle(i, 40)}>
              <div className="h-8 w-8 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center flex-shrink-0">
                <Phone className="h-3.5 w-3.5 text-accent" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground group-hover:text-accent transition-colors">{c.role}</p>
                <p className="text-[11px] text-muted-foreground font-mono">{c.number}</p>
              </div>
              <div className="ml-auto h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            </a>
          ))}
        </div>
      </div>

      {/* Report Incident Modal */}
      {reportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 backdrop-blur-sm" onClick={() => setReportOpen(false)}>
          <form onSubmit={submitIncident} onClick={e => e.stopPropagation()} className="workspace-panel w-full max-w-lg p-6 space-y-4 m-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-orange-400" /> Report Incident</h2>
              <button type="button" onClick={() => setReportOpen(false)} className="p-1 text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="section-label">Incident Type *</label>
                <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as SafetyIncident["type"] }))} className="w-full input-warm px-3 py-2.5 text-sm">
                  {INCIDENT_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="section-label">Severity *</label>
                <select value={form.severity} onChange={e => setForm(f => ({ ...f, severity: e.target.value as SafetyIncident["severity"] }))} className="w-full input-warm px-3 py-2.5 text-sm">
                  {["Low", "Medium", "High", "Critical"].map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div className="col-span-2 space-y-1.5">
                <label className="section-label">Location</label>
                <select value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} className="w-full input-warm px-3 py-2.5 text-sm">
                  {LOCATIONS.map(l => <option key={l}>{l}</option>)}
                </select>
              </div>
              <div className="col-span-2 space-y-1.5">
                <label className="section-label">Description *</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} required rows={4}
                  placeholder="Describe what happened…" className={cn("w-full input-warm px-3 py-2.5 text-sm resize-none", errors.description && "border-destructive")} />
                {errors.description && <p className="text-xs text-destructive">{errors.description}</p>}
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setReportOpen(false)} className="btn-secondary flex-1 py-2.5 text-sm rounded-lg">Cancel</button>
              <button type="submit" disabled={reportIncident.isPending} className="btn-primary flex-1 py-2.5 text-sm rounded-lg">
                {reportIncident.isPending ? "Reporting…" : "Submit Report"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
