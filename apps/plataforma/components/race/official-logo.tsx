type LogoVariant = "principal" | "negative" | "dark" | "mark-light" | "mark-dark";

const logoSources: Record<LogoVariant, string> = {
  principal: "/brand/udk-logo-negativa.png",
  negative: "/brand/udk-logo-negativa.png",
  dark: "/brand/udk-logo-negativa.png",
  "mark-light": "/icons/udk-avatar-512.png",
  "mark-dark": "/icons/udk-avatar-512.png",
};

export function OfficialLogo({
  variant = "negative",
  width = 176,
  className,
  priority = false,
}: {
  variant?: LogoVariant;
  width?: number;
  className?: string;
  priority?: boolean;
}) {
  const compact = variant === "mark-light" || variant === "mark-dark";

  return (
    <img
      src={logoSources[variant]}
      alt="Ultras do Kart"
      className={className}
      width={width}
      height={compact ? width : Math.round(width * 0.25)}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
    />
  );
}
