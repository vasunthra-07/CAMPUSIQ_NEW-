import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface AnimatedNumberProps {
  value: number;
  suffix?: string;
  prefix?: string;
  duration?: number;
  className?: string;
  decimals?: number;
}

export function AnimatedNumber({ value, suffix = "", prefix = "", duration = 1000, className, decimals = 0 }: AnimatedNumberProps) {
  const [display, setDisplay] = useState(0);
  const rafRef = useRef<number>();
  const startRef = useRef<number>();

  useEffect(() => {
    const start = 0;
    const end = value;
    startRef.current = undefined;

    const animate = (timestamp: number) => {
      if (!startRef.current) startRef.current = timestamp;
      const progress = Math.min((timestamp - startRef.current) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setDisplay(parseFloat((start + (end - start) * eased).toFixed(decimals)));
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      }
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [value, duration, decimals]);

  return (
    <span className={cn("tabular-nums", className)}>
      {prefix}{decimals > 0 ? display.toFixed(decimals) : Math.round(display)}{suffix}
    </span>
  );
}
