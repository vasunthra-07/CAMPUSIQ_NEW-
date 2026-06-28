import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

export interface QuickAction {
  id: string;
  label: string;
  icon: LucideIcon;
  onClick?: () => void;
  href?: string;
}

interface QuickActionBarProps {
  actions: QuickAction[];
  className?: string;
}

export function QuickActionBar({ actions, className }: QuickActionBarProps) {
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {actions.map((action, i) => (
        <motion.button
          key={action.id}
          type="button"
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.25, delay: i * 0.04 }}
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.98 }}
          onClick={action.onClick}
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-xs font-medium text-foreground shadow-sm hover:border-primary/30 hover:bg-primary/5 transition-colors"
        >
          <action.icon className="h-3.5 w-3.5 text-primary" />
          {action.label}
        </motion.button>
      ))}
    </div>
  );
}
