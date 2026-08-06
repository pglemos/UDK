import type { PublicContent, PublicSponsor, PublicTerm } from "./public-content";

export const fallbackNews: PublicContent[] = [
  {
    slug: "calendario-oficial-udk-2026",
    title: "Calendário oficial da temporada UDK 2026",
    summary: "Cinco encontros em Betim, incluindo duas provas de Endurance e a final de dezembro.",
    content: "A temporada UDK 2026 reúne etapas regulares e provas de Endurance no Kartódromo Internacional de Betim.",
    category: "Notícia",
    coverImageUrl: "/media/official/news/news-01.webp",
    publishedAt: "2026-07-30T12:00:00-03:00",
    readingMinutes: 2,
  },
  {
    slug: "categorias-rapidos-insanos",
    title: "Ultras Rápidos e Ultras Insanos no mesmo grid",
    summary: "Categorias distintas, uma única cultura de pista: evolução, respeito e disputa limpa.",
    content: "O portal organiza a temporada por categoria e mantém classificação, pilotos e calendário em consulta pública.",
    category: "Campeonato",
    coverImageUrl: "/media/official/news/news-02.webp",
    publishedAt: "2026-07-28T12:00:00-03:00",
    readingMinutes: 2,
  },
  {
    slug: "plataforma-oficial-udk",
    title: "Plataforma oficial UDK entra no ar",
    summary: "Calendário, classificação, pilotos, resultados e inscrição reunidos em uma experiência única.",
    content: "A plataforma oficial do UDK centraliza as informações públicas e os fluxos de participação do campeonato.",
    category: "Comunicado",
    coverImageUrl: "/media/official/news/news-03.webp",
    publishedAt: "2026-07-26T12:00:00-03:00",
    readingMinutes: 2,
  },
  {
    slug: "proxima-etapa-endurance",
    title: "Endurance abre a sequência final da temporada",
    summary: "A prova de agosto exige consistência, estratégia e trabalho de equipe sob as luzes de Betim.",
    content: "A próxima etapa prevista no calendário é uma prova de Endurance no traçado 01 invertido com chicane.",
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
    logoUrl: "/sponsors/grupo-emtel.webp",
    websiteUrl: "https://www.instagram.com/grupoemtel/",
    tier: "Patrocinador oficial",
  },
  {
    name: "Firepit Brasil",
    slug: "firepit-brasil",
    logoUrl: "/sponsors/firepit-brasil.webp",
    websiteUrl: "https://www.instagram.com/firepitbrasil/",
    tier: "Patrocinador oficial",
  },
  {
    name: "Guicosmos TV",
    slug: "guicosmos-tv",
    logoUrl: "/sponsors/guicosmos-tv.webp",
    websiteUrl: "https://www.instagram.com/guicosmos_tv/",
    tier: "Patrocinador oficial",
  },
  {
    name: "AKAMIG",
    slug: "akamig",
    logoUrl: "/sponsors/akamig.webp",
    websiteUrl: "https://www.instagram.com/akamigkart/",
    tier: "Patrocinador oficial",
  },
  {
    name: "TransferMix",
    slug: "transfermix",
    logoUrl: "/sponsors/transfermix.webp",
    websiteUrl: "https://www.instagram.com/transfermixbrindes/",
    tier: "Patrocinador oficial",
  },
  {
    name: "Veste Custom Wear",
    slug: "veste-custom-wear",
    logoUrl: "/sponsors/veste-custom-wear.webp",
    websiteUrl: "https://www.instagram.com/vestecw/",
    tier: "Patrocinador oficial",
  },
  {
    name: "Vintage São Francisco",
    slug: "vintage-sao-francisco",
    logoUrl: "/sponsors/vintage-sao-francisco.webp",
    websiteUrl: "https://www.instagram.com/vinagreorganico/",
    tier: "Patrocinador oficial",
  },
];

export const fallbackRegulations: PublicTerm[] = [
  {
    id: "public-summary-2026",
    title: "Resumo público do campeonato UDK 2026",
    version: 1,
    content: [
      "01. DISPOSIÇÕES GERAIS\nO UDK promove competição organizada, respeito entre pilotos e cumprimento das orientações da direção de prova.",
      "02. INSCRIÇÕES E CATEGORIAS\nA participação depende de cadastro, enquadramento na categoria e confirmação da organização.",
      "03. PONTUAÇÃO E RESULTADOS\nClassificações e resultados passam a valer após publicação oficial na plataforma.",
      "04. CONDUTA E PENALIDADES\nOcorrências são analisadas pela organização conforme as regras vigentes da temporada.",
    ].join("\n\n"),
    effectiveAt: "2026-07-26T00:00:00-03:00",
    status: "summary",
    downloadUrl: null,
  },
];
