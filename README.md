# UDK • Ultras do Kart

[![Application CI](https://github.com/pglemos/UDK/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/pglemos/UDK/actions/workflows/ci.yml)
[![Supabase CI](https://github.com/pglemos/UDK/actions/workflows/database.yml/badge.svg?branch=main)](https://github.com/pglemos/UDK/actions/workflows/database.yml)

Plataforma oficial do campeonato **Ultras do Kart**, preparada para operar com dois projetos Next.js no Vercel e um projeto Supabase compartilhado.

## Aplicações

| Aplicação | Diretório | Porta local | Função |
|---|---|---:|---|
| Portal público | `apps/web-publico` | 3000 | Calendário, classificação, resultados, pilotos e inscrições |
| Plataforma | `apps/plataforma` | 3001 | Autenticação, dashboard e módulos operacionais |

## Tecnologia

- Next.js 16;
- React 19;
- TypeScript 5.9;
- pnpm e Turborepo;
- Supabase Auth, PostgreSQL, RLS e Storage;
- Vitest;
- GitHub Actions;
- Vercel.

## Banco de dados

As migrations em `supabase/migrations/` criam:

- campeonato, temporadas, categorias e etapas;
- perfis, papéis e permissões;
- pilotos, inscrições e pagamentos;
- resultados, classificação, penalidades e recursos;
- equipes e stints de Endurance;
- patrocinadores, CMS, notificações e auditoria;
- views públicas;
- RLS e buckets de arquivos;
- dados iniciais da temporada UDK 2026.

## Início local

```bash
corepack enable
pnpm install
supabase start
cp apps/web-publico/.env.example apps/web-publico/.env.local
cp apps/plataforma/.env.example apps/plataforma/.env.local
pnpm dev
```

## Qualidade

```bash
pnpm verify
pnpm lint
pnpm typecheck
pnpm test
pnpm build
supabase db reset
supabase test db
supabase db lint --level warning
```

Essas verificações também são executadas pelo GitHub Actions.

## Publicação

O procedimento completo para criar o Supabase, aplicar migrations e conectar os dois projetos Vercel está em:

[`docs/DEPLOY.md`](docs/DEPLOY.md)

## Especificação

A especificação aprovada e os planos técnicos ficam em `docs/superpowers/`.
