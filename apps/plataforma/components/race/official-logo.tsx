type LogoVariant = "principal" | "negative" | "dark" | "mark-light" | "mark-dark";

const logoSources: Record<LogoVariant, string> = {
  principal: "/brand/udk-logo-principal.svg",
  negative: "/brand/udk-logo-negativa.svg",
  dark: "/brand/udk-logo-monocromatica-escura.svg",
  "mark-light": "/brand/udk-marca-branca.svg",
  "mark-dark": "/brand/udk-marca-escura.svg",
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
      height={compact ? width : Math.round(width * 0.31)}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
    />
  );
}
