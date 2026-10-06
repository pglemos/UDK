---
name: "Ultras do Kart"
description: "Sistema visual Equipe UDK para portal, acesso e operação do campeonato."
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
    fontSize: "clamp(3rem, 6.5vw, 6rem)"
    fontWeight: 800
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
    fontSize: "0.8rem"
rounded:
  sharp: "0px"
  status: "3px"
  control: "4px"
  panel: "6px"
  operation: "8px"
  modal: "10px"
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
    typography: "{typography.data}"
    rounded: "{rounded.control}"
    padding: "12px 20px"
    height: "44px"
  category-tab-active:
    backgroundColor: "{colors.black-soft}"
    textColor: "{colors.white}"
  status-official:
    backgroundColor: "{colors.success-bg}"
    textColor: "{colors.success}"
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
    backgroundColor: "{colors.black}"
    textColor: "{colors.white}"
    rounded: "{rounded.sharp}"
    padding: "24px"
---

# Design System: Ultras do Kart

## Overview

**Creative North Star: "Equipe UDK"**

Equipe UDK combina identidade de equipe, fotografia oficial e informação de corrida. Ciano amplo, letras pesadas e blocos escuros dão presença; superfícies claras sustentam calendário, resultados, classificação e formulários.

A expressão muda com a tarefa: títulos grandes identificam o campeonato; tabelas, campos e navegação usam a mesma família com densidade menor. A marca oficial permanece íntegra, e o conteúdo visual usa material existente do campeonato.

**Key Characteristics:**

- Ciano reconhecível sobre uma base azul escura e papel frio.
- Archivo variável para títulos, leitura, controles e números.
- Blocos retangulares, cantos discretos e divisores finos.
- Fotografia oficial, dados reais e textos curtos em português brasileiro.

A fonte normativa é a implementação de `apps/plataforma/app/race.css`, carregada após `globals.css` e `pilot-crud.css` por `app/layout.tsx`. O frontmatter registra valores reutilizados; a composição específica da Home permanece no seu surface brief.

## Colors

A paleta une ciano vivo de equipe, azul quase preto e neutros frios para leitura.

### Primary

- **Ciano de equipe** (`cyan`): ações principais, seleção, marcação ativa e campos amplos de identidade.
- **Ciano luminoso** (`cyan-hover`): resposta ao hover de ações principais.
- **Ciano profundo** (`cyan-deep`): links sobre fundos claros, foco, controles selecionados e números destacados.

### Neutral

- **Azul quase preto** (`black`): cabeçalho, rodapé e blocos de informação em contraste.
- **Azul de superfície** (`black-soft`, `surface-dark`, `surface-dark-raised`): navegação operacional e camadas de conteúdo escuro.
- **Branco frio** (`white`) e **branco de campo** (`field-white`): texto sobre escuro e superfícies de entrada, respectivamente.
- **Papel frio** (`paper`, `paper-muted`) e **canvas** (`canvas`): leitura pública, cabeçalhos de tabela e fundo operacional.
- **Tinta azul** (`ink`): títulos e leitura sobre claro.
- **Texto secundário claro/escuro** (`muted-light`, `muted-dark`): descrições e metadados conforme o fundo.
- **Divisores claros/escuros** (`line-light`, `line-dark`, `operation-line`): estrutura de linhas, painéis e campos.

Estados usam pares próprios: `success`/`success-bg` para publicação e confirmação, `warning`/`warning-bg` para provisório ou atenção, `danger`/`danger-bg` para erro ou cancelamento. `registration-bg` acompanha inscrição aberta com texto em ciano profundo. São cores semânticas, não novos acentos de marca.

**The Contrast Rule.** Use ciano vivo com tinta azul escura; sobre papel claro, links e indicadores de interação usam ciano profundo.

## Typography

**Display Font:** Archivo variável, com Arial e sans-serif de fallback.
**Body Font:** a mesma Archivo variável; não há família mono separada.

`next/font/google` fornece a fonte como recurso servido pelo aplicativo, com subset latin, variável `--font-archivo` e `display: swap`. Os aliases antigos Barlow/Inter apontam para Archivo no CSS final.

### Hierarchy

- **Display**: peso 800, entreletra compacta e altura curta para títulos de identidade; os valores estão em `typography.display`.
- **Headline**: peso 700 para títulos públicos; `typography.headline`.
- **Title**: peso 700 para títulos de seção; `typography.title`. O quadro de temporada usa uma variante compacta de 1.8rem.
- **Body**: descrições públicas e explicações de controle; `typography.body`. Parágrafos públicos têm limite de 70ch; descrições editoriais, 58ch.
- **Label**: ações principais e controles; `typography.label`. A navegação de desktop usa 0.8rem, peso 600, e os rótulos de campos usam 0.75rem.
- **Data**: tabelas públicas; `typography.data`, com números tabulares. Pontos e datas aumentam de tamanho sem mudar de família.

