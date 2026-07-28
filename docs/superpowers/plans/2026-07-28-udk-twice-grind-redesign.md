# UDK Twice + The Grind Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** Reconstruir todas as rotas públicas do UDK como uma experiência cinematográfica e comunitária, preservando Supabase, autenticação e contratos existentes.

**Architecture:** Manter Next.js App Router e os serviços atuais. Criar um shell editorial compartilhado, componentes de narrativa e dados esportivos, CSS dividido em base, movimento, páginas e responsividade. Reutilizar consultas existentes e não adicionar dependências de animação.

**Tech Stack:** Next.js 16, React 19, TypeScript 5.9, Supabase JS, Lucide React, CSS nativo, Vitest.

## Global Constraints

- Não copiar código, texto ou ativos proprietários das referências.
- Usar apenas marca e ativos autorizados do UDK.
- Não inventar resultados, notícias, patrocinadores ou estatísticas.
- Preservar contratos de Supabase, RLS e autenticação.
- Sem nova dependência de animação.
- Respeitar `prefers-reduced-motion`.
- Validar em 1440px, 1024px, 768px e 390px.
- Um único merge consolidado na `main` após todos os gates.

---

### Task 1: Contratos visuais e shell

**Files:**
- Modify: `apps/plataforma/components/race/race-header.tsx`
- Modify: `apps/plataforma/components/race/race-shell.tsx`
- Modify: `apps/plataforma/components/race/motion.tsx`
- Create: `apps/plataforma/components/race/editorial-primitives.tsx`
- Modify: `apps/plataforma/app/race-premium-core.css`
- Modify: `apps/plataforma/app/race-premium-footer.css`

- [ ] Criar teste de contrato para logo oficial, menu fullscreen, skip link e CTA.
- [ ] Executar teste e confirmar falha.
- [ ] Implementar header transparente/compacto, menu numerado, rodapé editorial e transição de rota.
- [ ] Executar teste e confirmar aprovação.

### Task 2: Home cinematográfica

**Files:**
- Modify: `apps/plataforma/app/page.tsx`
- Modify: `apps/plataforma/app/race-premium-pages.css`

- [ ] Criar teste para as seções `hero`, `manifesto`, `season`, `ranking`, `drivers`, `community`, `news`, `sponsors` e `final-cta`.
- [ ] Confirmar falha.
- [ ] Implementar hero full-bleed, próxima etapa integrada, manifesto claro, trilho de etapas, ranking, pilotos e estados vazios.
- [ ] Confirmar teste.

### Task 3: Calendário, classificação e resultados

**Files:**
- Modify: `apps/plataforma/app/calendario/page.tsx`
- Modify: `apps/plataforma/app/classificacao/page.tsx`
- Modify: `apps/plataforma/app/resultados/page.tsx`
- Create: `apps/plataforma/components/race/sports-data.tsx`

- [ ] Criar testes de filtros, tabs, pódio condicional e estado vazio.
- [ ] Confirmar falhas.
- [ ] Implementar timeline editorial, top 3, ranking responsivo, seletor de etapa e resultados.
- [ ] Confirmar testes.

### Task 4: Pilotos e perfil individual

**Files:**
- Modify: `apps/plataforma/app/pilotos/page.tsx`
- Modify: `apps/plataforma/app/pilotos/[slug]/page.tsx`
- Create: `apps/plataforma/components/race/driver-editorial.tsx`

- [ ] Criar testes de busca, filtro e fallback sem fotografia.
- [ ] Confirmar falhas.
- [ ] Implementar grid assimétrico e perfil individual editorial.
- [ ] Confirmar testes.

### Task 5: Notícias e regulamento

**Files:**
- Modify: `apps/plataforma/app/noticias/page.tsx`
- Modify: `apps/plataforma/app/noticias/[slug]/page.tsx`
- Modify: `apps/plataforma/app/regulamento/page.tsx`

- [ ] Criar testes para estado vazio, artigo real e download condicional.
- [ ] Confirmar falhas.
- [ ] Implementar portal editorial, leitura longa e índice sticky/accordion.
- [ ] Confirmar testes.

### Task 6: Login e inscrição

**Files:**
- Modify: `apps/plataforma/app/login/page.tsx`
- Modify: `apps/plataforma/app/inscricao/page.tsx`
- Modify apenas estilos/containers dos componentes de formulário existentes.

- [ ] Criar teste para labels, progresso e preservação dos componentes funcionais existentes.
- [ ] Confirmar falha.
- [ ] Implementar tela dividida e fluxo de inscrição visual em seis etapas sem quebrar persistência atual.
- [ ] Confirmar testes.

### Task 7: Responsividade, acessibilidade e movimento

**Files:**
- Modify: `apps/plataforma/app/race-premium-responsive.css`
- Modify: `apps/plataforma/app/globals.css`
- Modify: componentes compartilhados conforme necessário.

- [ ] Criar verificações para um único `h1`, foco visível, alt, menu por teclado e ausência de overflow.
- [ ] Implementar breakpoints e redução de movimento.
- [ ] Executar todos os testes.

### Task 8: Validação e integração

- [ ] Executar `pnpm verify`.
- [ ] Executar `pnpm format:check`.
- [ ] Executar `pnpm lint`.
- [ ] Executar `pnpm typecheck`.
- [ ] Executar `pnpm test`.
- [ ] Executar `pnpm build`.
- [ ] Validar todas as rotas em preview.
- [ ] Comparar desktop e mobile com os princípios do design aprovado.
- [ ] Corrigir qualquer desvio visual ou funcional.
- [ ] Fazer merge consolidado na `main`.
- [ ] Confirmar deployment Vercel `READY`, commit correto e HTTP 200 nas rotas públicas.
