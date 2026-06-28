import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

export interface ActivityItem {
  id: string;
  title: string;
  description?: string;
  time: string;
  icon?: LucideIcon;
  variant?: "default" | "success" | "warning" | "danger" | "primary";
}

const dotStyles = {
  default: "bg-slate-400",
  success: "bg-emerald-500",
  warning: "bg-amber-500",
  danger: "bg-red-500",
  primary: "bg-blue-500",
};

interface ActivityFeedProps {
  items: ActivityItem[];
  emptyMessage?: string;
  className?: string;
}

export function ActivityFeed({ items, emptyMessage = "No recent activity", className }: ActivityFeedProps) {
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground py-4 text-center">{emptyMessage}</p>;
  }

  return (
    <ul className={cn("space-y-0", className)}>
      {items.map((item, i) => (
        <li
          key={item.id}
          className={cn(
            "flex gap-3 py-3",
            i !== items.length - 1 && "border-b border-border/60"
          )}
        >
          <div className="relative flex flex-col items-center pt-1.5">
            <span className={cn("h-2 w-2 rounded-full shrink-0", dotStyles[item.variant ?? "default"])} />
            {i !== items.length - 1 && (
              <span className="absolute top-4 bottom-0 w-px bg-border/80" />
            )}
          </div>
          <div className="min-w-0 flex-1 pb-1">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-medium text-foreground leading-snug">{item.title}</p>
              <time className="text-[11px] text-muted-foreground shrink-0 tabular-nums">{item.time}</time>
            </div>
            {item.description && (
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{item.description}</p>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
