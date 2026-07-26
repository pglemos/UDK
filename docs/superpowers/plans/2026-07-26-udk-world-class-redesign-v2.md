# UDK World-Class Redesign V2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir um protótipo multipágina completo em HTML, CSS e JavaScript que materialize a direção aprovada de 70% campeonato internacional e 30% cultura Ultras, sem alterar a produção.

**Architecture:** O protótipo será totalmente estático e abrirá diretamente pelo `index.html`. Um shell visual compartilhado será repetido nas páginas, enquanto CSS e JavaScript serão divididos por responsabilidade. Dados demonstrativos virão de um único arquivo `data.js`, permitindo substituir conteúdo sem reescrever os templates.

**Tech Stack:** HTML5, CSS3, JavaScript ES2022 sem framework, Node.js para validação estática.

## Global Constraints

- Não alterar `apps/plataforma` nesta fase.
- Não disparar deployment da Vercel.
- Usar somente logos oficiais UDK.
- Usar Roboto Condensed para títulos e Roboto para interface e texto.
- Usar ciano apenas como acento de interface.
- Não inventar resultados, notícias, regulamentos ou patrocinadores.
- Não criar ou importar fotos identificáveis sem autorização.
- O protótipo deve funcionar abrindo `prototypes/udk-world-class-v2/index.html` localmente.
- Respeitar `prefers-reduced-motion`.
- Todas as páginas devem funcionar em 1440px, 1024px, 768px e 390px.

---

## File Map

```text
prototypes/udk-world-class-v2/
├── index.html                    # Home completa
├── calendario.html               # Temporada e etapas
├── classificacao.html            # Top 3, ranking e categorias
├── resultados.html               # Resultado por etapa
├── pilotos.html                  # Grid e filtros
├── piloto.html                   # Perfil individual
├── noticias.html                 # Destaque e listagem
├── noticia.html                  # Artigo completo
├── regulamento.html              # Índice e capítulos
├── login.html                    # Autenticação visual
├── inscricao.html                # Fluxo estático em etapas
├── assets/
│   ├── css/
│   │   ├── tokens.css            # Cores, fontes, escalas e espaçamento
│   │   ├── global.css            # Reset, tipografia, containers e shell
│   │   ├── components.css        # Header, botões, cards, tabelas e formulários
│   │   ├── pages.css             # Composições específicas de cada rota
│   │   └── responsive.css        # Breakpoints e adaptações mobile
│   ├── js/
│   │   ├── data.js               # Dados oficiais/fallbacks permitidos
│   │   ├── shell.js              # Header, menu, rota ativa e footer
│   │   ├── interactions.js       # Tabs, filtros, reveal e modais
│   │   └── registration.js       # Fluxo de inscrição estático
│   └── media/                    # Cópias locais dos ativos oficiais existentes
└── scripts/
    └── validate-prototype.mjs     # Validação de páginas, links e ativos
```

---

### Task 1: Scaffold e contrato de validação

**Files:**
- Create: `prototypes/udk-world-class-v2/index.html`
- Create: `prototypes/udk-world-class-v2/assets/css/tokens.css`
- Create: `prototypes/udk-world-class-v2/assets/css/global.css`
- Create: `prototypes/udk-world-class-v2/assets/js/data.js`
- Create: `prototypes/udk-world-class-v2/assets/js/shell.js`
- Create: `prototypes/udk-world-class-v2/scripts/validate-prototype.mjs`

**Interfaces:**
- Produces: `window.UDK_DATA`, `window.UDK_SHELL.mount()`.
- Consumes: ativos oficiais copiados para `assets/media/`.

- [ ] **Step 1: Criar o validador inicialmente falhando**

```js
// scripts/validate-prototype.mjs
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const requiredPages = [
  "index.html",
  "calendario.html",
  "classificacao.html",
  "resultados.html",
  "pilotos.html",
  "piloto.html",
  "noticias.html",
  "noticia.html",
  "regulamento.html",
  "login.html",
  "inscricao.html",
];

const missing = requiredPages.filter((file) => !fs.existsSync(path.join(root, file)));
if (missing.length) {
  console.error(`Missing pages: ${missing.join(", ")}`);
  process.exit(1);
}
```

