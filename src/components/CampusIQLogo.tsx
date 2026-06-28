interface CampusIQLogoProps {
  /** Visual size preset */
  size?: "sm" | "md" | "lg" | "xl";
  /** "dark" = for dark/navy backgrounds; "light" = for light backgrounds */
  variant?: "dark" | "light";
  /** Hide the subtitle "Campus Operating System" */
  hideSubtitle?: boolean;
  className?: string;
}

const SIZE_MAP = {
  sm:  { height: 28 },
  md:  { height: 36 },
  lg:  { height: 44 },
  xl:  { height: 56 },
};

export function CampusIQLogo({
  size = "md",
  variant = "light",
  hideSubtitle = false,
  className = "",
}: CampusIQLogoProps) {
  const s = SIZE_MAP[size];

  return (
    <div className={`flex items-center ${className}`}>
      <img
        src="/CIT.png"
        alt="Chennai Institute of Technology"
        style={{ height: s.height, width: "auto" }}
      />
    </div>
  );
}
