import { OperationalActivityCanvas } from "@/components/auth/OperationalActivityCanvas";
import { CampusPulsePanel } from "@/components/auth/CampusPulsePanel";
import { motion } from "framer-motion";
import { Brain, Activity, RefreshCw } from "lucide-react";

export default function CampusIntelligenceCentre() {
  return (
    <div className="space-y-6">
      {/* Page header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div className="flex items-center gap-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <Brain className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground tracking-tight">
              Campus Intelligence Centre
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Real-time operational activity across all campus zones
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            <span className="text-[11px] font-semibold text-emerald-700">Live Feed Active</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-lg border border-border bg-muted/50 px-3 py-1.5">
            <Activity className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground font-medium">847 ops/min</span>
          </div>
          <button className="flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors">
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </button>
        </div>
      </motion.div>

      {/* Status bar */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.35 }}
        className="grid grid-cols-2 sm:grid-cols-4 gap-3"
      >
        {[
          { label: "Active Zones", value: "8", color: "text-primary" },
          { label: "Data Flows", value: "7", color: "text-amber-600" },
          { label: "Campus Health", value: "94/100", color: "text-emerald-600" },
          { label: "Last Sync", value: "Just now", color: "text-muted-foreground" },
        ].map(stat => (
          <div
            key={stat.label}
            className="rounded-xl border border-border bg-surface px-4 py-3"
          >
            <p className={`text-base font-bold tabular-nums ${stat.color}`}>{stat.value}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">{stat.label}</p>
          </div>
        ))}
      </motion.div>

      {/* Main content: Canvas + Pulse panel */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_300px] gap-5">
        {/* Operational Activity Canvas */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.45, ease: [0.25, 0.1, 0.25, 1] }}
          className="rounded-2xl border border-border bg-surface overflow-hidden shadow-sm"
        >
          <div className="border-b border-border px-5 py-4 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-foreground">Operational Activity Canvas</h2>
              <p className="text-[11px] text-muted-foreground mt-0.5">Live campus zone overview with real-time data flows</p>
            </div>
          </div>
          <div className="p-4" style={{ minHeight: "480px" }}>
            <OperationalActivityCanvas />
          </div>
        </motion.div>

        {/* Campus Pulse Panel */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.45, ease: [0.25, 0.1, 0.25, 1] }}
          className="rounded-2xl border border-border bg-surface p-5 shadow-sm"
        >
          <CampusPulsePanel />
        </motion.div>
      </div>
    </div>
  );
}