- [ ] **Step 2: Executar e confirmar falha**

Run:

```bash
node prototypes/udk-world-class-v2/scripts/validate-prototype.mjs
```

Expected: `Missing pages:` seguido das páginas ainda não criadas.

- [ ] **Step 3: Criar tokens e shell mínimo**

`tokens.css` deve declarar exatamente:

```css
:root {
  --udk-bg: #07090b;
  --udk-bg-soft: #0d1115;
  --udk-panel: #13181d;
  --udk-paper: #f2f0ea;
  --udk-text: #f7f8f8;
  --udk-ink: #111316;
  --udk-muted: #99a3ab;
  --udk-line: rgba(255, 255, 255, 0.12);
  --udk-cyan: #00d9ff;
  --udk-gold: #ffbf2f;
  --udk-silver: #bec6ce;
  --udk-bronze: #c98148;
  --udk-danger: #f05252;
  --udk-success: #42d487;
  --udk-headline: "Roboto Condensed", Arial Narrow, sans-serif;
  --udk-body: "Roboto", Arial, sans-serif;
  --udk-container: 1480px;
  --udk-gutter: clamp(20px, 4vw, 64px);
}
```

`index.html` deve carregar os cinco CSS planejados, `data.js`, `shell.js` e usar `data-page="home"` no `<body>`.

- [ ] **Step 4: Criar `UDK_DATA` mínimo**

```js
window.UDK_DATA = {
  season: "2026",
  venue: "Kartódromo Internacional de Betim",
  stages: [],
  drivers: [],
  results: [],
  news: [],
  regulations: [],
  sponsors: [],
};
```

- [ ] **Step 5: Executar o validador e manter falha controlada**

Run: `node prototypes/udk-world-class-v2/scripts/validate-prototype.mjs`

Expected: FAIL apenas pelas dez páginas restantes.

- [ ] **Step 6: Commit**

```bash
git add prototypes/udk-world-class-v2
git commit -m "feat: scaffold UDK world-class static prototype"
```

---

### Task 2: Shell global e sistema visual

**Files:**
- Modify: `prototypes/udk-world-class-v2/assets/css/global.css`
- Create: `prototypes/udk-world-class-v2/assets/css/components.css`
- Modify: `prototypes/udk-world-class-v2/assets/js/shell.js`
- Modify: `prototypes/udk-world-class-v2/index.html`

**Interfaces:**
- Produces: `mountHeader()`, `mountFooter()`, `setActiveRoute()`.
- Consumes: `document.body.dataset.page`.

- [ ] **Step 1: Criar teste de contrato do shell**

Adicionar ao validador:

```js
const indexHtml = fs.readFileSync(path.join(root, "index.html"), "utf8");
for (const token of ["data-page=\"home\"", "site-header", "site-footer", "assets/js/shell.js"]) {
  if (!indexHtml.includes(token)) {
    console.error(`Home shell contract missing: ${token}`);
    process.exit(1);
  }
}
```

- [ ] **Step 2: Executar e confirmar falha**

Expected: FAIL em `site-header` ou `site-footer`.

- [ ] **Step 3: Implementar header e footer**

O header deve incluir:

- logo oficial;
- links para as seis rotas públicas principais;
- `Entrar`;
- CTA `Inscrição`;
- botão mobile com `aria-expanded`;
- menu fullscreen.

O footer deve incluir marca, manifesto curto, navegação, Instagram e localização.

- [ ] **Step 4: Implementar comportamento do shell**

```js
window.UDK_SHELL = {
  mount() {
    const trigger = document.querySelector("[data-menu-trigger]");
    const menu = document.querySelector("[data-mobile-menu]");
    trigger?.addEventListener("click", () => {
      const open = trigger.getAttribute("aria-expanded") === "true";
      trigger.setAttribute("aria-expanded", String(!open));
      menu?.toggleAttribute("data-open", !open);
      document.documentElement.classList.toggle("menu-open", !open);
    });
  },
};

document.addEventListener("DOMContentLoaded", () => window.UDK_SHELL.mount());
```

- [ ] **Step 5: Implementar componentes base**

`components.css` deve conter botões primário/secundário, kicker, card editorial, tabela esportiva, chips, tabs, toolbar, estado vazio, modal, formulário e paginação.

