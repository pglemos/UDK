const genericMediaMarkers = [
  "images.unsplash.com",
  "source.unsplash.com",
  "unsplash.com",
  "images.pexels.com",
  "pexels.com",
  "cdn.pixabay.com",
  "pixabay.com",
  "picsum.photos",
  "loremflickr.com",
  "/media/udk-race-hero.webp",
  "udk-race-hero.webp",
  "photo-1752348512364-fac974d4d5b0",
  "photo-1560990816-bb30289c6611",
] as const;

export function isGenericMediaSource(source: string | null | undefined): boolean {
  const normalized = source?.trim().toLocaleLowerCase("en-US");
  if (!normalized) return false;
  return genericMediaMarkers.some((marker) => normalized.includes(marker));
}

export function sanitizePublicMediaSource(source: string | null | undefined): string | null {
  const normalized = source?.trim();
  if (!normalized || isGenericMediaSource(normalized)) return null;
  return normalized;
}

export const genericMediaHosts = genericMediaMarkers;
