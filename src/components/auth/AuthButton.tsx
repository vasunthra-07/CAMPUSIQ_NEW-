import { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";
import { Loader2, CheckCircle2 } from "lucide-react";

export interface AuthButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
  isLoading?: boolean;
  isSuccess?: boolean;
}

export const AuthButton = forwardRef<HTMLButtonElement, AuthButtonProps>(
  ({ className, variant = "primary", isLoading, isSuccess, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading || isSuccess}
        className={cn(
          "relative inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 disabled:pointer-events-none disabled:opacity-50 h-11 px-8",
          {
            "bg-primary text-white hover:bg-primary/90 shadow-sm": variant === "primary",
            "bg-secondary/10 text-secondary hover:bg-secondary/20": variant === "secondary",
            "hover:bg-muted/10 text-foreground": variant === "ghost",
            "bg-emerald-500 text-white hover:bg-emerald-600": isSuccess && variant === "primary",
          },
          className
        )}
        {...props}
      >
        <span className={cn("flex items-center gap-2", (isLoading || isSuccess) && "opacity-0")}>
          {children}
        </span>
        
        {isLoading && !isSuccess && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        )}
        
        {isSuccess && (
          <div className="absolute inset-0 flex items-center justify-center">
            <CheckCircle2 className="h-5 w-5" />
          </div>
        )}
      </button>
    );
  }
);
AuthButton.displayName = "AuthButton";