- [ ] **Step 6: Executar validação**

Expected: shell contract PASS; páginas restantes ainda ausentes.

- [ ] **Step 7: Commit**

```bash
git add prototypes/udk-world-class-v2
git commit -m "feat: add UDK prototype shell and design system"
```

---

### Task 3: Home cinematográfica

**Files:**
- Modify: `prototypes/udk-world-class-v2/index.html`
- Create: `prototypes/udk-world-class-v2/assets/css/pages.css`
- Create: `prototypes/udk-world-class-v2/assets/js/interactions.js`

**Interfaces:**
- Consumes: `window.UDK_DATA.stages`, `.drivers`, `.news`, `.sponsors`.
- Produces: hero, próxima etapa, manifesto, calendário, ranking, notícias, patrocinadores e CTA.

- [ ] **Step 1: Adicionar teste de seções obrigatórias**

```js
const homeSections = [
  "home-hero",
  "home-championship-strip",
  "home-manifesto",
  "home-stages",
  "home-ranking",
  "home-news",
  "home-sponsors",
  "home-final-cta",
];
for (const id of homeSections) {
  if (!indexHtml.includes(`id=\"${id}\"`)) {
    console.error(`Missing home section: ${id}`);
    process.exit(1);
  }
}
```

- [ ] **Step 2: Executar e confirmar falha**

Expected: FAIL em `home-hero`.

- [ ] **Step 3: Implementar hero**

Requisitos exatos:

- altura mínima `min(900px, 92vh)` no desktop;
- fotografia/ativo autorizado em plano de fundo;
- título em no máximo duas linhas dominantes;
- dois CTAs;
- próxima etapa integrada em coluna lateral;
- contagem regressiva calculada em JavaScript quando houver `startsAt`;
- sem card solto centralizado sobre a imagem.

- [ ] **Step 4: Implementar seções restantes**

A home deve alternar fundos escuros e uma seção clara editorial. O ranking deve mostrar no máximo cinco pilotos. Notícias devem usar estado vazio se `news.length === 0`.

- [ ] **Step 5: Implementar reveal progressivo**

```js
const observer = new IntersectionObserver((entries) => {
  for (const entry of entries) {
    if (entry.isIntersecting) {
      entry.target.classList.add("is-visible");
      observer.unobserve(entry.target);
    }
  }
}, { threshold: 0.16 });

