---
name: "Ultras do Kart"
description: "Azul escuro, ações ciano e consultas claras para o campeonato Ultras do Kart."
colors:
  cyan: "#28cce5"
  cyan-hover: "#69e9ff"
  cyan-deep: "#006577"
  black: "#081116"
  black-soft: "#101e26"
  surface-dark: "#152731"
  surface-dark-raised: "#203640"
  white: "#f7fafb"
  paper: "#f0f5f7"
  paper-muted: "#e7eef1"
  ink: "#14242d"
  muted-light: "#aabdc7"
  muted-dark: "#526772"
  placeholder-ink: "#538497"
  line-light: "#ffffff26"
  line-dark: "#14242d26"
  field-white: "#ffffff"
  canvas: "#edf2f4"
  operation-line: "#d6e0e5"
  success: "#176342"
  success-bg: "#e4f4eb"
  warning: "#80530a"
  warning-bg: "#fff3d8"
  danger: "#ae2933"
  danger-bg: "#fce9eb"
  registration-bg: "#e1faff"
typography:
  display:
    fontFamily: "Archivo, Arial, sans-serif"
    fontSize: "clamp(4rem, 7vw, 6rem)"
    fontWeight: 850
    lineHeight: 0.96
    letterSpacing: "-0.035em"
  headline:
    fontFamily: "Archivo, Arial, sans-serif"
    fontSize: "clamp(2.8rem, 5vw, 5rem)"
    fontWeight: 700
    lineHeight: 1.04
    letterSpacing: "-0.02em"
  title:
    fontFamily: "Archivo, Arial, sans-serif"
    fontSize: "clamp(1.7rem, 2.8vw, 2.8rem)"
    fontWeight: 700
    lineHeight: 1.04
    letterSpacing: "-0.02em"
  internal-headline:
    fontFamily: "Archivo, Arial, sans-serif"
    fontSize: "clamp(2.5rem, 4vw, 3.5rem)"
    fontWeight: 700
    lineHeight: 1.04
    letterSpacing: "-0.02em"
  subheading:
    fontFamily: "Archivo, Arial, sans-serif"
    fontSize: "clamp(1.3rem, 2vw, 1.9rem)"
    fontWeight: 700
    lineHeight: 1.04
    letterSpacing: "-0.02em"
  article-heading:
    fontFamily: "Archivo, Arial, sans-serif"
    fontSize: "clamp(3rem, 5vw, 5.5rem)"
    fontWeight: 700
    lineHeight: 1.04
    letterSpacing: "-0.02em"
  display-mobile:
    fontFamily: "Archivo, Arial, sans-serif"
    fontSize: "clamp(3.25rem, 14vw, 4.5rem)"
    fontWeight: 850
    lineHeight: 0.96
    letterSpacing: "-0.035em"
  operation-title:
    fontFamily: "Archivo, Arial, sans-serif"
    fontSize: "clamp(2rem, 3vw, 2.75rem)"
    fontWeight: 700
    lineHeight: 1.08
    letterSpacing: "-0.02em"
  metadata:
    fontFamily: "Archivo, Arial, sans-serif"
    fontSize: "0.75rem"
  body:
    fontFamily: "Archivo, Arial, sans-serif"
    fontSize: "0.875rem"
    lineHeight: 1.7
  label:
    fontFamily: "Archivo, Arial, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 600
    lineHeight: 1.4
  data:
    fontFamily: "Archivo, Arial, sans-serif"
    fontSize: "0.875rem"
  reading:
    fontSize: "1rem"
  section-compact:
    fontSize: "1.8rem"
  section-small:
    fontSize: "1.6rem"
  section-mobile:
    fontSize: "1.5rem"
  feature-title:
    fontSize: "2.6rem"
  identity-large:
    fontSize: "4.5rem"
  data-highlight:
    fontSize: "1.4rem"
  data-compact:
    fontSize: "1.3rem"
  context-title:
    fontSize: "1.125rem"
  row-title:
    fontSize: "1.1rem"
  data-prominent:
    fontSize: "1.9rem"
  state-title:
    fontSize: "2.3rem"
  editorial-mobile:
    fontSize: "3rem"
  mobile-subtitle:
    fontSize: "1.35rem"
  public-headline-mobile:
    fontSize: "2.7rem"
