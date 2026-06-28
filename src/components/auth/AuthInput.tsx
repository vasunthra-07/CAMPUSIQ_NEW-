import { InputHTMLAttributes, forwardRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Eye, EyeOff } from "lucide-react";

export interface AuthInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: boolean;
}

export const AuthInput = forwardRef<HTMLInputElement, AuthInputProps>(
  ({ className, label, error, type, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === "password";
    const inputType = isPassword ? (showPassword ? "text" : "password") : type;

    return (
      <div className="space-y-1.5 w-full">
        <label className="text-sm font-medium text-foreground">
          {label}
        </label>
        <div className="relative">
          <input
            type={inputType}
            className={cn(
              "flex h-11 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground transition-all duration-200",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary",
              "disabled:cursor-not-allowed disabled:opacity-50",
              "hover:border-border/80",
              error && "border-destructive focus-visible:ring-destructive/20 focus-visible:border-destructive",
              className
            )}
            ref={ref}
            {...props}
          />
          {isPassword && (
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground transition-colors"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          )}
        </div>
      </div>
    );
  }
);
AuthInput.displayName = "AuthInput";
