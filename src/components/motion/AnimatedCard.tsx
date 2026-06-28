import React from "react";
import { cn } from "@/lib/utils";
import { fadeUpStyle } from "@/lib/motion";

interface AnimatedCardProps {
  children: React.ReactNode;
  className?: string;
  index?: number;
  delay?: number;
  onClick?: () => void;
}

export function AnimatedCard({ children, className, index = 0, delay = 0, onClick }: AnimatedCardProps) {
  return (
    <div
      className={cn("card-warm card-glow-hover", className)}
      style={fadeUpStyle(index, delay)}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

// Stat card variant with top accent bar
interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ElementType;
  trend?: "up" | "down" | "stable";
  trendValue?: string;
  className?: string;
  index?: number;
  onClick?: () => void;
}

export function StatCard({ title, value, subtitle, icon: Icon, trend, trendValue, className, index = 0, onClick }: StatCardProps) {
  const trendColors = { up: "text-emerald-400", down: "text-red-400", stable: "text-blue-400" };
  const trendArrows = { up: "↑", down: "↓", stable: "→" };

  return (
    <AnimatedCard index={index} className={cn("p-5 cursor-default", onClick && "cursor-pointer", className)} onClick={onClick}>
      <div className="flex items-start justify-between mb-3">
        <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
          {Icon && <Icon className="h-4 w-4 text-accent" />}
          {title}
        </p>
        {trend && trendValue && (
          <span className={cn("text-[11px] font-mono font-bold", trendColors[trend])}>
            {trendArrows[trend]} {trendValue}
          </span>
        )}
      </div>
      <p className="text-4xl font-bold font-mono gradient-text-gold mb-1">{value}</p>
      {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
    </AnimatedCard>
  );
}
