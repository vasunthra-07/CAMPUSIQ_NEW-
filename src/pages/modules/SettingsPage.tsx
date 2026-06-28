import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useUserSettings, useSaveSettings } from "@/hooks/useCampusData";
import { fadeUpStyle } from "@/lib/motion";
import { Settings, User, Bell, Shield, Moon, Save, CheckCircle, Eye, EyeOff, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { UserSettings } from "@/services/campusStore";

export default function SettingsPage() {
  const { user } = useAuth();
  const userId = user?.userId ?? "guest";
  const userName = user?.name ?? "User";
  const { data: savedSettings, isLoading } = useUserSettings(userId, userName);
  const saveSettings = useSaveSettings();

  const [form, setForm] = useState<UserSettings | null>(null);
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [pwErrors, setPwErrors] = useState<{ current?: string; new?: string; confirm?: string }>({});
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (savedSettings && !form) setForm(savedSettings);
  }, [savedSettings]);

  if (isLoading || !form) {
    return (
      <div className="space-y-6 max-w-3xl mx-auto pb-10">
        <div className="h-12 w-48 rounded-lg bg-muted animate-pulse" />
        {[0, 1, 2, 3].map(i => <div key={i} className="h-40 rounded-xl bg-muted animate-pulse" />)}
      </div>
    );
  }

  const updateForm = (patch: Partial<UserSettings>) => { setForm(f => f ? { ...f, ...patch } : null); setSaved(false); };
  const updateNotif = (key: keyof UserSettings["notifications"], value: boolean) => {
    setForm(f => f ? { ...f, notifications: { ...f.notifications, [key]: value } } : null);
    setSaved(false);
  };

  const validateAndSave = () => {
    if (!form) return;
    if (!form.displayName.trim()) { toast.error("Display name cannot be empty"); return; }
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) { toast.error("Invalid email format"); return; }
    saveSettings.mutate({ userId, settings: form }, {
      onSuccess: () => { toast.success("Settings saved successfully!"); setSaved(true); },
      onError: () => toast.error("Failed to save settings"),
    });
  };

  const changePassword = () => {
    const e: typeof pwErrors = {};
    if (!currentPw) e.current = "Current password is required";
    if (!newPw || newPw.length < 8) e.new = "New password must be at least 8 characters";
    if (newPw !== confirmPw) e.confirm = "Passwords do not match";
    setPwErrors(e);
    if (Object.keys(e).length > 0) return;
    toast.success("Password updated successfully!");
    setCurrentPw(""); setNewPw(""); setConfirmPw(""); setPwErrors({});
  };

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
          <div className="h-16 w-16 rounded-2xl gradient-maroon flex items-center justify-center text-2xl font-bold text-accent border-2 border-accent/20 select-none">
            {userName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
          </div>
          <div>
            <p className="text-lg font-bold font-syne text-foreground">{userName}</p>
            <p className="text-sm text-muted-foreground">{user?.role} · ID: {userId}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="section-label block mb-1.5">Display Name *</label>
            <input className="w-full input-warm px-3 py-2.5 text-sm" value={form.displayName} onChange={e => updateForm({ displayName: e.target.value })} placeholder="Your name" />
          </div>
          <div>
            <label className="section-label block mb-1.5">Role</label>
            <input className="w-full input-warm px-3 py-2.5 text-sm opacity-60 cursor-not-allowed" value={user?.role ?? ""} readOnly title="Role cannot be changed here" />
          </div>
          <div className="col-span-2">
            <label className="section-label block mb-1.5">Email</label>
            <input className="w-full input-warm px-3 py-2.5 text-sm" type="email" value={form.email} onChange={e => updateForm({ email: e.target.value })} placeholder="your@email.com" />
          </div>
          <div className="col-span-2">
            <label className="section-label block mb-1.5">Language</label>
            <select className="w-full input-warm px-3 py-2.5 text-sm" value={form.language} onChange={e => updateForm({ language: e.target.value })}>
              {["English", "Tamil", "Hindi", "Telugu", "Kannada"].map(l => <option key={l}>{l}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="card-warm p-6" style={fadeUpStyle(2)}>
        <h3 className="text-sm font-bold font-syne mb-4 flex items-center gap-2"><Bell className="h-4 w-4 text-accent" />Notifications</h3>
        <div className="space-y-4">
          {[
            { key: "email" as const, label: "Email Notifications", desc: "Receive updates and alerts via email" },
            { key: "push" as const, label: "Push Notifications", desc: "Browser push alerts for real-time updates" },
            { key: "riskAlerts" as const, label: "Risk Alerts", desc: "Immediate alerts for critical student situations" },
            { key: "weeklyReport" as const, label: "Weekly Reports", desc: "Digest summary every Monday morning" },
            { key: "eventReminders" as const, label: "Event Reminders", desc: "Reminders 24h before registered events" },
          ].map(item => (
            <div key={item.key} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
              <div>
                <p className="text-sm font-medium text-foreground">{item.label}</p>
                <p className="text-[11px] text-muted-foreground">{item.desc}</p>
              </div>
              <button onClick={() => updateNotif(item.key, !form.notifications[item.key])}
                className={cn("relative inline-flex h-6 w-11 rounded-full transition-colors border shrink-0", form.notifications[item.key] ? "bg-accent/20 border-accent/40" : "bg-surface border-border/50")}>
                <span className={cn("absolute top-0.5 h-5 w-5 rounded-full border transition-transform", form.notifications[item.key] ? "translate-x-5 border-accent bg-accent" : "translate-x-0.5 border-border bg-surface-hover")} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Appearance */}
      <div className="card-warm p-6" style={fadeUpStyle(3)}>
        <h3 className="text-sm font-bold font-syne mb-4 flex items-center gap-2"><Moon className="h-4 w-4 text-accent" />Appearance</h3>
        <div className="flex gap-3">
          {[
            { value: "dark", label: "🌙 Dark" },
            { value: "system", label: "💻 System" },
          ].map(t => (
            <button key={t.value} onClick={() => updateForm({ theme: t.value })}
              className={cn("flex-1 py-3 rounded-xl border text-sm font-medium capitalize transition-all", form.theme === t.value ? "border-accent/40 bg-accent/10 text-accent" : "border-border/50 btn-ghost")}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Security */}
      <div className="card-warm p-6" style={fadeUpStyle(4)}>
        <h3 className="text-sm font-bold font-syne mb-4 flex items-center gap-2"><Shield className="h-4 w-4 text-accent" />Security</h3>
        <div className="space-y-3">
          <div>
            <label className="section-label block mb-1.5">Current Password</label>
            <div className="relative">
              <input type={showPw ? "text" : "password"} value={currentPw} onChange={e => { setCurrentPw(e.target.value); setPwErrors({}); }}
                className={cn("w-full input-warm px-3 py-2.5 text-sm pr-10", pwErrors.current && "border-destructive")} placeholder="••••••••" />
              <button type="button" onClick={() => setShowPw(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {pwErrors.current && <p className="text-xs text-destructive mt-1">{pwErrors.current}</p>}
          </div>
          <div>
            <label className="section-label block mb-1.5">New Password</label>
            <input type={showPw ? "text" : "password"} value={newPw} onChange={e => { setNewPw(e.target.value); setPwErrors({}); }}
              className={cn("w-full input-warm px-3 py-2.5 text-sm", pwErrors.new && "border-destructive")} placeholder="Min 8 characters" />
            {pwErrors.new && <p className="text-xs text-destructive mt-1">{pwErrors.new}</p>}
          </div>
          <div>
            <label className="section-label block mb-1.5">Confirm New Password</label>
            <input type={showPw ? "text" : "password"} value={confirmPw} onChange={e => { setConfirmPw(e.target.value); setPwErrors({}); }}
              className={cn("w-full input-warm px-3 py-2.5 text-sm", pwErrors.confirm && "border-destructive")} placeholder="Repeat new password" />
            {pwErrors.confirm && <p className="text-xs text-destructive mt-1">{pwErrors.confirm}</p>}
          </div>
          <button onClick={changePassword} className="btn-secondary px-4 py-2.5 text-sm rounded-lg">Update Password</button>
        </div>
      </div>

      <button onClick={validateAndSave} disabled={saveSettings.isPending}
        className="w-full btn-primary py-3 font-bold text-sm rounded-xl flex items-center justify-center gap-2" style={fadeUpStyle(5)}>
        {saveSettings.isPending ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</> : saved ? <><CheckCircle className="h-4 w-4" /> Settings Saved</> : <><Save className="h-4 w-4" /> Save All Settings</>}
      </button>
    </div>
  );
}
