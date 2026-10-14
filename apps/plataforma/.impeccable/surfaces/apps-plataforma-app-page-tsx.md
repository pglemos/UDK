---
version: 2
slug: "apps-plataforma-app-page-tsx"
primary_target: "apps/plataforma/app/page.tsx"
related_targets: ["apps/plataforma/app/race.css","apps/plataforma/components/race/home-race-opening.tsx"]
---

# Portal UDK — abertura do filme oficial

Mode: Persuade na Home; Read/Operate nas consultas e no acesso existentes.
Scope: abertura da Home. Preservar tokens globais, navegação, dados, integrações e demais superfícies.
Authority: PRODUCT.md e DESIGN.md preservam produto e identidade. A referência visual local é o filme fornecido pelo usuário em `/Users/pedroguilherme/Downloads/ultras-led-film/index.html` e `look-v2/sheet.jpg`; o contrato atual está em `.impeccable/review/film-opening-20261014/contract.md`.

## Direction contract

THESIS: Os pilotos oficiais apresentam a identidade UDK; inscrição, resultados e próxima etapa mantêm destinos reais.

OWN-WORLD: A abertura adapta a linguagem do filme: Archivo 900 inclinado, azul profundo, branco, ciano e quadriculado inclinado. Usa retratos oficiais existentes, nomes e links dos pilotos. Não cria rostos, patrocinadores, slogans ou fatos esportivos. O quadriculado e o movimento são decisões locais desta abertura, não uma nova identidade global.

STORY: Nome e ações apresentam o campeonato; pares de pilotos permitem explorar Ultras Rápidos e Ultras Insanos; a faixa transparente com divisores e data ciano traz a próxima etapa e sua ação real. Classificação, calendário, notícias e parceiros continuam abaixo. O filme fica disponível por ação explícita.

FIRST VIEWPORT: Desktop: título e ações à esquerda, dois retratos à direita, com o segundo deslocado 32px para baixo. A grade usa 1fr/1.05fr com intervalo de 64px; até 1100px passa a 44/56%. Até 760px, título e ações antecedem os retratos em uma coluna com intervalo de 24px. A faixa da próxima etapa ocupa a largura abaixo da composição. O quadriculado atravessa o fundo da abertura inteira; não há faixa de vídeo 4:1 isolada nem repetição da fotografia antiga.

FORM: Adaptação precisamente especificada da referência fornecida, conforme `new-work.md`, seção 3; não há comp gerada nem nova escolha de identidade. O título em duas linhas usa Archivo 900 itálico, branco/ciano, `clamp(4rem, 7.8vw, 6rem)` e entrelinha 0.94; até 1100px usa 4rem, e até 760px usa `clamp(3.25rem, 14vw, 4.5rem)`. Essas variantes não redefinem os tokens tipográficos globais. Os retratos ficam em campos 3:4 com `object-fit: cover`; nome e link aparecem fora da imagem. A coleção recebe somente pilotos com mídia oficial e preserva o filtro por categoria.

FINISH: Registrar evidência e revisão da implementação atual; documentação e contrato não constituem aprovação visual.

## Motion and interaction

- Pares de retratos avançam a cada 6,5 segundos quando há mais de uma página. Categoria, anterior/próximo e pausa explícita são botões com rótulos acessíveis; a categoria ativa usa `aria-pressed`, texto claro e linha ciano.
- Hover de mouse, foco dentro da galeria, pausa explícita, aba oculta ou filme aberto suspendem a rotação. Movimento reduzido desliga a rotação e as entradas; os controles manuais permanecem disponíveis.
- Entradas combinam translação horizontal, desfoque e desaceleração `cubic-bezier(0.16, 1, 0.3, 1)`: título em 900/1100ms, retratos em 850ms. O hover do retrato usa escala 1.035 em 600ms com a curva existente; movimento reduzido remove a transição.
- “Assistir ao filme” abre um `dialog` nativo de tela cheia. O vídeo recebe o `src` somente nessa ação; usa `preload="none"`, controles nativos e reprodução inline. A visualização preserva a proporção 2048×512 com `object-fit: contain`. Fechar pausa o vídeo e libera a rotação conforme os demais estados.
- Próxima etapa, data, horário, traçado e ação continuam vindos das funções existentes; metadados ausentes recebem os textos de fallback existentes.

## Evidence and procedural status

Este registro descreve o código local em `page.tsx`, `race.css` e `home-race-opening.tsx`. Não declara publicação nem aprovação visual da abertura atual. Inspeções e capturas da adaptação ficam em `.impeccable/review/film-opening-20261014`; seu resultado deve ser consultado junto ao contrato atual.

A proposta A, seed `d4dff423`, comp `.impeccable/mocks/beauty-20261006/a.png`, e as medições de outubro de 2026 sobre o hero fotográfico são evidência histórica da composição anterior. Não avaliam nem aprovam esta adaptação do filme. O registro histórico de `plates` em `.impeccable/build/state.json` e `.impeccable/build/source-photo-exception.md` também não deve ser apresentado como gate encerrado pela mudança atual.