document.querySelectorAll("[data-reveal]").forEach((node) => observer.observe(node));
```

O código deve ser desativado quando `prefers-reduced-motion: reduce` estiver ativo.

- [ ] **Step 6: Executar validação**

Expected: todas as seções da home PASS.

- [ ] **Step 7: Commit**

```bash
git add prototypes/udk-world-class-v2
git commit -m "feat: build cinematic UDK prototype home"
```

---

### Task 4: Calendário e classificação

**Files:**
- Create: `prototypes/udk-world-class-v2/calendario.html`
- Create: `prototypes/udk-world-class-v2/classificacao.html`
- Modify: `prototypes/udk-world-class-v2/assets/css/pages.css`
- Modify: `prototypes/udk-world-class-v2/assets/js/interactions.js`

**Interfaces:**
- Consumes: `UDK_DATA.stages`, `UDK_DATA.drivers`.
- Produces: filtros `data-filter-stage` e tabs `data-ranking-tab`.

- [ ] **Step 1: Criar páginas com shell e `data-page` correto**

- `calendario.html`: `data-page="calendario"`.
- `classificacao.html`: `data-page="classificacao"`.

- [ ] **Step 2: Implementar calendário**

Cada etapa deve conter número, data, título, traçado, local, status e ação. A primeira etapa futura recebe `data-current="true"`.

- [ ] **Step 3: Implementar filtros de calendário**

```js
function filterStages(format, status) {
  document.querySelectorAll("[data-stage]").forEach((card) => {
    const matchesFormat = format === "todos" || card.dataset.format === format;
    const matchesStatus = status === "todos" || card.dataset.status === status;
    card.hidden = !(matchesFormat && matchesStatus);
  });
}
```

- [ ] **Step 4: Implementar classificação**

Desktop:

- Top 3 editorial.
- Tabela completa.
- Tabs `Geral`, `Ultras Rápidos`, `Ultras Insanos`.

Mobile:

- cada linha vira cartão horizontal;
- ocultar colunas auxiliares, mantendo posição, piloto, categoria e pontos.

- [ ] **Step 5: Atualizar o validador**

Validar que ambas as páginas incluem `site-header`, `site-footer`, seu `data-page` e ao menos um `data-empty-state` para ausência de dados.

- [ ] **Step 6: Executar validação**

Expected: calendário e classificação PASS.

- [ ] **Step 7: Commit**

```bash
git add prototypes/udk-world-class-v2
git commit -m "feat: add calendar and standings prototype pages"
```

---

### Task 5: Resultados, pilotos e perfil individual

**Files:**
- Create: `prototypes/udk-world-class-v2/resultados.html`
- Create: `prototypes/udk-world-class-v2/pilotos.html`
- Create: `prototypes/udk-world-class-v2/piloto.html`
- Modify: `prototypes/udk-world-class-v2/assets/css/pages.css`
- Modify: `prototypes/udk-world-class-v2/assets/js/interactions.js`

**Interfaces:**
- Consumes: `UDK_DATA.results`, `UDK_DATA.drivers`.
- Produces: `renderResults(stageId)`, `filterDrivers(query, category)`.

- [ ] **Step 1: Implementar resultados sem dados inventados**

Quando `results.length === 0`, mostrar:

- título `Resultados oficiais ainda não publicados`;
- texto explicando que a página será atualizada após homologação;
- link para calendário.

O pódio só pode ser renderizado quando existirem três resultados reais.

- [ ] **Step 2: Implementar grid de pilotos**

- 4 colunas em desktop amplo;
- 3 em desktop;
- 2 em tablet;
- 1 em mobile estreito;
- fallback tipográfico com número quando não houver foto.

- [ ] **Step 3: Implementar busca e categoria**

```js
function filterDrivers(query, category) {
  const normalized = query.trim().toLocaleLowerCase("pt-BR");
  document.querySelectorAll("[data-driver]").forEach((card) => {
    const matchesName = card.dataset.search.includes(normalized);
    const matchesCategory = category === "todos" || card.dataset.category === category;
    card.hidden = !(matchesName && matchesCategory);
  });
}
```

- [ ] **Step 4: Implementar perfil individual**

Incluir hero, número, nome, categoria, equipe, pontos, pódios, histórico e estado sem resultados.

- [ ] **Step 5: Atualizar e executar validação**

Expected: as três páginas existem, têm shell e não contêm `Lorem ipsum`.

- [ ] **Step 6: Commit**

```bash
git add prototypes/udk-world-class-v2
git commit -m "feat: add results and driver prototype experiences"
```

---

### Task 6: Notícias e regulamento

**Files:**
- Create: `prototypes/udk-world-class-v2/noticias.html`
- Create: `prototypes/udk-world-class-v2/noticia.html`
- Create: `prototypes/udk-world-class-v2/regulamento.html`
- Modify: `prototypes/udk-world-class-v2/assets/css/pages.css`
- Modify: `prototypes/udk-world-class-v2/assets/js/interactions.js`

**Interfaces:**
- Consumes: `UDK_DATA.news`, `UDK_DATA.regulations`.
- Produces: `activateRegulationChapter(id)`.

- [ ] **Step 1: Implementar notícias**

A listagem usa um destaque principal e cards secundários. Sem conteúdo real, renderiza um estado vazio editorial, sem matérias fictícias.

- [ ] **Step 2: Implementar página interna**

Usar artigo demonstrativo apenas se ele estiver explicitamente marcado no `data.js` como `prototype: true`. Exibir aviso `Conteúdo demonstrativo do protótipo`.

- [ ] **Step 3: Implementar regulamento**

- índice sticky no desktop;
- capítulos com anchors;
- accordion no mobile;
- botão de download oculto quando `downloadUrl` for vazio.

- [ ] **Step 4: Implementar navegação de capítulos**

```js
function activateRegulationChapter(id) {
  document.querySelectorAll("[data-regulation-link]").forEach((link) => {
    link.toggleAttribute("aria-current", link.getAttribute("href") === `#${id}`);
  });
}
```

- [ ] **Step 5: Executar validação**

Expected: notícias, notícia e regulamento PASS; nenhum download vazio renderizado.

- [ ] **Step 6: Commit**

```bash
git add prototypes/udk-world-class-v2
git commit -m "feat: add news and regulations prototype pages"
```

---

### Task 7: Login e inscrição em etapas

**Files:**
- Create: `prototypes/udk-world-class-v2/login.html`
- Create: `prototypes/udk-world-class-v2/inscricao.html`
- Create: `prototypes/udk-world-class-v2/assets/js/registration.js`
- Modify: `prototypes/udk-world-class-v2/assets/css/pages.css`

**Interfaces:**
- Produces: `RegistrationWizard` com `next()`, `previous()`, `validateStep()` e `renderSummary()`.
- Não persiste dados nem chama APIs.

- [ ] **Step 1: Implementar login**

Desktop dividido em 52/48. Mobile mostra formulário primeiro. Campos: e-mail e senha. Mensagens de erro são locais e demonstrativas.

- [ ] **Step 2: Criar HTML do fluxo de inscrição**

Passos obrigatórios:

1. Conta.
2. Dados pessoais.
3. Categoria.
4. Experiência.
5. Revisão.
6. Confirmação.

- [ ] **Step 3: Implementar wizard**

```js
class RegistrationWizard {
  constructor(root) {
    this.root = root;
    this.steps = [...root.querySelectorAll("[data-step]")];
    this.index = 0;
  }

