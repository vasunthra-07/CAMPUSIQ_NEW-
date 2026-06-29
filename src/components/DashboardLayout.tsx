import React, { useState, useEffect, useRef, useCallback } from "react";
import { Menu, X, LogOut, ChevronRight, Search, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { AuthUser } from "@/types/auth";
import { useAuth } from "@/context/AuthContext";
import { NotificationCenter } from "./NotificationCenter";
import { useRealtime } from "@/services/realtime/RealtimeContext";
import { useLocation, useNavigate } from "react-router-dom";
import { moduleRegistry } from "@/routes/moduleRegistry";
import { ticketStore, eventStore, announcementStore } from "@/services/campusStore";

interface Props {
  user: AuthUser;
  children: React.ReactNode;
}

interface SearchResult {
  id: string;
  title: string;
  subtitle: string;
  path: string;
  type: "module" | "ticket" | "event" | "announcement";
}

function buildSearchIndex(navItems: typeof moduleRegistry): (query: string) => SearchResult[] {
  return (query: string) => {
    const q = query.toLowerCase().trim();
    if (!q) return [];

    const results: SearchResult[] = [];

    navItems.forEach(m => {
      if (m.label.toLowerCase().includes(q) || m.id.toLowerCase().includes(q)) {
        results.push({ id: m.id, title: m.label, subtitle: "Module", path: m.path, type: "module" });
      }
    });

    try {
      ticketStore.getAll()
        .filter(t => t.subject.toLowerCase().includes(q) || t.id.toLowerCase().includes(q))
        .slice(0, 3)
        .forEach(t => results.push({
          id: t.id, title: t.subject, subtitle: `Ticket · ${t.status} · ${t.priority}`,
          path: "/app/service-center", type: "ticket",
        }));

      eventStore.getAll()
        .filter(e => e.title.toLowerCase().includes(q) || e.venue.toLowerCase().includes(q))
        .slice(0, 3)
        .forEach(e => results.push({
          id: e.id, title: e.title, subtitle: `Event · ${e.date} · ${e.venue}`,
          path: "/app/events", type: "event",
        }));

      announcementStore.getAll()
        .filter(a => a.title.toLowerCase().includes(q) || a.body.toLowerCase().includes(q))
        .slice(0, 2)
        .forEach(a => results.push({
          id: a.id, title: a.title, subtitle: `Announcement · ${a.category}`,
          path: "/app/communication", type: "announcement",
        }));
    } catch {
      // store not available yet
    }

    return results.slice(0, 8);
  };
}

const TYPE_BADGE: Record<SearchResult["type"], string> = {
  module: "bg-primary/10 text-primary",
  ticket: "bg-amber-100 text-amber-700",
  event: "bg-emerald-100 text-emerald-700",
  announcement: "bg-blue-100 text-blue-700",
};

export default function DashboardLayout({ user, children }: Props) {
  const { connection } = useRealtime();
  const { logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const searchRef = useRef<HTMLInputElement>(null);
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = moduleRegistry.filter(m => m.allowedRoles.includes(user.role));
  const activeModule = navItems.find(m => location.pathname.startsWith(m.path)) || navItems[0];
  const activeLabel = activeModule?.label || "Campus Command Center";
  const search = useCallback(buildSearchIndex(navItems), [navItems]);

  useEffect(() => {
    document.title = `${activeLabel} | CampusIQ`;
  }, [activeLabel]);

  useEffect(() => {
    const results = search(searchQuery);
    setSearchResults(results);
    setSelectedIndex(0);
  }, [searchQuery, search]);

  useEffect(() => {
    if (searchOpen) {
      setTimeout(() => searchRef.current?.focus(), 50);
    } else {
      setSearchQuery("");
      setSearchResults([]);
    }
  }, [searchOpen]);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(prev => !prev);
      }
      if (e.key === "Escape") setSearchOpen(false);
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  function handleSearchKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex(i => Math.min(i + 1, searchResults.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex(i => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && searchResults[selectedIndex]) {
      navigateTo(searchResults[selectedIndex].path);
    }
  }

  function navigateTo(path: string) {
    navigate(path);
    setSearchOpen(false);
    setSidebarOpen(false);
  }

  const SEMESTER_WEEK = 6;
  const SEMESTER_TOTAL = 16;
  const semProgress = Math.round((SEMESTER_WEEK / SEMESTER_TOTAL) * 100);

  return (
    <div className="flex min-h-screen bg-background">
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-foreground/20 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Global search modal */}
      {searchOpen && (
        <div className="fixed inset-0 z-[60] flex items-start justify-center pt-[15vh] px-4" onClick={() => setSearchOpen(false)}>
          <div
            className="w-full max-w-lg rounded-2xl border border-border bg-surface shadow-2xl overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
              <Search className="h-4 w-4 text-muted-foreground shrink-0" />
              <input
                ref={searchRef}
                type="text"
                placeholder="Search modules, tickets, events, announcements..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
              />
              <kbd className="hidden sm:block rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">ESC</kbd>
            </div>

            {searchQuery.length > 0 && (
              <div className="max-h-80 overflow-y-auto py-1.5">
                {searchResults.length === 0 ? (
                  <p className="px-4 py-6 text-center text-sm text-muted-foreground">No results for "{searchQuery}"</p>
                ) : (
                  searchResults.map((r, i) => (
                    <button
                      key={r.id + r.type}
                      onClick={() => navigateTo(r.path)}
                      className={cn(
                        "w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors",
                        i === selectedIndex ? "bg-primary/5" : "hover:bg-muted/50"
                      )}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground truncate">{r.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{r.subtitle}</p>
                      </div>
                      <span className={cn("text-[10px] font-medium rounded px-2 py-0.5 shrink-0 capitalize", TYPE_BADGE[r.type])}>
                        {r.type}
                      </span>
                      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    </button>
                  ))
                )}
              </div>
            )}

            {!searchQuery && (
              <div className="py-3">
                <p className="px-4 pb-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Quick navigate</p>
                {navItems.slice(0, 6).map((m, i) => {
                  const Icon = m.icon;
                  return (
                    <button
                      key={m.id}
                      onClick={() => navigateTo(m.path)}
                      className={cn(
                        "w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors",
                        i === selectedIndex ? "bg-primary/5" : "hover:bg-muted/50"
                      )}
                    >
                      <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="text-sm text-foreground">{m.label}</span>
                      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground shrink-0 ml-auto" />
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
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
          <img
            src="/CIT.png"
            alt="Chennai Institute of Technology"
            style={{ height: 36, width: "auto" }}
          />
          <button className="lg:hidden btn-ghost p-1 ml-auto" onClick={() => setSidebarOpen(false)}>
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
            <div className="hidden items-center gap-1.5 rounded-full border border-border bg-muted/40 px-2.5 py-1 text-[10px] font-medium capitalize text-muted-foreground md:flex">
              <span className={cn("h-2 w-2 rounded-full", connection === "connected" ? "bg-emerald-500" : connection === "offline" ? "bg-red-500" : "animate-pulse bg-amber-500")} />
              Live {connection}
            </div>
            <button
              onClick={() => setSearchOpen(true)}
              className="hidden md:flex items-center gap-2 rounded-lg border border-border bg-muted/50 px-3 py-1.5 text-xs text-muted-foreground hover:border-primary/30 transition-colors"
            >
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
