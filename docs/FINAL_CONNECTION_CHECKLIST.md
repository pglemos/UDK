# Checklist final da aplicação única

## Supabase UDK

- [ ] Projeto `UDK` ativo na região `sa-east-1`.
- [ ] Project ref `gyhsirfwwsmugvirpwsi` confirmado.
- [ ] Todas as migrations locais aplicadas na ordem.
- [ ] Schema, RLS, funções, views e buckets verificados.
- [ ] Seed da temporada 2026 presente.
- [ ] Advisors de segurança e desempenho revisados.

Comandos de referência:

```bash
supabase link --project-ref gyhsirfwwsmugvirpwsi
supabase db push
```

## Vercel UDK

Uma única configuração:

```text
Time: ULTRAS
Projeto: udk
Root Directory: apps/plataforma
Framework: Next.js
Node.js: 22.x
Production Branch: main
```

Variáveis públicas:

```text
NEXT_PUBLIC_SUPABASE_URL=https://gyhsirfwwsmugvirpwsi.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=SUA_CHAVE_PUBLICA
NEXT_PUBLIC_SITE_URL=https://SEU_DOMINIO
```

## Autenticação

Em **Supabase → Authentication → URL Configuration**:

- [ ] Site URL aponta para o único domínio da aplicação.
- [ ] O domínio de produção está permitido.
- [ ] Previews Vercel necessários estão permitidos.
- [ ] `http://localhost:3001/**` está permitido para desenvolvimento.
- [ ] Recuperação retorna para `/nova-senha`.

## Primeiro administrador

- [ ] Criar conta por `/login?cadastro=1`.
- [ ] Confirmar o e-mail.
- [ ] Conceder `admin` somente à conta inicial pelo SQL Editor.
- [ ] Administrar papéis seguintes pelo painel.

## Storage privado

Caminhos aceitos:

```text
season/<season-id>/<user-id>/<arquivo>
championship/<championship-id>/<user-id>/<arquivo>
```

- [ ] Arquivo privado não possui URL pública.
- [ ] Upload com falha remove objeto órfão.
- [ ] Usuário sem escopo não acessa arquivo de outro campeonato ou temporada.

## Verificação funcional

- [ ] `/` carrega o portal público.
- [ ] `/calendario`, `/classificacao`, `/resultados` e `/pilotos` respondem.
- [ ] `/regulamento`, `/noticias` e `/patrocinadores` exibem somente conteúdo publicável.
- [ ] `/login` permite autenticação e cadastro.
- [ ] `/recuperar-senha` envia o link.
- [ ] `/nova-senha` exige confirmação.
- [ ] `/painel` rejeita visitante.
- [ ] Conta sem papel ativo falha de forma fechada.
- [ ] Administrador acessa os módulos autorizados.
- [ ] Fila offline permanece vinculada ao usuário e ao projeto.
- [ ] Service worker não cacheia painel, autenticação, API ou RSC privado.
- [ ] `/api/health` retorna `app: udk` sem credenciais.

## Portões finais

- [ ] `pnpm verify`.
- [ ] `pnpm lint`.
- [ ] `pnpm typecheck`.
- [ ] `pnpm test`.
- [ ] `pnpm build`.
- [ ] Supabase CI verde.
- [ ] Application CI verde.
- [ ] Preview Vercel `READY`.
- [ ] PR #13 mesclado por squash.
- [ ] Deployment de produção `READY`.

## Segurança

Nunca cadastre `service_role`, senha do banco ou tokens administrativos em variáveis públicas, arquivos do repositório, logs ou código do navegador. Revogue tokens enviados em conversas ou outros canais não destinados a segredos.