rounded:
  sharp: "0px"
  status: "3px"
  control: "4px"
  panel: "6px"
  operation: "8px"
  modal: "10px"
  editor: "16px"
  pill: "999px"
  circle: "50%"
spacing:
  "8": "8px"
  "12": "12px"
  "16": "16px"
  "18": "18px"
  "20": "20px"
  "24": "24px"
  "28": "28px"
  "32": "32px"
  "48": "48px"
  "64": "64px"
  "72": "72px"
  "80": "80px"
components:
  button-primary:
    backgroundColor: "{colors.cyan}"
    textColor: "{colors.black}"
    typography: "{typography.label}"
    rounded: "{rounded.control}"
    padding: "13px 22px"
    height: "48px"
  button-primary-hover:
    backgroundColor: "{colors.cyan-hover}"
  button-outline:
    backgroundColor: "transparent"
    textColor: "inherit"
    typography: "{typography.label}"
    rounded: "{rounded.control}"
    padding: "13px 22px"
    height: "48px"
  input-search:
    backgroundColor: "{colors.field-white}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "12px 14px 12px 42px"
    height: "48px"
  category-tab:
    typography: "{typography.label}"
    rounded: "{rounded.control}"
    padding: "12px 20px"
    height: "44px"
  category-tab-active:
    backgroundColor: "{colors.black-soft}"
    textColor: "{colors.white}"
  status-official:
    backgroundColor: "{colors.success-bg}"
    textColor: "{colors.success}"
    typography: "{typography.metadata}"
    rounded: "{rounded.status}"
    padding: "5px 9px"
    height: "28px"
  card-summary:
    backgroundColor: "{colors.field-white}"
    textColor: "{colors.ink}"
    rounded: "{rounded.panel}"
    padding: "28px"
  navigation:
    backgroundColor: "{colors.black}"
    textColor: "{colors.white}"
    height: "80px"
  race-ticket:
    backgroundColor: "{colors.black-soft}"
    textColor: "{colors.white}"
    rounded: "{rounded.sharp}"
    padding: "28px 0"
---

# Design System: Ultras do Kart

## Overview

**Creative North Star: "Ultras do Kart"**

Azul muito escuro organiza a abertura e a navegação; ciano identifica ações e estados ativos. Fotografia e filmagem reais do campeonato dão contexto, enquanto superfícies claras sustentam calendário, classificação, resultados, formulários e operação.

A composição Equipe UDK foi rejeitada pelo usuário. Este documento registra a recuperação code-led efetivamente implementada, sem novo roll, seed ou comp aprovado corroborado. Azul/ciano é a preferência confirmada; os demais padrões aqui registrados vêm do código, sem atribuir aprovação humana a eles.

**Key Characteristics:**

- Azul escuro na abertura e navegação, ciano em ações e estados ativos.
- Archivo variável para títulos, leitura, controles e números.
- Consultas claras, cabeçalhos internos compactos e divisores finos.
- Fotografias e vídeo reais, dados oficiais e textos curtos em português brasileiro.

A fonte normativa é `apps/plataforma/app/race.css`, carregada após `globals.css` e `pilot-crud.css` por `app/layout.tsx`. O frontmatter registra padrões reutilizados; a composição específica da Home permanece no seu surface brief.

## Colors

A paleta une azul quase preto, ciano nas ações e neutros frios para leitura.

### Primary

- **Ciano de ação** (`cyan`): ações públicas principais, marcação ativa e destaque na abertura.
- **Ciano luminoso** (`cyan-hover`): resposta ao hover de ações principais.
- **Ciano profundo** (`cyan-deep`): links sobre fundos claros, foco, controles selecionados e números destacados.

### Neutral

