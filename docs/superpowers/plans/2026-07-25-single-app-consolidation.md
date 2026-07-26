# UDK Single-App Consolidation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Consolidar o portal público, autenticação e painel operacional do UDK em uma única aplicação Next.js em `apps/plataforma`, publicada por um único projeto Vercel e conectada ao único projeto Supabase UDK.

**Architecture:** `apps/plataforma` passa a atender rotas públicas em `/`, fluxos de autenticação em rotas próprias e módulos protegidos em `/painel/**`. O cliente Supabase, a configuração pública, a fila offline e os dados públicos compartilham uma única origem. `apps/web-publico` é removido somente depois que todas as páginas forem migradas e o build único estiver verde.

**Tech Stack:** Next.js 16, React 19, TypeScript estrito, Supabase JS, PostgreSQL 17, RLS, Storage, Vitest, pnpm 10, Turborepo, GitHub Actions e Vercel.

## Restrições globais

- Não expor `service_role`, senha do banco ou tokens administrativos em código cliente, commits ou logs.
- Não acessar propriedades protegidas ou internas de `SupabaseClient`.
- Não cachear HTML autenticado, respostas da API ou dados pessoais no service worker.
- Não mesclar o PR #13 antes de Application CI, Supabase CI, preview Vercel e banco remoto estarem validados.
- Preservar RLS como fronteira final de autorização.
- Aplicar TDD em correções e novos utilitários testáveis.

---

## Task 1: Corrigir identificação do projeto Supabase e redirects protegidos

**Files:**
- Modify: `apps/plataforma/lib/supabase.ts`
- Modify: `apps/plataforma/lib/offline-queue.ts`
- Modify: `apps/plataforma/lib/offline-queue.test.ts`
- Modify: `apps/plataforma/app/painel/[[...slug]]/page.tsx`

- [ ] Adicionar primeiro um teste que exija `createOfflineQueueOwner(projectUrl, userId)` com URL explícita e normalizada.
- [ ] Executar `pnpm --filter @udk/plataforma test -- offline-queue.test.ts` e confirmar falha pela assinatura antiga.
- [ ] Exportar de `lib/supabase.ts` uma função pública e somente leitura para obter `NEXT_PUBLIC_SUPABASE_URL`.
- [ ] Alterar `createOfflineQueueOwner` para receber a URL configurada, sem ler `client.supabaseUrl`.
- [ ] Atualizar o painel para usar a URL explícita e falhar fechado quando ela estiver ausente.
- [ ] Alterar redirects de sessão ausente, logout e configuração de `/` para `/login`.
- [ ] Executar teste direcionado, TypeScript e build da aplicação.
- [ ] Commit: `fix: use explicit Supabase project URL for offline queue`

## Task 2: Extrair o fluxo de autenticação para rotas próprias

**Files:**
- Create: `apps/plataforma/components/auth-screen.tsx`
- Create: `apps/plataforma/lib/auth-mode.ts`
- Create: `apps/plataforma/lib/auth-mode.test.ts`
- Create: `apps/plataforma/app/login/page.tsx`
- Create: `apps/plataforma/app/recuperar-senha/page.tsx`
- Create: `apps/plataforma/app/nova-senha/page.tsx`
- Modify: `apps/plataforma/app/page.tsx`

- [ ] Escrever testes para mapear cada rota ao modo `signin`, `signup`, `reset` ou `recovery` e para gerar os redirects corretos.
- [ ] Confirmar falha dos testes antes da implementação.
- [ ] Extrair o formulário atual para `AuthScreen`, recebendo o modo inicial e preservando login, cadastro, recuperação e confirmação de nova senha.
- [ ] Configurar recuperação para retornar a `/nova-senha`.
- [ ] Criar páginas finas para `/login`, `/recuperar-senha` e `/nova-senha`.
- [ ] Reservar `app/page.tsx` para a home pública da Task 4.
- [ ] Executar lint, testes e TypeScript.
- [ ] Commit: `refactor: split authentication into dedicated routes`

## Task 3: Criar camada pública de dados e shell público

**Files:**
- Create: `apps/plataforma/lib/public-data.ts`
- Create: `apps/plataforma/lib/public-data.test.ts`
- Create: `apps/plataforma/components/public-header.tsx`
- Create: `apps/plataforma/components/public-footer.tsx`
- Create: `apps/plataforma/components/public-layout.tsx`
- Modify: `apps/plataforma/app/globals.css`

