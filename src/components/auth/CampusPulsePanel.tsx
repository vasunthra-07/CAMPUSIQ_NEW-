import { motion } from "framer-motion";
import { Activity, Calendar, Headset, TrendingUp, Users } from "lucide-react";
import { AnimatedNumber } from "@/components/motion/AnimatedNumber";

const METRICS = [
  { label: "Active Users", value: 2847, icon: Users, suffix: "", trend: "+12% today" },
  { label: "Events Today", value: 8, icon: Calendar, suffix: "", trend: "3 live now" },
  { label: "Resource Utilization", value: 78, icon: TrendingUp, suffix: "%", trend: "Optimal range" },
  { label: "Service Requests", value: 14, icon: Headset, suffix: "", trend: "4.2h avg SLA" },
  { label: "Campus Health", value: 94, icon: Activity, suffix: "/100", trend: "Operational excellence" },
];

export function CampusPulsePanel() {
  return (
    <div className="flex h-full flex-col">
      <div className="mb-6">
        <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">Real-time</p>
        <h2 className="text-xl font-semibold text-foreground tracking-tight mt-1">Campus Pulse</h2>
        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
          Live operational metrics across your institution
        </p>
      </div>

      <div className="flex-1 space-y-3">
        {METRICS.map((metric, i) => (
          <motion.div
            key={metric.label}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 + i * 0.07, duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
            className="group rounded-xl border border-border bg-surface p-4 shadow-sm transition-shadow hover:shadow-md"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-medium text-muted-foreground">{metric.label}</p>
                <p className="text-2xl font-semibold text-foreground tabular-nums tracking-tight mt-1">
                  <AnimatedNumber value={metric.value} suffix={metric.suffix} />
                </p>
                <p className="text-[11px] text-emerald-600 font-medium mt-1">{metric.trend}</p>
              </div>
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-white">
                <metric.icon className="h-4 w-4" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="mt-6 rounded-xl border border-primary/20 bg-primary/5 p-4"
      >
        <div className="flex items-center gap-2 mb-2">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-40" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
          </span>
          <span className="text-xs font-semibold text-primary">CampusIQ Engine Online</span>
        </div>
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          Processing 847 operations per minute across all campus modules.
        </p>
      </motion.div>
    </div>
  );
}
