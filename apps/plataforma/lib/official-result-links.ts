export const officialResultPdf = {
  insanos: "/resultados/udk-2026-1a-etapa-ultra-insanos.pdf",
  rapidos: "/resultados/udk-2026-1a-etapa-ultras-rapidos.pdf",
  segundaEtapaInsanos: "/resultados/udk-2026-2a-etapa-ultra-insanos-corrida.pdf",
  segundaEtapaRapidos: "/resultados/udk-2026-2a-etapa-ultras-rapidos-corrida.pdf",
} as const;

export type OfficialResultCategory = keyof typeof officialResultPdf;

export function officialResultPdfForCategory(category: string): string | null {
  if (category === "insanos" || category === "rapidos") {
    return officialResultPdf[category];
  }
  return null;
}

export function officialResultPdfForResult(category: string, startsAt: string | null): string | null {
  if (startsAt?.startsWith("2026-09-08")) {
    return category === "insanos"
      ? officialResultPdf.segundaEtapaInsanos
      : category === "rapidos"
        ? officialResultPdf.segundaEtapaRapidos
        : null;
  }
  return officialResultPdfForCategory(category);
}