- [ ] Escrever testes para normalização de calendário, classificação, resultados, pilotos, CMS e patrocinadores.
- [ ] Confirmar falha inicial por funções inexistentes.
- [ ] Migrar a consulta das views `public_calendar`, `public_standings` e `public_results` para a aplicação única.
- [ ] Adicionar consultas públicas controladas para perfis, CMS publicado, termos publicados e patrocinadores ativos.
- [ ] Implementar fallback somente para indisponibilidade, sem mascarar erros de configuração em `/api/health`.
- [ ] Criar cabeçalho, navegação, rodapé e layout público responsivo com link para `/login`.
- [ ] Incorporar os estilos públicos ao CSS global sem alterar o shell operacional.
- [ ] Executar testes direcionados e TypeScript.
- [ ] Commit: `feat: add shared public data layer and site shell`

## Task 4: Migrar todas as páginas públicas para a aplicação única

**Files:**
- Replace: `apps/plataforma/app/page.tsx`
- Create: `apps/plataforma/app/classificacao/page.tsx`
- Create: `apps/plataforma/app/calendario/page.tsx`
- Create: `apps/plataforma/app/resultados/page.tsx`
- Create: `apps/plataforma/app/pilotos/page.tsx`
- Create: `apps/plataforma/app/pilotos/[slug]/page.tsx`
- Create: `apps/plataforma/app/regulamento/page.tsx`
- Create: `apps/plataforma/app/noticias/page.tsx`
- Create: `apps/plataforma/app/patrocinadores/page.tsx`
- Create: `apps/plataforma/app/inscricao/page.tsx`
- Modify: `apps/plataforma/app/layout.tsx`
- Modify: `apps/plataforma/app/globals.css`

- [ ] Migrar a home e os componentes visuais úteis de `apps/web-publico` sem copiar dependências obsoletas.
- [ ] Implementar classificação e calendário a partir das views públicas.
- [ ] Implementar resultados com versão, situação e melhor volta formatada.
- [ ] Implementar diretório e perfil público de pilotos.
- [ ] Implementar regulamento a partir de termos publicados.
- [ ] Implementar notícias a partir de CMS publicado, com estado vazio explícito.
- [ ] Implementar patrocinadores e campanhas públicas aprovadas.
- [ ] Implementar entrada de inscrição que redireciona usuário autenticado ao painel e visitante ao cadastro/login.
- [ ] Adicionar metadata específica por página e canonical baseado em `NEXT_PUBLIC_SITE_URL`.
- [ ] Executar lint, TypeScript, testes e build.
- [ ] Commit: `feat: migrate public portal into unified application`

## Task 5: Endurecer PWA e cache para a aplicação combinada

**Files:**
- Modify: `apps/plataforma/public/sw.js`
- Modify: `apps/plataforma/public/offline.html`
- Modify: `apps/plataforma/app/manifest.ts`
- Create: `apps/plataforma/lib/cache-policy.ts`
- Create: `apps/plataforma/lib/cache-policy.test.ts`

- [ ] Escrever testes para classificar rotas públicas cacheáveis e rotas privadas não cacheáveis.
- [ ] Confirmar falha antes da implementação.
- [ ] Impedir cache de `/painel`, `/login`, `/recuperar-senha`, `/nova-senha`, `/api/**` e respostas autenticadas/RSC privadas.
- [ ] Permitir cache somente de assets estáticos, shell público e fallback offline.
- [ ] Atualizar versão dos caches para invalidar entradas antigas.
- [ ] Definir `start_url` coerente com a home pública e manter atalho para o painel.
- [ ] Executar testes e build.
- [ ] Commit: `fix: isolate public PWA cache from authenticated routes`

## Task 6: Adicionar saúde e smoke tests da aplicação única

**Files:**
- Create or Modify: `apps/plataforma/app/api/health/route.ts`
- Create: `apps/plataforma/app/api/health/route.test.ts`
- Create: `apps/plataforma/lib/route-manifest.ts`
- Create: `apps/plataforma/lib/route-manifest.test.ts`

- [ ] Escrever testes exigindo todas as rotas públicas, de autenticação e protegidas previstas na especificação.
- [ ] Escrever teste garantindo que `/api/health` nunca devolva chaves ou tokens.
- [ ] Implementar resposta com estado da aplicação, presença de configuração pública e timestamp, sem dados privilegiados.
- [ ] Adicionar manifesto testável das rotas para impedir regressão ao remover `apps/web-publico`.
- [ ] Executar testes, lint, TypeScript e build.
- [ ] Commit: `test: cover unified routes and health endpoint`

## Task 7: Remover a segunda aplicação e alinhar o workspace

**Files:**
- Delete: `apps/web-publico/**`
- Modify: `package.json`
- Modify: `pnpm-workspace.yaml`
- Modify: `pnpm-lock.yaml`
- Modify: `scripts/verify-workspace.mjs`
- Modify: `scripts/verify-packages.mjs`
- Modify: `.github/workflows/ci.yml`
- Modify: `turbo.json`
- Modify: `apps/plataforma/package.json`
- Modify: `apps/plataforma/vercel.json`
- Modify: `apps/plataforma/.env.example`

