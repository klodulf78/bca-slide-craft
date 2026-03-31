interface BCALogoProps {
  variant?: "dark" | "white";
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function BCALogo({ variant = "dark", size = "md", className = "" }: BCALogoProps) {
  const color = variant === "dark" ? "hsl(240 100% 11%)" : "#FFFFFF";
  const accentColor = variant === "dark" ? "hsl(233 96% 44%)" : "hsl(191 100% 58%)";
  const sizes = { sm: 80, md: 120, lg: 200 };
  const w = sizes[size];

  return (
    <svg width={w} viewBox="0 0 200 50" fill="none" className={className}>
      <text x="0" y="38" fill={color} fontFamily="Raleway, sans-serif" fontWeight="700" fontSize="44" letterSpacing="-1">
        BCA
      </text>
      <rect x="108" y="36" width="40" height="3" rx="1.5" fill={accentColor} />
    </svg>
  );
}
