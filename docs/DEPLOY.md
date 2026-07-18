# Deploy da Plataforma UDK

Este repositório gera **dois projetos Vercel** conectados ao mesmo projeto Supabase:

| Projeto | Diretório raiz | Finalidade |
|---|---|---|
| UDK Portal | `apps/web-publico` | Site, calendário, classificação, resultados e pilotos |
| UDK Plataforma | `apps/plataforma` | Login e operação administrativa |

## 1. Criar e conectar o Supabase

1. Crie um projeto vazio no Supabase.
2. Instale a CLI do Supabase e autentique-se.
3. Na raiz do repositório, execute:

```bash
supabase login
supabase link --project-ref SEU_PROJECT_REF
supabase db push
```

O `db push` aplica:

- campeonato, temporada, categorias e etapas;
- perfis, papéis e permissões;
- pilotos e inscrições;
- pagamentos PIX;
- resultados e classificação;
- penalidades e recursos;
- equipes e stints de Endurance;
- patrocinadores, CMS e notificações;
- auditoria;
- RLS;
- buckets público e privado;
- dados iniciais da temporada UDK 2026.

Antes de usar produção, valide o banco localmente:

```bash
supabase start
supabase db reset
supabase test db
supabase db lint --level warning
```

## 2. Criar o primeiro administrador

1. Conecte temporariamente o projeto `apps/plataforma` ao Supabase.
2. Crie a conta do administrador no Supabase Authentication.
3. No SQL Editor, execute, substituindo o e-mail:

```sql
insert into public.user_roles (user_id, role)
select u.id, 'admin'
from auth.users u
where u.email = 'SEU_EMAIL_ADMIN'
  and not exists (
    select 1
    from public.user_roles r
    where r.user_id = u.id
      and r.role = 'admin'
  );
```

O cadastro de usuário cria automaticamente o perfil e o papel inicial `driver`.

## 3. Variáveis do Supabase

No painel do Supabase, abra **Project Settings → API** e copie:

- Project URL;
- Publishable key ou anon key.

Nunca coloque a `service_role` em variável `NEXT_PUBLIC_*`.

## 4. Projeto Vercel do portal público

Importe `pglemos/UDK` no Vercel e configure:

```text
Root Directory: apps/web-publico
Framework Preset: Next.js
Node.js: 22
```

Variáveis:

```text
NEXT_PUBLIC_SUPABASE_URL=https://SEU_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=SUA_CHAVE_PUBLICA
NEXT_PUBLIC_SITE_URL=https://SEU_DOMINIO_PUBLICO
NEXT_PUBLIC_PLATFORM_URL=https://SEU_DOMINIO_DA_PLATAFORMA
```

O portal possui fallback visual para desenvolvimento, mas em produção deve receber as variáveis acima para carregar calendário e classificação do Supabase.

## 5. Projeto Vercel da plataforma

Importe o mesmo repositório novamente e configure:

```text
Root Directory: apps/plataforma
Framework Preset: Next.js
Node.js: 22
```

Variáveis:

```text
NEXT_PUBLIC_SUPABASE_URL=https://SEU_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=SUA_CHAVE_PUBLICA
NEXT_PUBLIC_SITE_URL=https://SEU_DOMINIO_DA_PLATAFORMA
```

## 6. URLs de autenticação

No Supabase, abra **Authentication → URL Configuration**.

Configure:

```text
Site URL: https://SEU_DOMINIO_DA_PLATAFORMA
```

Adicione como Redirect URLs:

```text
https://SEU_DOMINIO_DA_PLATAFORMA/**
https://SEU_PREVIEW_VERCEL.app/**
http://localhost:3001/**
```

## 7. Domínios

Sugestão:

```text
Portal público: udk.seudominio.com.br
Plataforma: app.udk.seudominio.com.br
```

Depois de vincular os domínios, atualize `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_PLATFORM_URL` e as URLs autorizadas no Supabase.

## 8. Ordem recomendada de publicação

1. Criar o projeto Supabase.
2. Executar `supabase db push`.
3. Criar e promover o primeiro administrador.
4. Publicar `apps/plataforma` no Vercel.
5. Publicar `apps/web-publico` no Vercel.
6. Configurar domínios.
7. Atualizar URLs de autenticação.
8. Testar `/api/health` nos dois projetos.
9. Validar login, calendário, classificação e políticas de acesso.

## 9. Verificação final

Portal:

```text
GET https://SEU_DOMINIO_PUBLICO/api/health
```

Resposta esperada:

```json
{"status":"ok","app":"web-publico"}
```

Plataforma:

```text
GET https://SEU_DOMINIO_DA_PLATAFORMA/api/health
```

Resposta esperada:

```json
{"status":"ok","app":"plataforma"}
```

## 10. Desenvolvimento local

```bash
corepack enable
pnpm install
supabase start
```

Crie os arquivos locais a partir dos exemplos:

```bash
cp apps/web-publico/.env.example apps/web-publico/.env.local
cp apps/plataforma/.env.example apps/plataforma/.env.local
```

Depois:

```bash
pnpm dev
```

- Portal: `http://localhost:3000`
- Plataforma: `http://localhost:3001`
- Supabase Studio: `http://localhost:54323`
