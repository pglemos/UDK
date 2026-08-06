# Patrocinadores Oficiais UDK Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publicar o roster oficial de patrocinadores do UDK com logos locais, destino no Instagram e sincronização idempotente com o banco.

**Architecture:** `fallbackSponsors` funciona como catálogo canônico da experiência pública. `mergeOfficialSponsors` combina dados permitidos vindos do Supabase com os ativos e links oficiais locais, descartando registros fora do roster. Uma migração sincroniza a tabela `sponsors` com o mesmo conjunto.

**Tech Stack:** Next.js, React, TypeScript, Vitest, Supabase/PostgreSQL, SVG.

## Global Constraints

- O roster público contém exatamente sete marcas.
- PVF Transportes não pode aparecer no código, fallback, migração ou saída pública.
- A categoria comercial é exatamente `Patrocinador oficial`.
- Logos são arquivos SVG locais em `/sponsors/`.
- Cards externos usam `target="_blank"` e `rel="noreferrer"`.
- Não criar novo campo de banco para Instagram nesta entrega.

---

### Task 1: Contrato testável do roster

**Files:**
- Create: `apps/plataforma/tests/official-sponsors.test.ts`
- Modify: `apps/plataforma/lib/public-content.ts`
- Modify: `apps/plataforma/lib/public-content-fallbacks.ts`

**Interfaces:**
- Produces: `mergeOfficialSponsors(rows: PublicSponsor[]): PublicSponsor[]`
- Consumes: `fallbackSponsors: PublicSponsor[]`

- [x] **Step 1: Write the failing test**

Criar testes que validem os sete slugs, categoria exata, ausência de PVF, URLs do Instagram, caminhos locais e mesclagem por slug.

- [x] **Step 2: Run test to verify it fails**

Run: `pnpm --filter plataforma test -- official-sponsors.test.ts`
Expected: FAIL porque o roster e `mergeOfficialSponsors` ainda não existem.

- [x] **Step 3: Write minimal implementation**

Substituir o fallback antigo pelo roster aprovado e implementar a mesclagem determinística, preservando nome, logo, URL e categoria canônicos.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter plataforma test -- official-sponsors.test.ts`
Expected: PASS.

- [x] **Step 5: Commit**

`git commit -m "feat: define official sponsor roster"`

### Task 2: Ativos oficiais

**Files:**
- Create: `apps/plataforma/public/sponsors/akamig.svg`
- Create: `apps/plataforma/public/sponsors/firepit-brasil.svg`
- Create: `apps/plataforma/public/sponsors/grupo-emtel.svg`
- Create: `apps/plataforma/public/sponsors/guicosmos-tv.svg`
- Create: `apps/plataforma/public/sponsors/transfermix.svg`
- Create: `apps/plataforma/public/sponsors/veste-custom-wear.svg`
- Create: `apps/plataforma/public/sponsors/vintage-sao-francisco.svg`

**Interfaces:**
- Produces: arquivos referenciados por `fallbackSponsors.logoUrl`.

- [x] **Step 1: Add asset existence assertions**

O teste deve chamar `existsSync` para cada caminho público esperado.

- [x] **Step 2: Run test to verify it fails**

Run: `pnpm --filter plataforma test -- official-sponsors.test.ts`
Expected: FAIL com arquivos ausentes.

- [x] **Step 3: Add optimized assets**

Adicionar SVGs locais com `viewBox`, transparência, proporção preservada e conteúdo centralizado.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter plataforma test -- official-sponsors.test.ts`
Expected: PASS.

- [x] **Step 5: Commit**

`git commit -m "assets: add official sponsor logos"`

### Task 3: Página pública

**Files:**
- Modify: `apps/plataforma/app/patrocinadores/page.tsx`

**Interfaces:**
- Consumes: `PublicSponsor.websiteUrl` como URL do Instagram.
- Produces: `instagramHandle(url: string): string` para exibição textual.

- [x] **Step 1: Extend the contract test**

Validar que a página exibe a logo, deriva o identificador e preserva os atributos seguros do link externo.

- [x] **Step 2: Run test to verify it fails**

Run: `pnpm --filter plataforma test -- official-sponsors.test.ts`
Expected: FAIL porque o identificador ainda não aparece.

- [x] **Step 3: Implement the public card**

Exibir `@handle` abaixo do nome e manter fallback textual caso a logo não carregue.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter plataforma test -- official-sponsors.test.ts`
Expected: PASS.

- [x] **Step 5: Commit**

`git commit -m "feat: show sponsor Instagram profiles"`

### Task 4: Sincronização do banco

**Files:**
- Create: `supabase/migrations/202608060001_official_sponsors.sql`

**Interfaces:**
- Consumes: campeonato com slug `udk`.
- Produces: sete registros ativos em `public.sponsors`.

- [x] **Step 1: Add migration assertions**

O teste deve validar `on conflict`, remoção de `pvf-transportes`, os sete slugs e o tier exato.

- [x] **Step 2: Run test to verify it fails**

Run: `pnpm --filter plataforma test -- official-sponsors.test.ts`
Expected: FAIL porque a migração ainda não existe.

- [x] **Step 3: Write idempotent migration**

Usar CTE do campeonato, `insert ... on conflict ... do update` e remoção de registros fora do roster.

- [ ] **Step 4: Run database verification**

Run: `supabase db reset && supabase test db && supabase db lint --level warning`
Expected: todos os comandos concluídos sem erro.

- [x] **Step 5: Commit**

`git commit -m "db: sync official sponsors"`

### Task 5: Validação integrada

**Files:**
- Verify only.

- [ ] **Step 1: Run application tests**

Run: `pnpm --filter plataforma test`
Expected: PASS.

- [ ] **Step 2: Run lint**

Run: `pnpm --filter plataforma lint`
Expected: PASS.

- [x] **Step 3: Run production build**

Evidence: Vercel Preview status `success` for the PR head.

- [ ] **Step 4: Open pull request and inspect CI**

Todos os checks de aplicação, banco e auditoria devem concluir com sucesso antes do merge.
