import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import { ReactNode } from "react";

interface WorkspacePanelProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  children: ReactNode;
  actions?: ReactNode;
  className?: string;
  contentClassName?: string;
  delay?: number;
  noPadding?: boolean;
}

export function WorkspacePanel({
  title,
  description,
  icon: Icon,
  children,
  actions,
  className,
  contentClassName,
  delay = 0,
  noPadding = false,
}: WorkspacePanelProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay, ease: [0.25, 0.1, 0.25, 1] }}
      className={cn("workspace-panel overflow-hidden", className)}
    >
      <div className="flex items-start justify-between gap-3 border-b border-border px-4 py-3 sm:px-5 sm:py-4">
        <div className="flex items-start gap-3 min-w-0">
          {Icon && (
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Icon className="h-4 w-4" />
            </div>
          )}
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-foreground">{title}</h2>
            {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
          </div>
        </div>
        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </div>
      <div className={cn(!noPadding && "p-4 sm:p-5", contentClassName)}>{children}</div>
    </motion.section>
  );
}
