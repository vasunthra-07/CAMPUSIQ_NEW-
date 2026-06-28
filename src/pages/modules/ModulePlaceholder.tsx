import { LucideIcon } from "lucide-react";
import { moduleRegistry } from "@/routes/moduleRegistry";
import { useLocation } from "react-router-dom";

export default function ModulePlaceholder() {
  const location = useLocation();
  const moduleDef = moduleRegistry.find(m => m.path === location.pathname);

  if (!moduleDef) {
    return (
      <div className="flex h-[60vh] w-full flex-col items-center justify-center p-8 text-center animate-fade-in">
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Module Not Found</h2>
        <p className="mt-2 text-muted-foreground">The requested module path does not exist.</p>
      </div>
    );
  }

  const Icon = moduleDef.icon;

  return (
    <div className="flex h-[60vh] w-full flex-col items-center justify-center p-8 animate-fade-up">
      <div className="card-warm p-10 flex flex-col items-center max-w-md w-full text-center shadow-lg border border-border/50 bg-surface/50 backdrop-blur-sm">
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-accent/10 text-accent mb-6 shadow-inner border border-accent/20">
          <Icon className="h-10 w-10 animate-float" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground font-syne mb-2">{moduleDef.label}</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          This module is currently under construction. Phase 7 will build out the live features and data integration here.
        </p>
        <div className="mt-8 px-4 py-2 rounded-full bg-surface-hover border border-border text-xs font-mono text-muted-foreground shadow-sm">
          Route: {moduleDef.path}
        </div>
      </div>
    </div>
  );
}