- **Azul quase preto** (`black`): cabeçalho, rodapé e blocos de informação em contraste.
- **Azul de superfície** (`black-soft`, `surface-dark`, `surface-dark-raised`): navegação operacional e camadas de conteúdo escuro.
- **Branco frio** (`white`) e **branco de campo** (`field-white`): texto sobre escuro e superfícies de entrada, respectivamente.
- **Papel frio** (`paper`, `paper-muted`) e **canvas** (`canvas`): leitura pública, cabeçalhos de tabela e fundo operacional.
- **Tinta azul** (`ink`): títulos e leitura sobre claro.
- **Texto secundário claro/escuro** (`muted-light`, `muted-dark`): descrições e metadados conforme o fundo.
- **Azul de placeholder** (`placeholder-ink`): iniciais sem retrato real no fundo escuro do perfil; mantém a cor existente e não representa novo acento de marca.
- **Divisores claros/escuros** (`line-light`, `line-dark`, `operation-line`): estrutura de linhas, painéis e campos.

Estados usam pares próprios: `success`/`success-bg` para publicação e confirmação, `warning`/`warning-bg` para provisório ou atenção, `danger`/`danger-bg` para erro ou cancelamento. `registration-bg` acompanha inscrição aberta com texto em ciano profundo. São cores semânticas, não novos acentos de marca.

**The Contrast Rule.** Use ciano vivo com tinta azul escura; sobre papel claro, links e indicadores de interação usam ciano profundo.

## Typography

**Display Font:** Archivo variável, com Arial e sans-serif de fallback.
**Body Font:** a mesma Archivo variável; não há família mono separada.

`next/font/google` fornece a fonte como recurso servido pelo aplicativo, com subset latin, variável `--font-archivo` e `display: swap`. Os aliases antigos Barlow/Inter apontam para Archivo no CSS final.

### Hierarchy

- **Display**: identidade na abertura, com peso 850 e limite de 6rem; `typography.display`. No celular, usa `typography.display-mobile`.
- **Headline**: título público padrão, com peso 700; `typography.headline`. Cabeçalhos internos compactos usam `typography.internal-headline`; dados e controles seguem próximos ao título.
- **Subheading**: subtítulos públicos de terceiro nível; `typography.subheading`.
- **Article heading**: título editorial de artigo; `typography.article-heading`. Sua escala não é herdada pelo painel.
- **Title**: títulos públicos de seção, com peso 700; `typography.title`. A operação usa títulos de painel menores, em geral 1.7–2rem.
- **Operation title**: título de tarefa no painel, com peso 700 e limite de 2.75rem; `typography.operation-title`. No celular, passa a 2rem.
- **Body**: descrições e conteúdo de tabelas usam 0.875rem; leitura editorial e descrições mais amplas chegam a 1rem. Parágrafos públicos têm limite de 70ch; introduções internas, 65ch.
- **Label**: ações principais, navegação de desktop e categorias usam `typography.label`, com peso 600.
- **Metadata**: rótulos, contexto de publicação, cabeçalhos de tabela e status usam `typography.metadata`; o mínimo é 0.75rem.
- **Data**: tabelas públicas usam `typography.data`, com números tabulares. Datas, pontos e métricas aumentam de tamanho conforme a informação, sem criar uma escala para cada exceção.

### Reused size roles

Os tamanhos adicionais do frontmatter são variantes observadas, não uma sequência para aplicar indiscriminadamente. Herdam Archivo; peso e altura de linha continuam próprios de cada componente.

