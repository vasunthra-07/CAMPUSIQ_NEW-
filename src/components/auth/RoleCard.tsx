import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { ChevronRight, Copy, CheckCircle2 } from "lucide-react";
import { useState } from "react";

interface RoleCardProps {
  name: string;
  description: string;
  credentials: { id: string; pwd: string };
  icon: ReactNode;
  onQuickLogin: () => void;
  className?: string;
}

export function RoleCard({ name, description, credentials, icon, onQuickLogin, className }: RoleCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(`Campus ID: ${credentials.id}\nPassword: ${credentials.pwd}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={cn(
        "group relative flex w-full flex-col gap-3 rounded-xl border border-border bg-surface p-4 text-left transition-all duration-200",
        "hover:border-primary/50 hover:shadow-sm",
        className
      )}
    >
      <div className="flex items-start gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-white">
          {icon}
        </div>
        <div className="flex-1 space-y-1">
          <h4 className="font-semibold text-foreground text-sm">{name}</h4>
          <p className="text-xs text-muted leading-relaxed">{description}</p>
        </div>
      </div>
      
      <div className="mt-1 rounded-md bg-muted/5 p-3 text-xs font-mono space-y-1.5 border border-border/50">
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Campus ID:</span>
          <span className="text-foreground font-medium">{credentials.id}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Password:</span>
          <span className="text-foreground font-medium">{credentials.pwd}</span>
        </div>
      </div>

      <div className="flex items-center gap-2 mt-1">
        <button
          onClick={handleCopy}
          className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md border border-border text-xs font-medium text-muted-foreground hover:bg-muted/10 hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
        >
          {copied ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? "Copied" : "Copy Credentials"}
        </button>
        <button
          onClick={onQuickLogin}
          className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md bg-primary/10 text-primary border border-primary/20 text-xs font-medium hover:bg-primary hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
        >
          Quick Login <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
