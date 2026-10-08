---
version: 1
slug: "apps-plataforma-app-page-tsx"
primary_target: "apps/plataforma/app/page.tsx"
related_targets: ["apps/plataforma/app/race.css","apps/plataforma/components/race/race-header.tsx","apps/plataforma/components/race/race-shell.tsx"]
---

# Portal UDK — Corrida em destaque

Mode: Persuade na Home; Read/Operate em consultas e acesso.
Scope: composição da Home, navegação e ritmo das páginas internas, preservando dados e fluxos.

## Direction contract

THESIS: A corrida real apresenta o campeonato; a próxima etapa conduz à inscrição.

OWN-WORLD: Azul quase preto, ciano, Archivo e imagem real sem texto sobreposto. Consultas claras com divisores finos.

STORY: Identificar UDK em Betim, localizar data/horário/traçado, participar ou consultar resultados.

FIRST VIEWPORT: Desktop 1440×1100: cabeçalho de 88px; abertura em 42/58%, nome e ações à esquerda, foto de 500px e ticket ciano à direita. Resumo da temporada abaixo. Até 1100px, split 44/56% e margens laterais totais de 48px. Até 760px, cabeçalho de 72px, margens totais de 40px e uma coluna. Mobile 390×844: título, ações, ticket e foto de 240px; informação da etapa aparece cedo. Até 380px, data e detalhes do ticket empilham para manter leitura em 320px.

FORM: Proposta A, seed d4dff423, comp .impeccable/mocks/beauty-20261006/a.png. Painel de decisão retornou optionId a; usuário também mandou continuar. Comps são capturas HTML; geração nativa falhou. Filtros/menu mantêm os fluxos existentes; abertura estática com Next Image, sem autoplay ou componente cliente de reprodução. A foto `/media/official/home/race-original.png` é um recorte da fonte histórica, com procedência no manifesto e no PNG; o poster anterior continua em outras superfícies.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Evidence and procedural status

A captura `.impeccable/build/hero-repro.png` tem 1440×1100. A medição `.impeccable/review/beauty-20261008/diff-current/report.json` registra match global de 94.57% e da fotografia de 98.35%. A revisão independente corroborou a origem histórica da foto e distinguiu fidelidade visual de encerramento do workflow. Esses números descrevem essa captura; não substituem a revisão das correções seguintes.

O estado `.impeccable/build/state.json` mantém `plates` aberto por um falso positivo do gate de geração: comp HTML e implementação usam a mesma fotografia real. `.impeccable/build/source-photo-exception.md` documenta a limitação. Nenhum `--force` foi usado; esta evidência não fecha o gate nem afirma validação de todas as abas autenticadas.
