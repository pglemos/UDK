/**
 * Catálogo tirado do Regulamento Oficial UDK 2026 (2ª temporada). Alimenta as listas de
 * Penalidades e Ocorrências no painel. Quem lança pode escolher um item (que preenche
 * resumo, efeito e artigo) ou escrever à mão.
 */

export type PenaltyCatalogItem = {
  code: string;
  name: string;
  article: string;
  summary: string;
  effect: string;
};

export const penaltyCatalog: PenaltyCatalogItem[] = [
  {
    code: "BW-01",
    name: "Bandeira preta e branca (1ª advertência)",
    article: "Art. 22, item 1",
    summary: "Bandeira preta e branca (1ª advertência, Art. 22).",
    effect: "+5 segundos no tempo final da prova e -10 pontos na pontuação geral.",
  },
  {
    code: "ADV-02",
    name: "2ª advertência na mesma etapa",
    article: "Art. 22, item 2",
    summary: "Segunda advertência na mesma etapa (Art. 22).",
    effect: "Desclassificação da etapa e -15 pontos na pontuação geral.",
  },
  {
    code: "BP-01",
    name: "Bandeira preta (infração grave ou atitude antidesportiva)",
    article: "Art. 22, item 3",
    summary: "Bandeira preta por infração grave ou atitude antidesportiva (Art. 22).",
    effect: "Desclassificação imediata da prova e -20 pontos na pontuação geral.",
  },
  {
    code: "PESO-01",
    name: "Peso abaixo do mínimo, recusa ou peso dissimulado na pesagem",
    article: "Art. 16 e 17, § 4º",
    summary: "Infração grave de pesagem: peso abaixo de 100 kg, recusa ou peso dissimulado (Art. 17).",
    effect: "Desclassificação imediata da etapa.",
  },
  {
    code: "SP-01",
    name: "Ausência ou atraso na Super Pole",
    article: "Art. 11, § 2º",
    summary: "Ausência ou atraso injustificado na tomada de tempo (Super Pole).",
    effect: "Perda do tempo de qualificação; largada da última posição do grid da categoria.",
  },
  {
    code: "GRID-01",
    name: "Troca facultativa de kart",
    article: "Art. 15, § 2º",
    summary: "Troca de kart por escolha do piloto (Art. 15).",
    effect: "Largada na última posição do grid.",
  },
  {
    code: "TROCA-04",
    name: "Troca de kart acima do limite de 3 no campeonato",
    article: "Art. 15, § 1º",
    summary: "Troca facultativa de kart além do limite de 03 trocas no campeonato.",
    effect: "Definido pela Comissão Organizadora (Art. 27).",
  },
  {
    code: "PIT-MISSING",
    name: "Parada obrigatória não realizada (Endurance)",
    article: "Art. 13, item 3",
    summary: "Parada de box obrigatória não realizada na Endurance.",
    effect: "-7 voltas no resultado da prova.",
  },
  {
    code: "PIT-INVALID",
    name: "Parada abaixo de 5 minutos (Endurance)",
    article: "Art. 13, item 4",
    summary: "Parada de box com tempo abaixo do mínimo de 05 minutos.",
    effect: "-7 voltas no resultado da prova.",
  },
  {
    code: "LARG-01",
    name: "Manobra imprudente na largada ou bloqueio antidesportivo",
    article: "Art. 26",
    summary: "Manobra imprudente na largada ou bloqueio antidesportivo (Art. 26).",
    effect: "Punição definida pela Direção de Prova, conforme a gravidade (Art. 22).",
  },
];

export type IncidentCatalogItem = { type: string; clause: string; severity: "low" | "medium" | "high" | "critical" };

export const incidentCatalog: IncidentCatalogItem[] = [
  { type: "Toque ou colisão entre karts", clause: "Art. 21 e 22", severity: "medium" },
  { type: "Manobra imprudente na largada", clause: "Art. 26", severity: "medium" },
  { type: "Bloqueio antidesportivo", clause: "Art. 26", severity: "medium" },
  { type: "Atitude antidesportiva", clause: "Art. 22, item 3", severity: "high" },
  { type: "Desrespeito à bandeira", clause: "Art. 21 e 22", severity: "medium" },
  { type: "Ausência ou atraso na Super Pole", clause: "Art. 11, § 2º", severity: "low" },
  { type: "Troca de kart", clause: "Art. 15", severity: "low" },
  { type: "Defeito mecânico no kart", clause: "Art. 15, § 3º", severity: "low" },
  { type: "Peso abaixo do mínimo", clause: "Art. 16 e 17", severity: "critical" },
  { type: "Irregularidade na pesagem", clause: "Art. 17, § 4º", severity: "critical" },
  { type: "Parada de box irregular (Endurance)", clause: "Art. 13", severity: "high" },
  { type: "Bandeira vermelha", clause: "Art. 13, item 6", severity: "low" },
];