| Token                               | Papel existente                                                                                       |
| ----------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `typography.reading`                | Leitura editorial, descrições amplas e campos de acesso/operação.                                     |
| `typography.section-compact`        | Resumo de temporada, documentos oficiais, notícias secundárias, pontos e seleção de categoria.        |
| `typography.section-small`          | Versão do regulamento, histórico, sessões de volta e seções do editor; datas e resumos de resultados. |
| `typography.section-mobile`         | Seções, perfis e datas em tela pequena; pontos e título de patrocinadores.                            |
| `typography.feature-title`          | Título de notícia em destaque e título do formulário de acesso no celular.                            |
| `typography.identity-large`         | Título de configuração e iniciais no placeholder de perfil; não é título operacional.                 |
| `typography.data-highlight`         | Datas de etapa e resumos de resultados ou histórico no celular.                                       |
| `typography.data-compact`           | Posição na classificação e data compacta no celular.                                                  |
| `typography.context-title`          | Nome da próxima etapa e valor principal do resumo de resultados.                                      |
| `typography.row-title`              | Nome do piloto no resumo da temporada e nome da etapa na lista de datas.                              |
| `typography.data-prominent`         | Contagem regressiva, nome em poster de piloto e pontos em listas móveis.                              |
| `typography.state-title`            | Seletor de resultados, mensagem de acesso negado e limite da navegação no menu.                       |
| `typography.editorial-mobile`       | Título de artigo no celular e chamada da imagem no menu.                                              |
| `typography.mobile-subtitle`        | Pontos do resumo da temporada e subtítulo de seção do editor no celular.                              |
| `typography.public-headline-mobile` | Cabeçalhos públicos no celular; consultas de dados podem usar uma variante menor.                     |

No celular (até 760px), cabeçalhos públicos internos ficam em 2.5–2.7rem e títulos de seção em 2rem. Identidade, artigo, perfil de piloto e acesso têm hierarquias próprias; seus valores não são regras para títulos operacionais.

**The One Font Rule.** Mantenha Archivo em identidade, leitura e operação; diferencie esses papéis com tamanho, peso, entreletra e espaço. A pilha nativa `ui-monospace, SFMono-Regular, Menlo, monospace` fica restrita aos contadores numéricos legados da navegação. As métricas do painel recebem Archivo por `.shell .metrics b` em race.css.

## Layout

O container público tem largura `min(100% - gutter * 2, 1312px)` e gutter `clamp(20px, 4vw, 64px)`. O cabeçalho é sticky, com 80px no desktop e 70px até 760px. A grade admite colunas `minmax(0, 1fr)` e quebra explícita em telas menores.

A abertura usa mídia real de fundo com texto sobreposto; o quadro de temporada tem duas colunas no desktop e uma abaixo de 760px. No celular, a abertura usa fotografia estática nas bordas do viewport; no desktop, o vídeo tem controle de pausa e respeita reduced motion. Diretórios passam de quatro para três colunas a 1200px e duas até 760px; listas sem retratos reais podem ocupar uma coluna. Rodapé passa para duas colunas a 1000px. Navegação direta dá lugar ao menu abaixo de 1000px.

Classificação e resultados usam tabela no desktop e listas com detalhes no celular, sem apertar as colunas. Cadastro usa grade 1.6fr/1fr; autenticação usa 1fr/1fr e formulário com máximo de 480px. Ambas tornam-se uma coluna abaixo de 760px. A operação limita o conteúdo a 1500px e transforma a sidebar em painel móvel abaixo de 980px.

O ritmo reutiliza os passos de `spacing`: controles e linhas usam intervalos menores; seções usam espaços de 48 a 80px. Botões e controles principais têm alvo mínimo de 44px; botões e campos públicos, 48px; campos de autenticação, 52px.

## Elevation & Depth

A interface é plana por padrão. Contraste tonal, fotografia e bordas organizam profundidade; tabelas, métricas, painéis e editor de pilotos explicitamente removem sombras. Seleção de categoria usa contorno interno de 1px. O token operacional `--shadow` existe como sombra suave, mas não define o tratamento dos painéis principais. O sidecar guarda esses valores.

Transições de cor/borda duram 0.18s, menu 0.2s e resposta de fotografia 0.4s. `--cinema-ease` mantém a curva existente. `prefers-reduced-motion` desliga animações e transições, além do scroll suave.

**The Flat Surface Rule.** Separe blocos por fundo e divisores; não aplique sombras novas a painéis que a implementação mantém planos.

## Shapes

