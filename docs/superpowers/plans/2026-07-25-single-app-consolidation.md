# UDK Single-App Consolidation Implementation Plan

**Goal:** Uma aplicação Next.js em `apps/plataforma`, um projeto Vercel e um projeto Supabase.

## Executado

- [x] Portal público, autenticação e painel no mesmo App Router.
- [x] Rotas públicas, login, recuperação, nova senha, inscrição e saúde.
- [x] PWA sem cache de rotas privadas.
- [x] Fila offline vinculada ao usuário e URL explícita do Supabase.
- [x] `apps/web-publico` removido e lockfile normalizado.
- [x] CI corrigida com códigos de saída reais.
- [x] Migrations reproduzidas localmente e aplicadas ao Supabase UDK.
- [x] RLS, Storage, auditoria, segurança de views e privilégios de funções endurecidos.
- [x] Todas as chaves estrangeiras públicas indexadas.
- [x] Preview Vercel único em Node 22 gerou as rotas previstas.

## Arquitetura final

```text
apps/plataforma
├── /                         portal público
├── /calendario
├── /classificacao
├── /resultados
├── /pilotos
├── /pilotos/[slug]
├── /regulamento
├── /noticias
├── /patrocinadores
├── /inscricao
├── /login
├── /recuperar-senha
├── /nova-senha
├── /painel/**               operação autenticada
└── /api/health
```

## Infraestrutura

```text
Vercel: ULTRAS / udk / apps/plataforma / Node 22
Supabase: UDK / gyhsirfwwsmugvirpwsi / sa-east-1 / PostgreSQL 17
```

## Portões restantes

- [ ] CI final no mesmo head.
- [ ] Preview Vercel final `READY`.
- [ ] Squash merge do PR #13.
- [ ] Produção `READY` e smoke tests.
