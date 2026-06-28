import { ReactNode } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useCanteenAuth } from "@/context/CanteenAuthContext";
import { UtensilsCrossed, LogOut, ChefHat, RefreshCw } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

export default function CanteenLayout({ children }: { children: ReactNode }) {
  const { staff, logout } = useCanteenAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();

  if (!staff) return <Navigate to="/canteen-staff/login" replace />;

  function handleLogout() {
    logout();
    navigate("/canteen-staff/login", { replace: true });
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top header bar */}
      <header className="sticky top-0 z-30 border-b border-border bg-surface/95 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 flex h-14 items-center justify-between gap-4">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500 shrink-0">
              <UtensilsCrossed className="h-4 w-4 text-white" />
            </div>
            <div className="leading-none">
              <p className="text-sm font-bold text-foreground">Canteen Dashboard</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">CampusIQ Operations</p>
            </div>
          </div>

          {/* Center: live indicator */}
          <div className="hidden sm:flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-medium text-emerald-700">Live · Auto-refreshing every 4s</span>
          </div>

          {/* Right: staff info + actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => qc.invalidateQueries()}
              title="Refresh now"
              className="btn-ghost p-2 rounded-lg text-muted-foreground hover:text-foreground"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
            <div className="hidden sm:flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-1.5">
              <ChefHat className="h-3.5 w-3.5 text-amber-600 shrink-0" />
              <div className="leading-none">
                <p className="text-xs font-medium text-foreground">{staff.name}</p>
                <p className="text-[10px] text-muted-foreground">{staff.role}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="btn-secondary flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg text-muted-foreground hover:text-destructive"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Page content */}
      <main className="flex-1 p-4 sm:p-6">
        <div className="mx-auto max-w-7xl">
          {children}
        </div>
      </main>
    </div>
  );
}
