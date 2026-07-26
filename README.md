# UDK • Ultras do Kart

[![Application CI](https://github.com/pglemos/UDK/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/pglemos/UDK/actions/workflows/ci.yml)
[![Supabase CI](https://github.com/pglemos/UDK/actions/workflows/database.yml/badge.svg?branch=main)](https://github.com/pglemos/UDK/actions/workflows/database.yml)

Portal público e plataforma operacional do campeonato **Ultras do Kart**, entregues por uma única aplicação Next.js, um projeto Vercel e um projeto Supabase.

## Aplicação

| Diretório | Porta local | Superfícies |
|---|---:|---|
| `apps/plataforma` | 3001 | Portal público, autenticação, painel, PWA e API de saúde |

Rotas principais:

- `/`: portal público;
- `/calendario`, `/classificacao`, `/resultados` e `/pilotos`: dados públicos;
- `/regulamento`, `/noticias` e `/patrocinadores`: conteúdo publicável;
- `/inscricao`: entrada no fluxo de inscrição;
- `/login`, `/recuperar-senha` e `/nova-senha`: autenticação;
- `/painel/**`: operação autenticada;
- `/api/health`: saúde sem exposição de credenciais.

## Tecnologia

- Next.js 16 e React 19;
- TypeScript 5.9;
- pnpm e Turborepo;
- Supabase Auth, PostgreSQL 17, RLS e Storage;
- Vitest e pgTAP;
- GitHub Actions e Vercel.

## Banco de dados

As migrations em `supabase/migrations/` criam o schema esportivo e administrativo, views públicas, funções, triggers, políticas RLS, buckets privados e dados iniciais da temporada 2026.

## Início local

```bash
corepack enable
pnpm install
supabase start
cp apps/plataforma/.env.example apps/plataforma/.env.local
pnpm dev
```

Variáveis públicas necessárias:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
NEXT_PUBLIC_SITE_URL
```

Nunca exponha `service_role`, senha do banco, tokens Vercel ou tokens administrativos do Supabase no navegador ou no repositório.

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

Os mesmos portões são executados pelo GitHub Actions com preservação dos logs como artifacts.

## Publicação

O procedimento para aplicar migrations, configurar o único projeto Vercel e validar produção está em [`docs/DEPLOY.md`](docs/DEPLOY.md).

## Especificação e plano

A especificação aprovada e os planos técnicos ficam em `docs/superpowers/`.
