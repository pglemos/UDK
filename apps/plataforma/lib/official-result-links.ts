export const officialResultPdf = {
  endurance: "/resultados/udk-2026-1a-etapa-endurance-geral.pdf",
  corrida1: "/resultados/udk-2026-2a-etapa-corrida-1-geral.pdf",
  corrida2: "/resultados/udk-2026-2a-etapa-corrida-2-geral.pdf",
} as const;

export type OfficialResultKey = keyof typeof officialResultPdf;

export function officialResultPdfForResult(sessionName: string, title = ""): string | null {
  const source = `${sessionName} ${title}`.toLocaleLowerCase("pt-BR");
  if (source.includes("endurance")) return officialResultPdf.endurance;
  if (source.includes("corrida 1")) return officialResultPdf.corrida1;
  if (source.includes("corrida 2")) return officialResultPdf.corrida2;
  return null;
}
