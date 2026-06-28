import { useState } from "react";
import { fadeUpStyle } from "@/lib/motion";
import { AnimatedNumber } from "@/components/motion/AnimatedNumber";
import { ShieldAlert, Phone, MapPin, AlertTriangle, CheckCircle, Flame, Activity, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

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

export default function SafetyEmergency() {
  const [drillMode, setDrillMode] = useState(false);

  const triggerDrill = () => {
    setDrillMode(true);
    toast.warning("🚨 Emergency Drill Mode Activated — This is a drill");
    setTimeout(() => { setDrillMode(false); toast.success("Drill completed. All clear."); }, 5000);
  };

  const activeAlerts = SAFETY_ZONES.filter(z => z.status === "Alert").length;
  const totalCameras = SAFETY_ZONES.reduce((a, z) => a + z.cameras, 0);

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-10">
      <div style={fadeUpStyle(0)} className="border-b border-border/50 pb-6 flex items-end justify-between">
        <div>
          <p className="section-label mb-1">Campus Safety</p>
          <h1 className="text-3xl font-bold font-syne tracking-tight" style={{ color: drillMode ? "hsl(0 84% 60%)" : undefined }}>
            {drillMode ? "⚠️ EMERGENCY DRILL ACTIVE" : "Safety & Emergency Center"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">24/7 surveillance · Incident response · Emergency protocols</p>
        </div>
        <button onClick={triggerDrill} disabled={drillMode}
          className={cn("px-4 py-2.5 text-sm font-bold flex items-center gap-2 rounded-xl border transition-all", drillMode ? "border-red-500/60 text-red-400 bg-red-500/20 animate-pulse" : "border-red-500/40 text-red-400 bg-red-500/10 hover:bg-red-500/20")}>
          <Zap className="h-4 w-4" /> {drillMode ? "Drill Running…" : "Run Safety Drill"}
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4" style={fadeUpStyle(1)}>
        {[
          { label: "Active Alerts", value: activeAlerts, icon: AlertTriangle, color: activeAlerts > 0 ? "text-red-400" : "text-emerald-400" },
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
              <div>
                <p className="text-sm font-semibold text-foreground">{zone.zone}</p>
                <p className="text-[10px] text-muted-foreground">{zone.cameras} cameras · {zone.status === "Alert" ? <span className="text-red-400 font-bold">{zone.activeAlerts} alert</span> : "All clear"}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Emergency Contacts */}
      <div className="card-warm p-6" style={fadeUpStyle(3)}>
        <h3 className="text-sm font-bold font-syne mb-4 flex items-center gap-2">
          <Phone className="h-4 w-4 text-accent" /> Emergency Contacts
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {EMERGENCY_CONTACTS.map((c, i) => (
            <a key={c.role} href={`tel:${c.number.replace(/[^0-9]/g, '')}`}
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
    </div>
  );
}
