import React, { useState, useEffect } from "react";
import { Menu, Building2, X, LogOut, ChevronRight, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { AuthUser } from "@/types/auth";
import { useAuth } from "@/context/AuthContext";
import { NotificationCenter } from "./NotificationCenter";
import { useLocation, useNavigate } from "react-router-dom";
import { moduleRegistry } from "@/routes/moduleRegistry";

interface Props {
  user: AuthUser;
  children: React.ReactNode;
}

export default function DashboardLayout({ user, children }: Props) {
  const { logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = moduleRegistry.filter(m => m.allowedRoles.includes(user.role));
  const activeModule = navItems.find(m => location.pathname.startsWith(m.path)) || navItems[0];
  const activeLabel = activeModule?.label || "Campus Command Center";

  useEffect(() => {
    document.title = `${activeLabel} | CampusIQ`;
  }, [activeLabel]);

  const SEMESTER_WEEK = 6;
  const SEMESTER_TOTAL = 16;
  const semProgress = Math.round((SEMESTER_WEEK / SEMESTER_TOTAL) * 100);

  return (
    <div className="flex min-h-screen bg-background">
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-foreground/20 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Workspace sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[260px] flex-col border-r border-border bg-sidebar transition-transform duration-200 lg:static lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 border-b border-border px-4 py-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Building2 className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-sm font-semibold text-foreground leading-tight">CampusIQ</h1>
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Campus OS</p>
          </div>
          <button className="lg:hidden btn-ghost p-1" onClick={() => setSidebarOpen(false)}>
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* User context */}
        <div className="border-b border-border px-3 py-3">
          <p className="mb-2 px-2 section-label">Workspace</p>
          <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/40 px-3 py-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-xs font-semibold text-primary-foreground">
              {user.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-foreground truncate">{user.name}</p>
              <p className="text-xs text-muted-foreground truncate">{user.role}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
          <p className="section-label mb-2 px-2">Operations</p>
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = location.pathname.startsWith(item.path);
            return (
              <button
                key={item.id}
                onClick={() => { navigate(item.path); setSidebarOpen(false); }}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                  isActive ? "nav-active" : "btn-ghost text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="truncate text-left">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="border-t border-border p-3 space-y-2">
          <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-foreground">Semester IV</span>
              <span className="text-[11px] font-medium text-primary tabular-nums">{semProgress}%</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-border overflow-hidden">
              <div className="h-full rounded-full progress-warm transition-all" style={{ width: `${semProgress}%` }} />
            </div>
            <p className="text-[10px] text-muted-foreground">Week {SEMESTER_WEEK} of {SEMESTER_TOTAL}</p>
          </div>
          <button
            onClick={logout}
            className="btn-secondary flex w-full items-center justify-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-destructive"
          >
            <LogOut className="h-4 w-4" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main workspace */}
      <div className="flex flex-1 flex-col min-w-0">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-surface/95 px-4 backdrop-blur-sm">
          <button className="lg:hidden btn-ghost p-1" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5" />
          </button>

          <div className="hidden sm:flex items-center gap-1.5 text-sm text-muted-foreground min-w-0">
            <span className="truncate">{user.role}</span>
            <ChevronRight className="h-3.5 w-3.5 shrink-0" />
            <span className="font-medium text-foreground truncate">{activeLabel}</span>
          </div>

          <div className="sm:hidden text-sm font-medium text-foreground truncate">{activeLabel}</div>

          <div className="ml-auto flex items-center gap-2">
            <button className="hidden md:flex items-center gap-2 rounded-lg border border-border bg-muted/50 px-3 py-1.5 text-xs text-muted-foreground hover:border-primary/30 transition-colors">
              <Search className="h-3.5 w-3.5" />
              <span>Search campus...</span>
              <kbd className="rounded border border-border bg-surface px-1.5 py-0.5 text-[10px]">⌘K</kbd>
            </button>
            <NotificationCenter />
            <div className="hidden sm:flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
              {user.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-x-hidden p-4 md:p-6">
          <div className="mx-auto max-w-7xl" key={location.pathname}>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
