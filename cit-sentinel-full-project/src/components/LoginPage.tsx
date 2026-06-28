import { useState, useEffect } from "react";
import { Shield, ChevronDown, GraduationCap, BookOpen, Users, Building2, Crown, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import type { Role } from "@/types/auth";

const ROLE_ICONS: Record<Role, React.ElementType> = {
  Student: GraduationCap,
  "Subject Teacher": BookOpen,
  Mentor: Users,
  HOD: Building2,
  Principal: Shield,
  Chairman: Crown,
};

export default function LoginPage() {
  const { login, demoUsers } = useAuth();
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showCreds, setShowCreds] = useState(false);

  // Background animation delay
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(false);
    
    // Simulate slight network delay for effect
    setTimeout(() => {
      const success = login(userId, password);
      if (!success) {
        setError(true);
        setLoading(false);
      }
      // If success, Index.tsx will automatically re-render and navigate away
    }, 600);
  };

  const autoFill = (uid: string, pass: string) => {
    setUserId(uid);
    setPassword(pass);
    setError(false);
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      
      {/* Background glow effects */}
      <div className="absolute inset-0 bg-dot-pattern opacity-30 z-0" />
      <div className="absolute inset-0 hero-mesh z-0 opacity-80" />

      <div className="relative z-10 w-full max-w-md p-6">
        
        {/* Main Card */}
        <div className={cn(
          "relative overflow-hidden card-warm p-8 shadow-2xl transition-all duration-700 animate-scale-in rounded-[20px]",
          error && "card-critical-glow animate-shake"
        )}>
          
          {/* Header */}
          <div className="mb-8 flex flex-col items-center justify-center text-center relative z-10 w-full">
            <img src="/cit-logo-light.png" alt="CIT Logo" className="h-16 w-auto mb-4 object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
            <h1 className="text-[44px] leading-tight font-bold tracking-tight gradient-text-gold font-syne flex items-center gap-3">
              <Shield className="h-10 w-10 text-accent animate-sentinel-beat" />
              CIT-Sentinel
            </h1>
            <p className="mt-1 text-xs font-medium uppercase tracking-widest text-muted-foreground">AI & DS Dept</p>
            
            <div className="mt-5 flex items-center justify-center gap-2 week-pill-upcoming shadow-sm">
              <span className="h-2 w-2 rounded-full bg-accent animate-pulse" />
              <span>Sentinel Active</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="section-label">Register / Faculty ID</label>
                <input
                  type="text"
                  value={userId}
                  onChange={(e) => { setUserId(e.target.value); setError(false); }}
                  className="w-full input-warm px-4 py-3 font-mono text-sm"
                  placeholder="CITXXXXXX or FACXXX"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="section-label">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(false); }}
                  className="w-full input-warm px-4 py-3 font-mono text-sm"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-lg badge-critical px-3 py-2.5 text-sm font-medium animate-fade-in shadow-sm">
                <Lock className="h-4 w-4" />
                <span>Invalid credentials. Check demo accounts below.</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="group relative mt-2 flex w-full items-center justify-center gap-2 btn-primary shimmer-btn px-4 py-3.5"
            >
              {loading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-accent border-r-transparent" />
              ) : (
                <>
                  Access Dashboard <span className="transition-transform group-hover:translate-x-1">→</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Demo Credentials Panel */}
        <div className="mt-8">
          <button
            onClick={() => setShowCreds(!showCreds)}
            className="mx-auto flex items-center justify-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            <span className="section-label">Demo Credentials</span>
            <ChevronDown className={cn("h-3 w-3 transition-transform duration-300", showCreds && "rotate-180")} />
          </button>

          <div className={cn(
            "mt-4 grid grid-cols-2 gap-2 transition-all duration-300 overflow-hidden",
            showCreds ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
          )}>
            {demoUsers.map((u) => {
              const Icon = ROLE_ICONS[u.role as Role];
              return (
                <button
                  key={u.userId}
                  type="button"
                  onClick={() => autoFill(u.userId, u.password)}
                  className="flex items-center gap-3 p-3 text-left btn-ghost hover:-translate-y-0.5 shadow-sm border border-border/50 group"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface text-muted-foreground group-hover:bg-accent/10 group-hover:text-accent transition-colors">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-[11px] font-bold text-foreground">{u.role}</p>
                    <p className="truncate font-mono text-[9px] text-muted-foreground">{u.userId}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-[10px] text-muted-foreground font-mono">
          <p>Powered by Sentinel SLM Engine · Privacy Compliant</p>
          <p className="mt-1 font-syne text-xs">Chennai Institute of Technology</p>
        </div>
      </div>
    </div>
  );
}
