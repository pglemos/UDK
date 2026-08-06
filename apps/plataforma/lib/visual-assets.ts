import { isGenericMediaSource } from "./media-policy";

export type PremiumVisual = {
  src: string;
  alt: string;
  position: string;
};

export type HomeHeroMedia = {
  poster: string;
  mobile: string;
  video: string;
};

export const homeHeroMedia: HomeHeroMedia = {
  poster: "/media/official/home/hero-desktop.webp",
  mobile: "/media/official/home/hero-mobile.webp",
  video: "/media/official/home/hero-loop.mp4",
};

export const premiumVisuals = {
  hero: {
    src: homeHeroMedia.poster,
    alt: "Karts do UDK cruzando a linha de chegada no Kartódromo de Betim",
    position: "50% center",
  },
  manifesto: {
    src: "/media/official/heroes/pilotos.webp",
    alt: "Pilotos do UDK reunidos durante a temporada",
    position: "50% center",
  },
  community: {
    src: "/media/official/heroes/regulamento.webp",
    alt: "Pilotos reunidos no briefing oficial do UDK",
    position: "50% center",
  },
  news: {
    src: "/media/official/news/news-01.webp",
    alt: "Karts do UDK em disputa durante uma prova noturna",
    position: "50% center",
  },
  paddock: {
    src: "/media/official/heroes/inscricao.webp",
    alt: "Pilotos se preparando para entrar na pista",
    position: "50% center",
  },
  race: {
    src: "/media/official/heroes/classificacao.webp",
    alt: "Disputa de posição entre karts do UDK",
    position: "50% center",
  },
  detail: {
    src: "/media/official/heroes/login.webp",
    alt: "Detalhes de um kart preparado para a etapa",
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

const stageVisuals = [
  {
    src: "/media/official/stages/stage-01.webp",
    alt: "Karts do UDK cruzando a linha de chegada",
    position: "50% center",
  },
  {
    src: "/media/official/stages/stage-02.webp",
    alt: "Kart do UDK acelerando durante uma etapa",
    position: "50% center",
  },
  {
    src: "/media/official/stages/stage-03.webp",
    alt: "Ambiente de pista em uma etapa do UDK",
    position: "50% center",
  },
  {
    src: "/media/official/stages/stage-04.webp",
    alt: "Disputa de kart em uma etapa do UDK",
    position: "50% center",
  },
  {
    src: "/media/official/stages/stage-05.webp",
    alt: "Pelotão de karts do UDK em pista",
    position: "50% center",
  },
] as const satisfies readonly PremiumVisual[];

const driverVisuals = [
  {
    src: "/media/official/drivers/fallback-01.webp",
    alt: "Piloto do UDK em ação na pista",
    position: "50% center",
  },
  {
    src: "/media/official/drivers/fallback-02.webp",
    alt: "Piloto do UDK durante uma etapa",
    position: "50% center",
  },
  {
    src: "/media/official/drivers/fallback-03.webp",
    alt: "Piloto do UDK em uma corrida noturna",
    position: "50% center",
  },
] as const satisfies readonly PremiumVisual[];

const newsVisuals = [
  {
    src: "/media/official/news/news-01.webp",
    alt: "Disputa noturna entre karts do UDK",
    position: "50% center",
  },
  {
    src: "/media/official/news/news-02.webp",
    alt: "Briefing oficial com pilotos do UDK",
    position: "50% center",
  },
  {
    src: "/media/official/news/news-03.webp",
    alt: "Painel de cronometragem do UDK",
    position: "50% center",
  },
] as const satisfies readonly PremiumVisual[];

const pageHeroVisuals: Record<string, PremiumVisual> = {
  "01": {
    src: "/media/official/heroes/calendario.webp",
    alt: "Grid do UDK antes de uma etapa",
    position: "50% center",
  },
  "02": {
    src: "/media/official/heroes/classificacao.webp",
    alt: "Disputa de posição durante uma prova do UDK",
    position: "50% center",
  },
  "03": {
    src: "/media/official/heroes/resultados.webp",
    alt: "Painel de cronometragem e resultados do UDK",
    position: "50% center",
  },
  "04": {
    src: "/media/official/heroes/pilotos.webp",
    alt: "Pilotos do UDK no paddock",
    position: "50% center",
  },
  "05": {
    src: "/media/official/heroes/noticias.webp",
    alt: "Bastidores de uma etapa do UDK",
    position: "50% center",
  },
  "06": {
    src: "/media/official/heroes/regulamento.webp",
    alt: "Briefing oficial antes da corrida",
    position: "50% center",
  },
  "07": {
    src: "/media/official/heroes/inscricao.webp",
    alt: "Preparação de piloto para entrar na pista",
    position: "50% center",
  },
  login: {
    src: "/media/official/heroes/login.webp",
    alt: "Detalhes de um kart preparado para a etapa",
    position: "50% center",
  },
};

export function resolveVisualSource(
  source: string | null | undefined,
  fallback: PremiumVisual,
): string {
  const normalized = source?.trim();
  if (!normalized || isGenericMediaSource(normalized)) {
    return fallback.src;
  }
  return normalized;
}

export function pageHeroVisual(index: string): PremiumVisual {
  return pageHeroVisuals[index] ?? premiumVisuals.race;
}

export function driverVisual(seed = 0): PremiumVisual {
  return driverVisuals[Math.abs(seed) % driverVisuals.length] ?? premiumVisuals.paddock;
}

export function stageVisual(index: number): PremiumVisual {
  return stageVisuals[Math.abs(index) % stageVisuals.length] ?? premiumVisuals.hero;
}

export function newsVisual(index = 0): PremiumVisual {
  return newsVisuals[Math.abs(index) % newsVisuals.length] ?? premiumVisuals.news;
}
