import type { PublicResult } from "./public-data";

type ResultLabelSource = Pick<PublicResult, "title" | "stageTitle" | "stageSlug" | "sessionName">;

function firstMatch(source: string, patterns: RegExp[]): string | null {
  for (const pattern of patterns) {
    const match = pattern.exec(source);
    if (match?.[1]) return match[1];
  }
  return null;
}

/** Returns the ordinal stage label embedded in an official result title/slug. */
export function resultStageLabel(result: ResultLabelSource): string {
  const source = `${result.title} ${result.stageSlug} ${result.stageTitle}`;
  const ordinal = firstMatch(source, [
    /(\d+)\s*(?:ª|º|°|a|o)\s*etapa/i,
    /(?:^|[-_\s])(?:etapa|stage)[-_\s]?(\d+)(?:[-_\s]|$)/i,
  ]);

  if (ordinal) return `${ordinal}ª etapa`;
  return result.stageTitle.trim() || "Etapa oficial";
}

/** Returns the concise session name used in indexes and headings. */
export function resultSessionLabel(result: ResultLabelSource): string {
  const source = `${result.sessionName} ${result.title}`.toLocaleLowerCase("pt-BR");
  if (source.includes("endurance")) return "Endurance";
  if (source.includes("corrida 1")) return "Corrida 1";
  if (source.includes("corrida 2")) return "Corrida 2";
  return result.sessionName.trim() || result.title.trim() || "Resultado oficial";
}

/** Gives every result a stable, archive-friendly heading. */
export function resultHeadingLabel(result: ResultLabelSource): string {
  const stage = resultStageLabel(result);
  const session = resultSessionLabel(result);
  return stage === session ? session : `${stage} · ${session}`;
}
