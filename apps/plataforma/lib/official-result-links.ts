export const officialResultPdf = {
  insanos: "/resultados/udk-2026-1a-etapa-ultra-insanos.pdf",
  rapidos: "/resultados/udk-2026-1a-etapa-ultras-rapidos.pdf",
} as const;

export type OfficialResultCategory = keyof typeof officialResultPdf;

export function officialResultPdfForCategory(category: string): string | null {
  if (category === "insanos" || category === "rapidos") {
    return officialResultPdf[category];
  }
  return null;
}
