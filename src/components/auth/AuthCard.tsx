import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface AuthCardProps {
  children: ReactNode;
  className?: string;
}

export function AuthCard({ children, className }: AuthCardProps) {
  return (
    <div
      className={cn(
        "bg-surface border border-border rounded-[var(--ciq-radius-md)] shadow-[var(--ciq-shadow-auth)] overflow-hidden",
        className
      )}
    >
      {children}
    </div>
  );
}
