interface CampusIQLogoProps {
  /** Visual size preset */
  size?: "sm" | "md" | "lg" | "xl";
  /** "dark" = for dark/navy backgrounds (white text); "light" = for light backgrounds (dark text) */
  variant?: "dark" | "light";
  /** Hide the subtitle "Campus Operating System" */
  hideSubtitle?: boolean;
  className?: string;
}

const SIZE_MAP = {
  sm:  { icon: 28, text: "text-sm",  sub: "text-[9px]",  gap: "gap-2" },
  md:  { icon: 36, text: "text-[15px]", sub: "text-[10px]", gap: "gap-2.5" },
  lg:  { icon: 44, text: "text-lg",  sub: "text-[11px]", gap: "gap-3" },
  xl:  { icon: 56, text: "text-2xl", sub: "text-xs",     gap: "gap-3.5" },
};

export function CampusIQLogo({
  size = "md",
  variant = "light",
  hideSubtitle = false,
  className = "",
}: CampusIQLogoProps) {
  const s = SIZE_MAP[size];
  const isOnDark = variant === "dark";

  return (
    <div className={`flex items-center ${s.gap} ${className}`}>
      {/* ── Icon mark ── */}
      <svg
        width={s.icon}
        height={s.icon}
        viewBox="0 0 44 44"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        style={{ flexShrink: 0 }}
      >
        {/* Background square */}
        <rect width="44" height="44" rx="11" fill="hsl(219 62% 28%)" />

        {/* Left building */}
        <rect x="8" y="26" width="7" height="14" rx="1.5" fill="white" fillOpacity="0.55" />

        {/* Center building — tallest */}
        <rect x="18" y="15" width="8" height="25" rx="1.5" fill="white" />

        {/* Right building */}
        <rect x="29" y="21" width="7" height="19" rx="1.5" fill="white" fillOpacity="0.55" />

        {/* Amber beacon */}
        <circle cx="22" cy="11.5" r="2.8" fill="hsl(38 95% 52%)" />
      </svg>

      {/* ── Wordmark ── */}
      <div>
        <p
          className={`font-bold leading-tight tracking-tight ${s.text}`}
          style={{ letterSpacing: "-0.025em" }}
        >
          <span style={{ color: isOnDark ? "#ffffff" : "hsl(220 35% 12%)" }}>
            Campus
          </span>
          <span
            style={{
              color: isOnDark ? "hsl(38 95% 52%)" : "hsl(219 62% 28%)",
              fontWeight: 800,
            }}
          >
            IQ
          </span>
        </p>
        {!hideSubtitle && (
          <p
            className={`font-medium uppercase tracking-widest ${s.sub}`}
            style={{ color: isOnDark ? "hsl(215 18% 55%)" : "hsl(215 18% 48%)" }}
          >
            Campus Operating System
          </p>
        )}
      </div>
    </div>
  );
}
