import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCanteenAuth } from "@/context/CanteenAuthContext";
import { UtensilsCrossed, Lock, Eye, EyeOff, ChefHat } from "lucide-react";

const QUICK_LOGINS = [
  { label: "Canteen Staff", staffId: "CANTEEN001", password: "canteen@123" },
  { label: "Canteen Manager", staffId: "CANTEEN_MGR", password: "manager@123" },
];

export default function CanteenLoginPage() {
  const { login } = useCanteenAuth();
  const navigate = useNavigate();

  const [staffId, setStaffId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(false);
    // Simulate brief async delay for UX
    setTimeout(() => {
      const success = login(staffId, password);
      if (success) {
        navigate("/canteen-staff/dashboard", { replace: true });
      } else {
        setError(true);
        setLoading(false);
      }
    }, 400);
  }

  function handleQuickLogin(id: string, pwd: string) {
    setLoading(true);
    setError(false);
    setTimeout(() => {
      const success = login(id, pwd);
      if (success) {
        navigate("/canteen-staff/dashboard", { replace: true });
      } else {
        setError(true);
        setLoading(false);
      }
    }, 300);
  }

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left brand panel */}
      <div
        className="hidden lg:flex lg:w-[42%] flex-col"
        style={{
          background: "linear-gradient(160deg, hsl(25 60% 10%) 0%, hsl(28 55% 16%) 55%, hsl(30 45% 20%) 100%)",
        }}
      >
        <div className="px-10 pt-10 pb-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500">
              <UtensilsCrossed className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-base font-bold text-white leading-none">CampusIQ</p>
              <p className="text-[11px] mt-0.5" style={{ color: "hsl(30 30% 55%)" }}>Canteen Operations Portal</p>
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col justify-center px-10">
          <ChefHat className="h-16 w-16 text-amber-500/30 mb-6" />
          <h2 className="text-3xl font-bold text-white leading-tight mb-3" style={{ letterSpacing: "-0.025em" }}>
            Canteen Staff<br />Operations Portal
          </h2>
          <p className="text-sm leading-relaxed mb-10" style={{ color: "hsl(30 20% 55%)" }}>
            Manage incoming student orders, track preparation status, and keep the menu up to date — all from one place.
          </p>

          <div className="space-y-3">
            {[
              { title: "Live Order Queue", desc: "See and process student orders in real time" },
              { title: "Status Updates", desc: "Accept → Prepare → Mark Ready → Complete" },
              { title: "Menu Management", desc: "Add items, set prices, toggle availability" },
            ].map(item => (
              <div
                key={item.title}
                className="rounded-xl px-4 py-3"
                style={{ background: "hsl(28 45% 13%)", border: "1px solid hsl(28 35% 18%)" }}
              >
                <p className="text-sm font-semibold text-white">{item.title}</p>
                <p className="text-xs mt-0.5" style={{ color: "hsl(30 20% 52%)" }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div
          className="px-10 py-6"
          style={{ borderTop: "1px solid hsl(28 35% 15%)" }}
        >
          <p className="text-[10px]" style={{ color: "hsl(30 20% 38%)" }}>
            © 2026 CampusIQ Platform · Canteen Management System
          </p>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-10 lg:px-12">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center justify-center gap-2 mb-8">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500">
              <UtensilsCrossed className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-base font-bold text-foreground leading-none">CampusIQ</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Canteen Portal</p>
            </div>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Staff Login</h1>
            <p className="text-sm text-muted-foreground mt-1.5">Sign in to the canteen operations dashboard</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Staff ID</label>
              <input
                type="text"
                placeholder="e.g. CANTEEN001 or CANTEEN_MGR"
                value={staffId}
                onChange={e => { setStaffId(e.target.value); setError(false); }}
                required
                className="input-warm w-full px-3 py-2.5 text-sm rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError(false); }}
                  required
                  className="input-warm w-full px-3 py-2.5 text-sm rounded-lg pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
                <Lock className="h-4 w-4 shrink-0" />
                Invalid Staff ID or password.
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-2.5 rounded-lg text-sm font-semibold disabled:opacity-60 mt-1"
              style={{ background: "hsl(33 95% 50%)", borderColor: "hsl(33 95% 50%)" }}
            >
              {loading ? "Signing in…" : "Sign In"}
            </button>
          </form>

          {/* Quick login */}
          <div className="mt-6">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Quick Login</p>
            <div className="space-y-2">
              {QUICK_LOGINS.map(q => (
                <button
                  key={q.staffId}
                  onClick={() => handleQuickLogin(q.staffId, q.password)}
                  disabled={loading}
                  className="w-full flex items-center justify-between rounded-lg border border-border bg-surface px-4 py-3 text-sm hover:border-amber-300 hover:bg-amber-50/50 transition-colors disabled:opacity-50"
                >
                  <div className="text-left">
                    <p className="font-medium text-foreground">{q.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">ID: {q.staffId}</p>
                  </div>
                  <span className="text-xs text-muted-foreground font-mono bg-muted rounded px-2 py-0.5">
                    Click to login
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Credentials reference */}
          <div className="mt-5 rounded-lg border border-border bg-muted/40 p-4 space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Login Credentials</p>
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Staff 1</span>
                <span className="font-mono text-foreground">CANTEEN001 / canteen@123</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Staff 2</span>
                <span className="font-mono text-foreground">CANTEEN002 / canteen@123</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Manager</span>
                <span className="font-mono text-foreground">CANTEEN_MGR / manager@123</span>
              </div>
            </div>
          </div>

          <p className="text-center text-[10px] text-muted-foreground mt-6">
            This portal is for canteen staff only.{" "}
            <a href="/auth/login" className="text-primary hover:underline">CampusIQ main portal →</a>
          </p>
        </div>
      </div>
    </div>
  );
}
