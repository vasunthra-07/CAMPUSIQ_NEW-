import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import { ReactNode } from "react";

interface MetricTileProps {
  label: string;
  value: ReactNode;
  icon?: LucideIcon;
  trend?: { value: string; positive?: boolean };
  variant?: "default" | "success" | "warning" | "danger" | "primary";
  subtitle?: string;
  onClick?: () => void;
  delay?: number;
  className?: string;
}

const variantStyles = {
  default: "border-border",
  success: "border-emerald-200 bg-emerald-50/50",
  warning: "border-amber-200 bg-amber-50/50",
  danger: "border-red-200 bg-red-50/50",
  primary: "border-blue-200 bg-blue-50/50",
};

const iconStyles = {
  default: "bg-slate-100 text-slate-600",
  success: "bg-emerald-100 text-emerald-600",
  warning: "bg-amber-100 text-amber-600",
  danger: "bg-red-100 text-red-600",
  primary: "bg-blue-100 text-blue-600",
};

export function MetricTile({
  label,
  value,
  icon: Icon,
  trend,
  variant = "default",
  subtitle,
  onClick,
  delay = 0,
  className,
}: MetricTileProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay, ease: [0.25, 0.1, 0.25, 1] }}
      onClick={onClick}
      className={cn(
        "workspace-panel p-4 sm:p-5",
        variantStyles[variant],
        onClick && "cursor-pointer hover:border-primary/30 hover:shadow-md transition-shadow",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-2">
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          <p className="text-2xl font-semibold tracking-tight text-foreground tabular-nums sm:text-3xl">{value}</p>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
          {trend && (
            <p className={cn("text-xs font-medium", trend.positive ? "text-emerald-600" : "text-red-600")}>
              {trend.value}
            </p>
          )}
        </div>
        {Icon && (
          <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg", iconStyles[variant])}>
            <Icon className="h-4 w-4" />
          </div>
        )}
      </div>
    </motion.div>
  );
}
