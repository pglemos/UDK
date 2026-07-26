# Deploy da aplicação UDK

O repositório publica **uma única aplicação Next.js** em `apps/plataforma`, conectada a um único projeto Supabase.

## 1. Supabase

Projeto conectado:

```text
Nome: UDK
Project ref: gyhsirfwwsmugvirpwsi
Região: sa-east-1
PostgreSQL: 17
```

Aplique somente as migrations versionadas:

```bash
supabase login
supabase link --project-ref gyhsirfwwsmugvirpwsi
supabase db push
```

Antes de produção, reproduza o banco localmente:

```bash
supabase start
supabase db reset
supabase test db
supabase db lint --level warning
```

As migrations criam schema, views públicas, funções, triggers, RLS, buckets e os dados iniciais de 2026. Não faça mudanças manuais em produção sem uma migration correspondente.

## 2. Primeiro administrador

Crie a conta pelo fluxo `/login?cadastro=1`. Depois, no SQL Editor, promova somente a conta inicial:

```sql
insert into public.user_roles (user_id, role)
select id, 'admin'
from auth.users
where email = 'SEU_EMAIL_ADMIN'
on conflict do nothing;
```

Organizações e operadores comuns não podem conceder o papel global de administrador.

## 3. Projeto Vercel único

Projeto conectado:

```text
Time: ULTRAS
Projeto: udk
Root Directory: apps/plataforma
Framework Preset: Next.js
Production Branch: main
Node.js: 22.x
```

Variáveis para Development, Preview e Production:

```text
NEXT_PUBLIC_SUPABASE_URL=https://gyhsirfwwsmugvirpwsi.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=SUA_CHAVE_PUBLICA
NEXT_PUBLIC_SITE_URL=https://SEU_DOMINIO
```

Nunca adicione `service_role`, senha do banco, token Vercel ou token administrativo do Supabase como variável `NEXT_PUBLIC_*`.

## 4. URLs de autenticação

Em **Supabase → Authentication → URL Configuration**:

```text
Site URL: https://SEU_DOMINIO
```

Redirect URLs:

```text
https://SEU_DOMINIO/**
https://SEU_PREVIEW_VERCEL.app/**
http://localhost:3001/**
```

A recuperação de senha retorna para `/nova-senha`.

## 5. Superfícies de produção

Valide no mesmo domínio:

```text
/                       portal público
/login                  autenticação
/recuperar-senha        solicitação de recuperação
/nova-senha             definição de nova senha
/calendario             calendário público
/classificacao          classificação pública
/resultados              resultados públicos
/pilotos                pilotos públicos
/regulamento            regulamento publicado
/noticias               CMS público
/patrocinadores         parceiros ativos
/inscricao              entrada de inscrição
/painel                 operação autenticada
/api/health             saúde da aplicação
```

Resposta mínima de saúde:

```json
{
  "status": "ok",
  "app": "udk",
  "supabaseConfigured": true,
  "timestamp": "ISO-8601"
}
```

## 6. Verificação final

- home pública carrega;
- login, cadastro, logout e recuperação funcionam;
- `/painel` rejeita visitante;
- conta sem papel ativo falha de forma fechada;
- calendário, classificação e resultados usam views públicas;
- arquivos privados não geram URL pública;
- service worker não armazena páginas autenticadas;
- Application CI e Supabase CI estão verdes na `main`;
- deployment Vercel de produção termina em `READY`.

## 7. Desenvolvimento local

```bash
corepack enable
pnpm install
supabase start
cp apps/plataforma/.env.example apps/plataforma/.env.local
pnpm dev
```

Aplicação: `http://localhost:3001`  
Supabase Studio: `http://localhost:54323`
