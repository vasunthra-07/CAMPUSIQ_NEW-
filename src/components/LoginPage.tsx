import { useState } from "react";
import { Lock, GraduationCap, Building2, Calendar, Users, ShieldCheck, BookOpen } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { AuthInput } from "./auth/AuthInput";
import { AuthButton } from "./auth/AuthButton";
import { AuthCard } from "./auth/AuthCard";
import { RoleAccessCenter } from "./auth/RoleAccessCenter";
import { RoleWelcomeScreen } from "./auth/RoleWelcomeScreen";
import { DashboardEntryTransition } from "./auth/DashboardEntryTransition";
import { CampusIQLogo } from "./CampusIQLogo";

const PLATFORM_STATS = [
  { value: "2,847", label: "Active Students" },
  { value: "10", label: "Campus Modules" },
  { value: "94/100", label: "Health Score" },
  { value: "99.8%", label: "Uptime" },
];

const MODULE_HIGHLIGHTS = [
  { icon: GraduationCap, label: "Student Hub" },
  { icon: Building2, label: "Resources" },
  { icon: Calendar, label: "Events" },
  { icon: Users, label: "Communications" },
  { icon: ShieldCheck, label: "Safety" },
  { icon: BookOpen, label: "Library" },
];

export default function LoginPage() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loginStep, setLoginStep] = useState<"form" | "welcome" | "dashboard">("form");

  const handleLoginSuccess = async () => {
    setLoginStep("welcome");
    setTimeout(() => {
      setLoginStep("dashboard");
      setTimeout(() => navigate("/app", { replace: true }), 1800);
    }, 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(false);
    const success = await login(userId, password);
    if (!success) {
      setError(true);
      setLoading(false);
    } else {
      handleLoginSuccess();
    }
  };

  const handleQuickLogin = async (id: string, pwd: string) => {
    setUserId(id);
    setPassword(pwd);
    setLoading(true);
    setError(false);
    const success = await login(id, pwd);
    if (success) handleLoginSuccess();
    else {
      setError(true);
      setLoading(false);
    }
  };

  if (loginStep === "welcome") return user ? <RoleWelcomeScreen user={user} /> : null;
  if (loginStep === "dashboard") return user ? <DashboardEntryTransition user={user} /> : null;

  return (
    <div className="min-h-screen flex auth-theme bg-background">

      {/* ── LEFT BRAND PANEL (hidden on mobile) ── */}
      <div className="hidden lg:flex lg:w-[44%] xl:w-[42%] flex-col"
        style={{ background: "linear-gradient(160deg, hsl(220 38% 9%) 0%, hsl(219 55% 16%) 55%, hsl(219 45% 22%) 100%)" }}
      >
        {/* Top: Logo */}
        <div className="px-10 pt-10 pb-8">
          <CampusIQLogo size="md" variant="dark" />
        </div>

        {/* Middle: Tagline + stats */}
        <div className="flex-1 flex flex-col justify-center px-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
          >
            <h2 className="text-3xl xl:text-4xl font-bold text-white leading-tight mb-3"
              style={{ letterSpacing: "-0.025em" }}>
              One platform.<br />Every campus operation.
            </h2>
            <p className="text-sm leading-relaxed mb-10" style={{ color: "hsl(215 18% 58%)" }}>
              CampusIQ unifies attendance, resources, events, services, and communications into a single intelligent operating layer for your institution.
            </p>

            {/* Stats grid */}
            <div className="grid grid-cols-2 gap-3 mb-10">
              {PLATFORM_STATS.map((stat) => (
                <div key={stat.label}
                  className="rounded-xl px-4 py-3"
                  style={{ background: "hsl(220 35% 15%)", border: "1px solid hsl(220 30% 20%)" }}>
                  <p className="text-xl font-bold text-white tabular-nums">{stat.value}</p>
                  <p className="text-[11px] mt-0.5" style={{ color: "hsl(215 18% 52%)" }}>{stat.label}</p>
                </div>
              ))}
            </div>

            {/* Module chips */}
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest mb-3"
                style={{ color: "hsl(215 18% 44%)" }}>
                Platform Modules
              </p>
              <div className="flex flex-wrap gap-2">
                {MODULE_HIGHLIGHTS.map(({ icon: Icon, label }) => (
                  <div key={label}
                    className="flex items-center gap-1.5 rounded-full px-3 py-1"
                    style={{ background: "hsl(220 35% 14%)", border: "1px solid hsl(220 30% 19%)" }}>
                    <Icon className="h-3 w-3" style={{ color: "hsl(38 95% 52%)" }} />
                    <span className="text-[11px] font-medium" style={{ color: "hsl(215 18% 62%)" }}>{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Bottom: Footer links */}
        <div className="px-10 py-7 flex items-center justify-between"
          style={{ borderTop: "1px solid hsl(220 30% 16%)" }}>
          <p className="text-[10px]" style={{ color: "hsl(215 18% 38%)" }}>
            © 2026 CampusIQ Platform
          </p>
          <div className="flex items-center gap-4">
            <Link to="/about"
              className="text-[10px] transition-colors hover:text-white"
              style={{ color: "hsl(215 18% 42%)" }}>
              About
            </Link>
            <a href="#"
              className="text-[10px] transition-colors hover:text-white"
              style={{ color: "hsl(215 18% 42%)" }}>
              Privacy
            </a>
            <a href="#"
              className="text-[10px] transition-colors hover:text-white"
              style={{ color: "hsl(215 18% 42%)" }}>
              Terms
            </a>
          </div>
        </div>
      </div>

      {/* ── RIGHT FORM PANEL ── */}
      <div className="flex-1 flex flex-col">

        {/* Mobile top bar */}
        <div className="lg:hidden border-b border-border bg-surface px-5 py-3.5">
          <div className="flex items-center justify-between">
            <CampusIQLogo size="sm" variant="light" />
            <div className="flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-medium text-emerald-700">Live</span>
            </div>
          </div>
        </div>

        {/* Form content */}
        <div className="flex-1 flex items-center justify-center px-6 py-10 lg:px-12 xl:px-16 bg-background">
          <motion.div
            className="w-full max-w-md"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.25, 0.1, 0.25, 1], delay: 0.1 }}
          >
            {/* Header */}
            <div className="mb-8">
              <div className="lg:hidden flex justify-center mb-5">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
                  <Building2 className="h-6 w-6" />
                </div>
              </div>
              <h1 className="text-2xl font-bold text-foreground tracking-tight text-center lg:text-left">
                Welcome back
              </h1>
              <p className="text-sm text-muted-foreground mt-1.5 text-center lg:text-left">
                Sign in to your institutional account
              </p>
            </div>

            {/* Form card */}
            <AuthCard className="p-6 sm:p-7 shadow-[var(--ciq-shadow-auth)] mb-5">
              <form onSubmit={handleSubmit} className="space-y-4">
                <AuthInput
                  label="Campus ID"
                  type="text"
                  placeholder="e.g. CITXXXXXX or FACXXX"
                  value={userId}
                  onChange={e => { setUserId(e.target.value); setError(false); }}
                  error={error}
                  required
                />
                <AuthInput
                  label="Password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError(false); }}
                  error={error}
                  required
                />

                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="checkbox"
                      className="rounded border-border text-primary focus:ring-primary/20"
                    />
                    <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">
                      Remember me
                    </span>
                  </label>
                  <button
                    type="button"
                    className="text-xs font-medium text-primary hover:text-primary/80 transition-colors"
                  >
                    Forgot password?
                  </button>
                </div>

                {error && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                    <Lock className="h-4 w-4 shrink-0" />
                    <span>Invalid Campus ID or password.</span>
                  </div>
                )}

                <AuthButton type="submit" className="w-full mt-1" isLoading={loading}>
                  Sign In
                </AuthButton>
              </form>
            </AuthCard>

            {/* Quick login roles */}
            <RoleAccessCenter onQuickLogin={handleQuickLogin} />

            <p className="text-center text-[10px] text-muted-foreground mt-6">
              © 2026 CampusIQ Platform ·{" "}
              <Link to="/about" className="hover:text-foreground transition-colors">About</Link>
              {" · "}
              <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
              {" · "}
              <a href="#" className="hover:text-foreground transition-colors">Terms</a>
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
