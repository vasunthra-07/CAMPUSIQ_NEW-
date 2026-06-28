import { cn } from "@/lib/utils";

type StatusVariant = "default" | "success" | "warning" | "danger" | "info" | "neutral";

interface StatusBadgeProps {
  children: React.ReactNode;
  variant?: StatusVariant;
  size?: "sm" | "md";
  className?: string;
}

const variants: Record<StatusVariant, string> = {
  default: "bg-slate-100 text-slate-700 border-slate-200",
  success: "bg-emerald-50 text-emerald-700 border-emerald-200",
  warning: "bg-amber-50 text-amber-700 border-amber-200",
  danger: "bg-red-50 text-red-700 border-red-200",
  info: "bg-blue-50 text-blue-700 border-blue-200",
  neutral: "bg-slate-50 text-muted-foreground border-border",
};

export function StatusBadge({ children, variant = "default", size = "sm", className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border font-medium",
        size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs",
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
