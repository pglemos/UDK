function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  const firstWord = words[0];
  if (!firstWord) return "UD";
  if (words.length === 1) return firstWord.slice(0, 2).toUpperCase();
  return `${words[0]?.[0] ?? ""}${words.at(-1)?.[0] ?? ""}`.toUpperCase();
}

export function DriverPlaceholder({
  name,
  className = "",
  decorative = false,
}: {
  name: string;
  className?: string;
  decorative?: boolean;
}) {
  const label = `Foto de ${name} não publicada`;

  return (
    <div
      className={`tg-driver-placeholder${className ? ` ${className}` : ""}`}
      role={decorative ? undefined : "img"}
      aria-label={decorative ? undefined : label}
      aria-hidden={decorative ? true : undefined}
    >
      <span aria-hidden="true">{initials(name)}</span>
      <small>Perfil sem foto</small>
    </div>
  );
}