  validateStep() {
    return [...this.steps[this.index].querySelectorAll("[required]")]
      .every((field) => field.reportValidity());
  }

  next() {
    if (!this.validateStep()) return;
    this.index = Math.min(this.index + 1, this.steps.length - 1);
    this.render();
  }

  previous() {
    this.index = Math.max(this.index - 1, 0);
    this.render();
  }

  render() {
    this.steps.forEach((step, index) => { step.hidden = index !== this.index; });
    this.root.style.setProperty("--wizard-progress", `${((this.index + 1) / this.steps.length) * 100}%`);
  }
}
```

- [ ] **Step 4: Garantir aviso de protótipo**

A página deve informar claramente que o envio não cria inscrição real.

- [ ] **Step 5: Executar validação**

Expected: login e inscrição PASS; `registration.js` carregado apenas em `inscricao.html`.

- [ ] **Step 6: Commit**

```bash
git add prototypes/udk-world-class-v2
git commit -m "feat: add login and registration wizard prototype"
```

---

### Task 8: Responsividade e acessibilidade

**Files:**
- Create: `prototypes/udk-world-class-v2/assets/css/responsive.css`
- Modify: todas as páginas HTML.
- Modify: `prototypes/udk-world-class-v2/assets/js/interactions.js`
- Modify: `prototypes/udk-world-class-v2/scripts/validate-prototype.mjs`

**Interfaces:**
- Consumes: classes e data attributes existentes.
- Produces: layout funcional em 1440, 1024, 768 e 390 pixels.

- [ ] **Step 1: Criar checks de acessibilidade estática**

O validador deve rejeitar páginas sem:

- `<html lang="pt-BR">`;
- `<main`;
- um único `<h1`;
- `aria-label` no botão do menu;
- `alt` em toda imagem.

- [ ] **Step 2: Executar e corrigir falhas**

Run: `node prototypes/udk-world-class-v2/scripts/validate-prototype.mjs`

Expected: FAIL nas páginas que ainda não atendem o contrato.

- [ ] **Step 3: Implementar breakpoints**

```css
@media (max-width: 1199px) { /* desktop compacto */ }
@media (max-width: 899px) { /* tablet */ }
@media (max-width: 639px) { /* mobile */ }
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    scroll-behavior: auto !important;
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

- [ ] **Step 4: Remover tabelas espremidas**

Em até 639px, classificação e resultados devem usar cartões, não `overflow-x: auto` como solução principal.

- [ ] **Step 5: Executar validação**

Expected: todas as checks estáticas PASS.

- [ ] **Step 6: Commit**

```bash
git add prototypes/udk-world-class-v2
git commit -m "fix: complete responsive and accessible prototype behavior"
```

