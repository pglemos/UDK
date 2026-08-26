import type { PublicContent, PublicSponsor, PublicTerm } from "./public-content";

export const fallbackNews: PublicContent[] = [
  {
    slug: "calendario-oficial-udk-2026",
    title: "Calendário oficial da temporada UDK 2026",
    summary:
      "Cinco encontros em Betim, incluindo duas provas de resistência e a final de dezembro.",
    content:
      "A temporada UDK 2026 reúne etapas regulares e provas de resistência no Kartódromo Internacional de Betim.",
    category: "Notícia",
    coverImageUrl: "/media/official/news/news-01.webp",
    publishedAt: "2026-07-30T12:00:00-03:00",
    readingMinutes: 2,
  },
  {
    slug: "categorias-rapidos-insanos",
    title: "Ultra Rápidos e Ultra Insanos",
    summary:
      "Categorias distintas, uma única cultura de pista: evolução, respeito e disputa limpa.",
    content:
      "O portal organiza a temporada por categoria e mantém classificação, pilotos e calendário em consulta pública.",
    category: "Campeonato",
    coverImageUrl: "/media/official/news/news-02.webp",
    publishedAt: "2026-07-28T12:00:00-03:00",
    readingMinutes: 2,
  },
  {
    slug: "plataforma-oficial-udk",
    title: "Plataforma oficial UDK entra no ar",
    summary:
      "Calendário, classificação, pilotos, resultados e inscrição reunidos em uma experiência única.",
    content:
      "A plataforma oficial do UDK centraliza as informações públicas e os fluxos de participação do campeonato.",
    category: "Comunicado",
    coverImageUrl: "/media/official/news/news-03.webp",
    publishedAt: "2026-07-26T12:00:00-03:00",
    readingMinutes: 2,
  },
  {
    slug: "proxima-etapa-endurance",
    title: "Resistência abre a sequência final da temporada",
    summary:
      "A prova de agosto exige consistência, estratégia e trabalho de equipe sob as luzes de Betim.",
    content:
      "A próxima etapa prevista no calendário é uma prova de resistência no traçado 01 invertido com chicane.",
    category: "Etapa",
    coverImageUrl: "/media/official/stages/stage-05.webp",
    publishedAt: "2026-07-25T12:00:00-03:00",
    readingMinutes: 2,
  },
];

export const fallbackSponsors: PublicSponsor[] = [
  {
    name: "Grupo Emtel",
    slug: "grupo-emtel",
    logoUrl: "/sponsors/grupo-emtel.svg",
    websiteUrl: "https://www.instagram.com/grupoemtel/",
    tier: "Patrocinador oficial",
  },
  {
    name: "Firepit Brasil",
    slug: "firepit-brasil",
    logoUrl: "/sponsors/firepit-brasil.svg",
    websiteUrl: "https://www.instagram.com/firepitbrasil/",
    tier: "Patrocinador oficial",
  },
  {
    name: "Grupo do Carro",
    slug: "grupo-do-carro",
    logoUrl: "/sponsors/grupo-do-carro.svg",
    websiteUrl: "",
    tier: "Patrocinador oficial",
  },
  {
    name: "TransferMix",
    slug: "transfermix",
    logoUrl: "/sponsors/transfermix.svg",
    websiteUrl: "https://www.instagram.com/transfermixbrindes/",
    tier: "Patrocinador oficial",
  },
  {
    name: "Veste Custom Wear",
    slug: "veste-custom-wear",
    logoUrl: "/sponsors/veste-custom-wear.svg",
    websiteUrl: "https://www.instagram.com/vestecw/",
    tier: "Patrocinador oficial",
  },
  {
    name: "Vintage São Francisco",
    slug: "vintage-sao-francisco",
    logoUrl: "/sponsors/vintage-sao-francisco.svg",
    websiteUrl: "https://www.instagram.com/vinagreorganico/",
    tier: "Patrocinador oficial",
  },
  {
    name: "Velho Oeste Clube de Tiro",
    slug: "velho-oeste",
    logoUrl: "/sponsors/velho-oeste.png",
    websiteUrl: "",
    tier: "Patrocinador oficial",
  },
];

export const fallbackFederations = [
  {
    name: "AKAMIG",
    slug: "akamig",
    logoUrl: "/sponsors/akamig.svg",
    websiteUrl: "https://www.instagram.com/akamigkart/",
    label: "Federação parceira",
  },
];

export const fallbackRegulations: PublicTerm[] = [
  {
    id: "public-summary-2026-v2",
    title: "Regulamento esportivo UDK 2026 — 2º semestre",
    version: 2,
    content: [
      "01. FORMATO DA TEMPORADA\nO campeonato possui 05 etapas. A 1ª e a 5ª etapas são provas de resistência de 01 hora em traçado único. As etapas 2, 3 e 4 são regulares e possuem 02 corridas cada: primeiro em sentido horário e depois em sentido anti-horário.",
      "02. RESULTADOS PONTUÁVEIS\nA temporada possui 08 resultados pontuáveis: 06 corridas regulares e 02 provas de resistência.",
      "03. DESCARTES\nA classificação final considera os 06 melhores resultados de cada piloto. Os 02 piores resultados entre os 08 eventos pontuáveis são descartados automaticamente. Até o sexto evento concluído não há descarte; após o sétimo evento é descartado o pior resultado; após o oitavo evento são descartados os dois piores resultados.",
      "04. PONTUAÇÃO DAS CORRIDAS REGULARES\nP1 50; P2 45; P3 42; P4 40; P5 38; P6 37; P7 36; P8 35; P9 34; P10 33; P11 32; P12 31; P13 30; P14 29; P15 28; P16 27; P17 26; P18 25; P19 24; P20 23; P21 22; P22 21; P23 20; P24 19; P25 18; P26 17; P27 16; P28 15; P29 14; P30 13; P31 12; P32 11; P33 10; P34 9; P35 8; P36 7; P37 6; P38 5; P39 4; P40 3; P41 2; P42 1. O total informativo da etapa regular é a soma da 1ª e da 2ª corridas. Para efeito de classificação e descarte, cada corrida é um resultado pontuável independente.",
      "05. PONTUAÇÃO DA RESISTÊNCIA\nP1 150; P2 145; P3 142; P4 140; P5 138. A partir do P6 a pontuação cai 01 ponto por posição: P6 137, P7 136 e assim sucessivamente até zero.",
      "06. BÔNUS\nEm cada corrida ou prova de resistência, o piloto recebe 01 ponto adicional pela pole position e 01 ponto adicional pela volta mais rápida.",
    ].join("\n\n"),
    effectiveAt: "2026-08-06T00:00:00-03:00",
    status: "summary",
    downloadUrl: null,
  },
];
