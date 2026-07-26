# UDK Single-App Consolidation Design

Date: 2026-07-25  
Status: Implemented  
Branch: `feat/complete-operational-modules`

## Objective

Consolidar o UDK em uma aplicação Next.js, um projeto Vercel e um projeto Supabase.

## Arquitetura implementada

A aplicação sobrevivente é `apps/plataforma`. O antigo `apps/web-publico` foi migrado e removido.

O mesmo domínio atende:

- portal público em `/`;
- calendário, classificação, resultados e pilotos;
- regulamento, notícias, patrocinadores e inscrição;
- autenticação em `/login`, `/recuperar-senha` e `/nova-senha`;
- painel protegido em `/painel/**`;
- saúde em `/api/health`.

## Segurança

- RLS permanece como fronteira final de autorização.
- Views públicas executam com `security_invoker`.
- Funções internas não são RPCs públicas.
- Storage privado usa escopo de campeonato ou temporada.
- Service worker não cacheia painel, autenticação, API ou respostas privadas.
- Nenhuma variável pública contém `service_role`, senha ou token administrativo.

## Dados e operação

O Supabase UDK contém schema esportivo e administrativo, auditoria, exclusão lógica, CMS, patrocinadores, Endurance, julgamento, pagamentos, documentos, views públicas, seis buckets e dados iniciais de 2026.

Todas as chaves estrangeiras do schema público possuem índice compatível.

## Implantação

```text
Vercel
Time: ULTRAS
Projeto: udk
Root Directory: apps/plataforma
Node.js: 22.x
Production Branch: main

Supabase
Projeto: UDK
Ref: gyhsirfwwsmugvirpwsi
Região: sa-east-1
PostgreSQL: 17
```

## Conclusão

A implementação somente é considerada encerrada após CI no head final, preview Vercel `READY`, squash merge, deployment de produção `READY` e smoke tests no domínio final.
