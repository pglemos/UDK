# Checklist final de conexão

O código, os aplicativos, as migrations, os testes e os workflows permanecem no GitHub. Depois do merge, somente as credenciais e os projetos externos precisam ser criados.

## 1. Supabase

Crie um projeto vazio no Supabase e copie:

- Project Reference;
- Project URL;
- Publishable/anon key.

No terminal, na raiz do repositório:

```bash
supabase login
supabase link --project-ref SEU_PROJECT_REF
supabase db push
```

As migrations criam o schema, RLS, funções, views, buckets e dados iniciais. Não execute SQL manual fora das migrations.

### URLs de autenticação

No painel do Supabase, em **Authentication → URL Configuration**, cadastre:

- URL do portal público;
- URL da plataforma;
- URL da plataforma com `/?recovery=1` para recuperação de senha;
- URLs de preview do Vercel, quando necessárias.

### Estrutura dos arquivos privados

As políticas de Storage exigem escopo explícito. A aplicação grava automaticamente nos formatos:

```text
season/<season-id>/<user-id>/<arquivo>
championship/<championship-id>/<user-id>/<arquivo>
```

Não mova objetos manualmente para caminhos sem temporada ou campeonato, pois eles serão recusados pelas políticas RLS.

## 2. Vercel: portal público

Importe o repositório `pglemos/UDK`.

- Root Directory: `apps/web-publico`
- Framework: Next.js
- Node.js: 22

Variáveis:

```text
NEXT_PUBLIC_SUPABASE_URL=https://SEU_PROJETO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=SUA_CHAVE_PUBLICA
NEXT_PUBLIC_SITE_URL=https://SEU_DOMINIO_PUBLICO
NEXT_PUBLIC_PLATFORM_URL=https://SEU_DOMINIO_DA_PLATAFORMA
```

## 3. Vercel: plataforma

Importe o mesmo repositório como um segundo projeto.

- Root Directory: `apps/plataforma`
- Framework: Next.js
- Node.js: 22

Variáveis:

```text
NEXT_PUBLIC_SUPABASE_URL=https://SEU_PROJETO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=SUA_CHAVE_PUBLICA
NEXT_PUBLIC_SITE_URL=https://SEU_DOMINIO_DA_PLATAFORMA
```

## 4. Primeiro administrador

Crie o primeiro usuário pelo fluxo de cadastro da plataforma. Depois, no SQL Editor do Supabase, promova somente essa conta inicial:

```sql
update public.user_roles
set role = 'admin'
where user_id = (
  select id from auth.users where email = 'SEU_EMAIL'
);
```

A partir daí, papéis, escopos e permissões granulares são administrados pela própria plataforma. Organizações não conseguem conceder o papel global de administrador.

## 5. Verificação após publicação

Confirme:

- `/api/health` do portal retorna sucesso;
- `/api/health` da plataforma retorna sucesso;
- cadastro, login e logout funcionam;
- o e-mail de recuperação abre a tela de nova senha e exige confirmação;
- o usuário administrador abre todos os módulos;
- contas sem papel ativo falham de forma fechada;
- o portal lê calendário e classificação;
- upload privado não gera URL pública e fica dentro do escopo correto;
- fila offline permanece vinculada à conta e ao projeto Supabase;
- Application CI e Supabase CI continuam verdes na `main`.

## Segurança

Nunca cadastre `service_role` como variável pública ou em qualquer aplicativo do navegador. Os dois projetos usam somente URL e chave pública; privilégios são controlados pelo Supabase Auth e pelas políticas RLS.
