import { motion } from "framer-motion";
import { Activity, Building2, CheckCircle2 } from "lucide-react";
import type { AuthUser } from "@/types/auth";

interface RoleWelcomeScreenProps {
  user: AuthUser;
}

export function RoleWelcomeScreen({ user }: RoleWelcomeScreenProps) {
  const campusPulse = 94;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center auth-theme bg-background px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md"
      >
        <div className="workspace-panel p-8 text-center shadow-lg">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.15, type: "spring", stiffness: 200, damping: 18 }}
            className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary"
          >
            <CheckCircle2 className="h-8 w-8" />
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="text-2xl font-semibold text-foreground tracking-tight"
          >
            Welcome Back
          </motion.h2>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35 }}
            className="mt-4 space-y-1"
          >
            <p className="text-base font-medium text-foreground">{user.name}</p>
            <p className="text-sm font-medium text-primary">{user.role}</p>
            <p className="text-xs text-muted-foreground flex items-center justify-center gap-1.5 mt-1">
              <Building2 className="h-3 w-3" />
              {user.department}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            className="mt-6 grid grid-cols-2 gap-3 text-left"
          >
            <div className="rounded-lg border border-border bg-muted/30 p-3">
              <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">System Status</p>
              <div className="flex items-center gap-1.5 mt-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-semibold text-emerald-700">Operational</span>
              </div>
            </div>
            <div className="rounded-lg border border-border bg-muted/30 p-3">
              <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Campus Pulse</p>
              <div className="flex items-center gap-1.5 mt-1.5">
                <Activity className="h-3.5 w-3.5 text-primary" />
                <span className="text-xs font-semibold text-foreground tabular-nums">{campusPulse}/100</span>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-6 h-1 w-full rounded-full bg-muted overflow-hidden"
          >
            <motion.div
              className="h-full bg-primary rounded-full"
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: 1.8, ease: "easeInOut" }}
            />
          </motion.div>
          <p className="text-[11px] text-muted-foreground mt-2">Preparing your workspace…</p>
        </div>
      </motion.div>
    </div>
  );
}
