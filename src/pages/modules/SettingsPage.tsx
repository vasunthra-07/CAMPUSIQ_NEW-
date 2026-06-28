import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { fadeUpStyle } from "@/lib/motion";
import { Settings, User, Bell, Shield, Moon, Globe, Save } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function SettingsPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState({ email: true, push: true, riskAlerts: true, weeklyReport: false });
  const [theme, setTheme] = useState("light");

  const save = () => toast.success("Settings saved!");

  return (
    <div className="space-y-8 max-w-3xl mx-auto pb-10">
      <div style={fadeUpStyle(0)} className="border-b border-border/50 pb-6">
        <p className="section-label mb-1">Preferences</p>
        <h1 className="text-3xl font-bold font-syne gradient-text-gold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your account, notifications, and platform preferences</p>
      </div>

      {/* Profile */}
      <div className="card-warm p-6" style={fadeUpStyle(1)}>
        <h3 className="text-sm font-bold font-syne mb-4 flex items-center gap-2"><User className="h-4 w-4 text-accent" />Profile</h3>
        <div className="flex items-center gap-4 mb-5">
          <div className="h-16 w-16 rounded-2xl gradient-maroon flex items-center justify-center text-2xl font-bold text-accent border-2 border-accent/20">
            {user?.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
          </div>
          <div>
            <p className="text-lg font-bold font-syne text-foreground">{user?.name}</p>
            <p className="text-sm text-muted-foreground">{user?.role} · ID: {user?.userId}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="section-label block mb-1.5">Display Name</label><input className="w-full input-warm px-3 py-2.5 text-sm" defaultValue={user?.name} /></div>
          <div><label className="section-label block mb-1.5">Role</label><input className="w-full input-warm px-3 py-2.5 text-sm opacity-60" value={user?.role} readOnly /></div>
          <div className="col-span-2"><label className="section-label block mb-1.5">Email</label><input className="w-full input-warm px-3 py-2.5 text-sm" defaultValue={`${user?.userId?.toLowerCase()}@campusiq.edu`} /></div>
        </div>
      </div>

      {/* Notifications */}
      <div className="card-warm p-6" style={fadeUpStyle(2)}>
        <h3 className="text-sm font-bold font-syne mb-4 flex items-center gap-2"><Bell className="h-4 w-4 text-accent" />Notifications</h3>
        <div className="space-y-4">
          {[
            { key: "email", label: "Email Notifications", desc: "Receive updates via email" },
            { key: "push", label: "Push Notifications", desc: "Browser push alerts" },
            { key: "riskAlerts", label: "Risk Alerts", desc: "Immediate alerts for critical students" },
            { key: "weeklyReport", label: "Weekly Reports", desc: "Digest summary every Monday" },
          ].map(item => (
            <div key={item.key} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
              <div>
                <p className="text-sm font-medium text-foreground">{item.label}</p>
                <p className="text-[11px] text-muted-foreground">{item.desc}</p>
              </div>
              <button onClick={() => setNotifications(prev => ({ ...prev, [item.key]: !prev[item.key as keyof typeof prev] }))}
                className={cn("relative inline-flex h-6 w-11 rounded-full transition-colors border", notifications[item.key as keyof typeof notifications] ? "bg-accent/20 border-accent/40" : "bg-surface border-border/50")}>
                <span className={cn("absolute top-0.5 h-5 w-5 rounded-full border transition-transform", notifications[item.key as keyof typeof notifications] ? "translate-x-5 border-accent bg-accent" : "translate-x-0.5 border-border bg-surface-hover")} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Appearance */}
      <div className="card-warm p-6" style={fadeUpStyle(3)}>
        <h3 className="text-sm font-bold font-syne mb-4 flex items-center gap-2"><Moon className="h-4 w-4 text-accent" />Appearance</h3>
        <div className="flex gap-3">
          {["dark", "system"].map(t => (
            <button key={t} onClick={() => setTheme(t)}
              className={cn("flex-1 py-3 rounded-xl border text-sm font-medium capitalize transition-all", theme === t ? "border-accent/40 bg-accent/10 text-accent" : "border-border/50 btn-ghost")}>
              {t === "dark" ? "🌙 Dark" : "💻 System"}
            </button>
          ))}
        </div>
      </div>

      {/* Security */}
      <div className="card-warm p-6" style={fadeUpStyle(4)}>
        <h3 className="text-sm font-bold font-syne mb-4 flex items-center gap-2"><Shield className="h-4 w-4 text-accent" />Security</h3>
        <div className="space-y-3">
          <div><label className="section-label block mb-1.5">Current Password</label><input type="password" className="w-full input-warm px-3 py-2.5 text-sm" placeholder="••••••••" /></div>
          <div><label className="section-label block mb-1.5">New Password</label><input type="password" className="w-full input-warm px-3 py-2.5 text-sm" placeholder="••••••••" /></div>
        </div>
      </div>

      <button onClick={save} className="w-full btn-primary py-3 font-bold text-sm rounded-xl flex items-center justify-center gap-2" style={fadeUpStyle(5)}>
        <Save className="h-4 w-4" /> Save All Settings
      </button>
    </div>
  );
}
