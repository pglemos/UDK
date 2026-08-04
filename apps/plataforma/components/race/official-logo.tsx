import { officialBrandAssets } from "../../lib/official-brand-assets";

type LogoVariant = "principal" | "negative" | "dark" | "mark-light" | "mark-dark";

const logoSources: Record<LogoVariant, string> = {
  principal: officialBrandAssets.wordmarkWhite,
  negative: officialBrandAssets.wordmarkWhite,
  dark: officialBrandAssets.wordmarkDark,
  "mark-light": officialBrandAssets.avatar,
  "mark-dark": officialBrandAssets.avatar,
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
      alt="UDK"
      className={className}
      width={width}
      height={compact ? width : Math.round(width * 0.201)}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
    />
  );
}
