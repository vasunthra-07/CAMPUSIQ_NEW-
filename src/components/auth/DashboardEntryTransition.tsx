import { motion } from "framer-motion";
import { Activity, Building2, Calendar, Headset, TrendingUp, Users } from "lucide-react";
import type { AuthUser } from "@/types/auth";

interface DashboardEntryTransitionProps {
  user: AuthUser;
}

const METRICS = [
  { label: "Active Users", value: "2,847", icon: Users },
  { label: "Events Today", value: "8", icon: Calendar },
  { label: "Resource Utilization", value: "78%", icon: TrendingUp },
  { label: "Service Requests", value: "14", icon: Headset },
  { label: "Campus Health", value: "94/100", icon: Activity },
];

export function DashboardEntryTransition({ user }: DashboardEntryTransitionProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center auth-theme bg-background px-4">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-lg workspace-panel overflow-hidden shadow-xl"
      >
        <div className="border-b border-border px-6 py-5 bg-muted/20">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Entering Campus Command Center</h3>
              <p className="text-xs text-muted-foreground">{user.name} · {user.role}</p>
            </div>
            <span className="ml-auto flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-1 text-[10px] font-medium text-emerald-700">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live
            </span>
          </div>
        </div>

        <div className="p-6">
          <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground mb-4">Campus Pulse</p>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {METRICS.map((metric, i) => (
              <motion.div
                key={metric.label}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.07 }}
                className="rounded-lg border border-border p-3"
              >
                <metric.icon className="h-3.5 w-3.5 text-primary mb-2" />
                <p className="text-[10px] text-muted-foreground leading-snug">{metric.label}</p>
                <p className="text-lg font-semibold text-foreground tabular-nums mt-0.5">{metric.value}</p>
              </motion.div>
            ))}
          </div>

          <motion.div className="mt-6">
            <div className="flex justify-between text-xs text-muted-foreground mb-2">
              <span>Loading operational modules</span>
              <span>100%</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
              <motion.div
                className="h-full bg-primary rounded-full"
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: 1.4, ease: "easeInOut" }}
              />
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