---

### Task 9: Validação visual e referências quebradas

**Files:**
- Modify: `prototypes/udk-world-class-v2/scripts/validate-prototype.mjs`
- Create: `prototypes/udk-world-class-v2/README.md`

**Interfaces:**
- Produces: relatório terminal sem erros.

- [ ] **Step 1: Validar links locais e ativos**

O script deve extrair `href` e `src` relativos, ignorar anchors e URLs externas e confirmar existência no disco.

```js
const refPattern = /(?:href|src)="([^"]+)"/g;
for (const page of requiredPages) {
  const html = fs.readFileSync(path.join(root, page), "utf8");
  for (const match of html.matchAll(refPattern)) {
    const ref = match[1];
    if (ref.startsWith("#") || ref.startsWith("http") || ref.startsWith("mailto:")) continue;
    const target = path.resolve(root, path.dirname(page), ref.split("#")[0].split("?")[0]);
    if (!fs.existsSync(target)) {
      console.error(`${page}: missing reference ${ref}`);
      process.exit(1);
    }
  }
}
```

- [ ] **Step 2: Executar validação completa**

Run:

```bash
node prototypes/udk-world-class-v2/scripts/validate-prototype.mjs
```

Expected: `UDK prototype validation passed: 11 pages`.

- [ ] **Step 3: Fazer inspeção visual manual**

Abrir as onze páginas em 1440px e 390px. Verificar:

- hero sem recorte indevido;
- navegação legível;
- título sem sobreposição;
- CTAs acessíveis;
- filtros funcionais;
- tabelas convertidas em cartões no mobile;
- formulário de inscrição navegável;
- ausência de assets quebrados.

- [ ] **Step 4: Criar README**

O README deve explicar como abrir o protótipo, listar páginas e registrar que ele não altera a produção.

- [ ] **Step 5: Commit**

```bash
git add prototypes/udk-world-class-v2
git commit -m "test: validate complete UDK static redesign prototype"
```

---

### Task 10: Pacote de revisão

**Files:**
- Create: `artifacts/UDK_WORLD_CLASS_V2_REVIEW.md`
- Create locally: `UDK_WORLD_CLASS_V2_HTML_CSS_JS.zip`

**Interfaces:**
- Consumes: protótipo validado.
- Produces: ZIP revisável sem deploy.

- [ ] **Step 1: Executar validação final**

```bash
node prototypes/udk-world-class-v2/scripts/validate-prototype.mjs
```

Expected: PASS.

- [ ] **Step 2: Criar relatório de revisão**

O relatório deve listar as onze páginas, direção visual, conteúdo provisório, limitações e instruções de aprovação.

- [ ] **Step 3: Gerar ZIP**

```bash
cd prototypes
zip -r ../UDK_WORLD_CLASS_V2_HTML_CSS_JS.zip udk-world-class-v2
```

- [ ] **Step 4: Confirmar ausência de alteração em produção**

Comparar a branch de design com `main` e confirmar que apenas documentação, protótipo e relatório foram adicionados.

- [ ] **Step 5: Commit**

```bash
git add artifacts/UDK_WORLD_CLASS_V2_REVIEW.md
git commit -m "docs: add UDK redesign prototype review package"
```

---

## Self-Review

### Spec coverage

- Onze páginas: Tasks 3 a 7.
- Shell global: Task 2.
- Direção cinematográfica/editorial: Tasks 2 e 3.
- Dados esportivos: Tasks 4 e 5.
- Estados vazios sem conteúdo inventado: Tasks 3, 5 e 6.
- Inscrição em etapas: Task 7.
- Responsividade e acessibilidade: Task 8.
- Validação de links/ativos: Task 9.
- Pacote sem deploy: Task 10.

### Placeholder scan

O plano não contém `TBD`, `TODO`, `implementar depois` ou instruções sem critérios verificáveis.

### Type consistency

- `window.UDK_DATA` é criado na Task 1 e consumido nas Tasks 3 a 6.
- `window.UDK_SHELL.mount()` é criado na Task 2.
- `RegistrationWizard` é criado e usado apenas na Task 7.
- `filterStages`, `filterDrivers` e `activateRegulationChapter` possuem nomes consistentes.