Blocos de identidade e fotografia principal são retangulares. Controles usam o raio `control`; status públicos, `status`; resumos e containers públicos, `panel`; painéis operacionais, `operation`; modais, `modal`. Avatares e indicadores de etapa usam círculos. O editor de pilotos e seu cabeçalho usam `editor`; badges de status e identificadores operacionais arredondados usam `pill`. Esses raios permanecem nesses papéis e não substituem os raios de controles e painéis. Bordas de 1px e cantos discretos deixam a informação dominar o contorno.

## Components

### Buttons

Ações diretas com peso 600, rótulo legível e ícone SVG opcional. A variante pública principal combina fundo ciano e texto azul quase preto; hover usa ciano luminoso. No painel, o botão principal usa azul escuro e texto branco, com hover ciano profundo. Ghost e outline preservam o fundo, com borda na cor corrente e hover translúcido. Foco global é um outline de 3px em ciano profundo com offset de 4px. `aria-disabled` reduz opacidade e bloqueia interação.

### Chips

Tabs de categoria usam borda fina e raio de controle; seleção combina superfície azul escura e texto branco frio. Status público usa o raio `status`; badges operacionais usam `pill`. Ambos associam rótulo textual, contorno e par de cor semântica; não dependem apenas da cor. Indicadores oficiais reutilizam o par de sucesso.

### Cards / Containers

Resumos usam branco, borda escura translúcida e raio de painel. Containers de tabela mantêm borda e overflow horizontal no desktop. Cartões de patrocinador usam superfície azul escura com marca íntegra em `object-fit: contain`; no hover, a borda recebe ciano. Painéis operacionais usam branco, raio de operação e nenhuma sombra. O editor inline de pilotos usa raio `editor` no container, cabeçalho e prévia de foto; mantém o formulário no fluxo da página.

### Inputs / Fields

Campos públicos têm branco de campo, tinta azul, borda escura translúcida e raio de controle. Busca acrescenta espaço à esquerda para SVG. Autenticação mantém um rótulo visível acima do campo; ícone e botão de revelar senha ficam dentro do contorno. Erro e confirmação aparecem em blocos de mensagem com texto, fundo e borda semânticos.

### Navigation

Cabeçalho e menu usam azul quase preto, marca negativa oficial e links em Archivo. Página ativa recebe linha ciano no desktop e texto ciano no menu. O menu é um diálogo de tela cheia, com foco contido, Escape para fechar e restituição de foco ao disparador; conteúdo externo fica inert enquanto aberto. O link de salto para o conteúdo aparece no foco. A sidebar operacional usa camadas azuis e estado ativo ciano.

### Ticket de corrida e linhas de temporada

O ticket é uma faixa azul escura de canto reto, com divisor fino, data, horário, etapa e ações relacionadas. Datas e pontos usam números tabulares. Linhas de classificação e calendário separam informação por divisores finos; hover muda para ciano profundo. É um padrão de conteúdo real: nenhuma métrica ornamental é necessária para preencher o espaço.

## Do's and Don'ts

### Do:

- **Do** usar os tokens do frontmatter e os equivalentes existentes no CSS; race.css prevalece sobre globals.css.
- **Do** preservar a marca oficial e usar fotografias existentes com legenda e recorte apropriado ao espaço.
- **Do** dar aos controles rótulos acessíveis, foco visível e estados de seleção explícitos.
- **Do** usar números tabulares em classificação, pontos, datas e horários.
- **Do** adaptar tabelas para listas e detalhes no celular e respeitar prefers-reduced-motion.

### Don't:

- **Don't** substituir Archivo por uma fonte de display do sistema.
- **Don't** inventar slogans, métricas, resultados, retratos ou fatos esportivos para preencher a interface.
- **Don't** transformar metadados de conteúdo em chamadas decorativas repetidas acima de títulos.
- **Don't** tratar ciano vivo como cor de texto corrido sobre papel claro; links e estados nesse contexto usam ciano profundo.
- **Don't** promover exceções de uma página a regras para todo o produto.