- [ ] Atualizar primeiro as verificações para exigir exatamente uma aplicação implantável, `@udk/plataforma`.
- [ ] Confirmar que a verificação falha enquanto `apps/web-publico` ainda existir.
- [ ] Remover `apps/web-publico` e referências cruzadas.
- [ ] Regenerar o lockfile com `pnpm install --lockfile-only`.
- [ ] Renomear o portão de build da CI para “Build unified application”.
- [ ] Garantir Node 22 em `engines`, Vercel e documentação do projeto.
- [ ] Executar `pnpm verify`, lint, TypeScript, testes e build.
- [ ] Commit: `refactor: remove separate public application workspace`

## Task 8: Atualizar documentação e checklist de conexão única

**Files:**
- Modify: `README.md`
- Modify: `docs/DEPLOY.md`
- Modify: `docs/FINAL_CONNECTION_CHECKLIST.md`
- Modify: `docs/superpowers/specs/2026-07-25-single-app-consolidation-design.md`

- [ ] Remover instruções de dois projetos Vercel e duas URLs.
- [ ] Documentar um único domínio, um único Root Directory e três variáveis públicas.
- [ ] Documentar `/login`, `/nova-senha`, `/painel` e `/api/health`.
- [ ] Documentar promoção segura do primeiro administrador e revogação de tokens expostos.
- [ ] Executar busca no repositório por `web-publico`, `NEXT_PUBLIC_PLATFORM_URL`, “duas aplicações” e instruções obsoletas.
- [ ] Commit: `docs: describe single-app deployment workflow`

## Task 9: Validar branch completa no GitHub Actions

**Files:**
- Verify: `.github/workflows/ci.yml`
- Verify: `.github/workflows/database.yml`

- [ ] Disparar Application CI no novo head.
- [ ] Confirmar workspace, lint, TypeScript, testes e build com conclusão `success`.
- [ ] Disparar Supabase CI se migrations ou testes forem alterados.
- [ ] Confirmar start, reset, seed, pgTAP e lint com conclusão `success`.
- [ ] Abrir artifacts de diagnóstico se qualquer portão falhar e corrigir uma causa por vez.

## Task 10: Aplicar e verificar migrations no Supabase UDK

**Remote project:** `gyhsirfwwsmugvirpwsi`

- [ ] Comparar migrations locais com a lista remota vazia.
- [ ] Aplicar `202607180001` até a migration final em ordem, mantendo o mesmo nome/versionamento.
- [ ] Verificar tabelas, views, funções, triggers, RLS e seis buckets.
- [ ] Verificar dados iniciais da temporada 2026.
- [ ] Executar advisors de segurança e corrigir achados acionáveis.
- [ ] Executar advisors de desempenho e corrigir regressões relevantes sem enfraquecer RLS.
- [ ] Confirmar que nenhuma chave privilegiada foi adicionada à aplicação.

## Task 11: Configurar e validar o único projeto Vercel

**Vercel team:** `team_Ss9zfW9fbpZ33g7l7M0SQ9QD`
**Vercel project:** `prj_DIsV5cNbajNXJ7V6Z1hrFAo7DVPO`

- [ ] Confirmar Root Directory `apps/plataforma`, Framework Next.js e Production Branch `main`.
- [ ] Alinhar Node 22 por configuração disponível e `package.json`.
- [ ] Confirmar `NEXT_PUBLIC_SUPABASE_URL`, chave pública e `NEXT_PUBLIC_SITE_URL` nos ambientes necessários.
- [ ] Disparar um preview do head consolidado.
- [ ] Ler build logs e corrigir qualquer divergência específica da Vercel.
- [ ] Validar `/`, `/login`, `/classificacao`, `/calendario`, `/painel` e `/api/health` no preview.

## Task 12: Revisão final, merge e produção

- [ ] Atualizar a descrição do PR #13 para refletir uma aplicação única.
- [ ] Confirmar ausência de threads críticas abertas.
- [ ] Confirmar Application CI, Supabase CI e Vercel preview verdes no mesmo head.
- [ ] Fazer squash merge do PR #13 com o head esperado.
- [ ] Aguardar deployment de produção da `main`.
- [ ] Validar domínio de produção, home, login, recuperação, páginas públicas e bloqueio do painel sem sessão.
- [ ] Validar `/api/health` e consultas públicas ao Supabase.
- [ ] Registrar no PR o resumo da implantação e evidências finais.
