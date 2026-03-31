interface BCALogoProps {
  variant?: "blue" | "white";
  className?: string;
}

export function BCALogo({ variant = "blue", className = "" }: BCALogoProps) {
  const src = variant === "white" ? "/bca-logo-white.svg" : "/bca-logo-blue.svg";
  return (
    <img src={src} alt="BCA Logo" className={className} />
  );
}