No celular (até 760px), títulos públicos passam para 2.7rem e títulos de seção para 2rem; a abertura de identidade preserva seu clamp próprio (`clamp(2.8rem, 12vw, 5rem)`). A Home usa título em duas linhas; isso é composição da superfície, não obrigação para títulos de outras telas.

**The One Font Rule.** Mantenha Archivo em todos os papéis; diferencie identidade, leitura e operação com tamanho, peso, entreletra e espaço.

## Layout

O container público tem largura `min(100% - gutter * 2, 1312px)` e gutter `clamp(20px, 4vw, 64px)`. O cabeçalho é sticky, com 80px no desktop e 76px a partir de 1000px. A grade admite colunas `minmax(0, 1fr)` e quebra explícita em telas menores.

A abertura e o quadro de temporada usam duas colunas no desktop e uma abaixo de 760px. A fotografia da abertura ocupa as bordas do viewport no celular. Diretórios passam de quatro para três colunas a 1200px e se reorganizam abaixo de 760px. Rodapé passa para duas colunas a 1000px. Navegação direta dá lugar ao menu abaixo de 1000px.

Classificação e resultados usam tabela no desktop e listas com detalhes no celular, sem apertar as colunas. Cadastro usa grade 1.6fr/1fr; autenticação usa 1fr/1fr e formulário com máximo de 480px. Ambas tornam-se uma coluna abaixo de 760px. A operação limita o conteúdo a 1500px e transforma a sidebar em painel móvel abaixo de 980px.

O ritmo reutiliza os passos de `spacing`: controles e linhas usam intervalos menores; seções usam espaços de 48 a 80px. Alvos interativos têm altura mínima de 44px; botões e campos públicos, 48px; campos de autenticação, 52px.

## Elevation & Depth

A interface é plana por padrão. Contraste tonal, fotografia e bordas organizam profundidade; tabelas, métricas, painéis e editor de pilotos explicitamente removem sombras. Seleção de categoria usa contorno interno de 1px. O token operacional `--shadow` existe como sombra suave, mas não define o tratamento dos painéis principais. O sidecar guarda esses valores.

Transições de cor/borda duram 0.18s, menu 0.2s e resposta de fotografia 0.4s. `--cinema-ease` mantém a curva existente. `prefers-reduced-motion` desliga animações e transições, além do scroll suave.

**The Flat Surface Rule.** Separe blocos por fundo e divisores; não aplique sombras novas a painéis que a implementação mantém planos.

## Shapes

Blocos de identidade e fotografia principal são retangulares. Controles usam o raio `control`; badges, `status`; resumos e containers públicos, `panel`; painéis operacionais, `operation`; modais, `modal`. Círculos se restringem a indicadores de etapa e placeholders de avatar. Bordas de 1px e cantos discretos deixam a informação dominar o contorno.

## Components

### Buttons

Ações diretas com peso 600, rótulo legível e ícone SVG opcional. A variante principal combina ciano e fundo azul quase preto; hover usa ciano luminoso. Ghost e outline preservam o fundo, com borda na cor corrente e hover translúcido. No ticket de corrida, a ação principal usa branco frio e passa a ciano no hover. Foco global é um outline de 3px em ciano profundo com offset de 4px. `aria-disabled` reduz opacidade e bloqueia interação.

### Chips

Tabs de categoria usam borda fina e raio de controle; seleção combina superfície azul escura e texto branco frio. Status associa rótulo textual, contorno e par de cor semântica; não depende apenas da cor. Indicadores oficiais reutilizam o par de sucesso.

### Cards / Containers

Resumos usam branco, borda escura translúcida e raio de painel. Containers de tabela mantêm borda e overflow horizontal no desktop. Cartões de patrocinador usam superfície azul escura com marca íntegra em `object-fit: contain`; no hover, a borda recebe ciano. Painéis operacionais usam branco, raio de operação e nenhuma sombra.

### Inputs / Fields

Campos públicos têm branco de campo, tinta azul, borda escura translúcida e raio de controle. Busca acrescenta espaço à esquerda para SVG. Autenticação mantém um rótulo visível acima do campo; ícone e botão de revelar senha ficam dentro do contorno. Erro e confirmação aparecem em blocos de mensagem com texto, fundo e borda semânticos.

### Navigation

Cabeçalho e menu usam azul quase preto, marca negativa oficial e links em Archivo. Página ativa recebe linha ciano no desktop e texto ciano no menu. O menu é um diálogo de tela cheia, com foco contido, Escape para fechar e restituição de foco ao disparador; conteúdo externo fica inert enquanto aberto. O link de salto para o conteúdo aparece no foco. A sidebar operacional usa camadas azuis e estado ativo ciano.

### Ticket de corrida e linhas de temporada

O ticket é um bloco escuro de canto reto com data, horário, etapa e ações relacionadas. Datas e pontos usam números tabulares. Linhas de classificação e calendário separam informação por divisores finos; hover muda para ciano profundo. É um padrão de conteúdo real: nenhuma métrica ornamental é necessária para preencher o espaço.

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
