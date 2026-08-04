export type PremiumVisual = {
  src: string;
  alt: string;
  position: string;
};

export const premiumVisuals = {
  hero: {
    src: "https://images.unsplash.com/photo-1773909722972-1f5e533798b8?auto=format&fit=crop&fm=webp&q=84&w=2400",
    alt: "Disputa de kart em um circuito ao ar livre",
    position: "52% center",
  },
  manifesto: {
    src: "https://images.unsplash.com/photo-1772480611852-68ee605fba72?auto=format&fit=crop&fm=webp&q=84&w=2400",
    alt: "Pilotos e karts reunidos antes de uma sessão na pista",
    position: "50% center",
  },
  community: {
    src: "https://images.unsplash.com/photo-1649095381023-48ee8e4a8aba?auto=format&fit=crop&fm=webp&q=84&w=2400",
    alt: "Competidores de kart compartilhando o ambiente de pista",
    position: "50% 48%",
  },
  news: {
    src: "https://images.unsplash.com/photo-1774071900500-2cf042f345e4?auto=format&fit=crop&fm=webp&q=84&w=2400",
    alt: "Kart contornando uma curva em alta velocidade",
    position: "56% center",
  },
  paddock: {
    src: "https://images.unsplash.com/photo-1774088047169-ad3e4636866e?auto=format&fit=crop&fm=webp&q=84&w=2400",
    alt: "Piloto de kart acelerando durante uma prova",
    position: "62% center",
  },
  race: {
    src: "https://images.unsplash.com/photo-1773909722972-1f5e533798b8?auto=format&fit=crop&fm=webp&q=84&w=2400",
    alt: "Disputa de kart em um circuito ao ar livre",
    position: "52% center",
  },
  detail: {
    src: "https://images.unsplash.com/photo-1505570554449-69ce7d4fa36b?auto=format&fit=crop&fm=webp&q=84&w=2400",
    alt: "Kart preparado para uma sessão em circuito",
    position: "50% center",
  },
} satisfies Record<string, PremiumVisual>;

export const menuVisuals = [
  premiumVisuals.hero,
  premiumVisuals.race,
  premiumVisuals.news,
  premiumVisuals.manifesto,
  premiumVisuals.community,
  premiumVisuals.paddock,
] as const satisfies readonly PremiumVisual[];

const stageVisuals: PremiumVisual[] = [
  premiumVisuals.race,
  premiumVisuals.paddock,
  premiumVisuals.detail,
  premiumVisuals.manifesto,
  premiumVisuals.news,
];

const legacyPlaceholders = [
  "/media/udk-race-hero.webp",
  "udk-race-hero.webp",
  "photo-1752348512364-fac974d4d5b0",
  "photo-1560990816-bb30289c6611",
];

export function resolveVisualSource(
  source: string | null | undefined,
  fallback: PremiumVisual,
): string {
  const normalized = source?.trim();
  if (!normalized || legacyPlaceholders.some((placeholder) => normalized.includes(placeholder))) {
    return fallback.src;
  }
  return normalized;
}

export function stageVisual(index: number): PremiumVisual {
  return stageVisuals[Math.abs(index) % stageVisuals.length] ?? premiumVisuals.hero;
}

export function newsVisual(index = 0): PremiumVisual {
  const visuals = [premiumVisuals.news, premiumVisuals.race, premiumVisuals.paddock];
  return visuals[Math.abs(index) % visuals.length] ?? premiumVisuals.news;
}
