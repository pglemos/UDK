# Checklist final da aplicação única

## Supabase UDK

- [x] Projeto `UDK` ativo na região `sa-east-1`.
- [x] Project ref `gyhsirfwwsmugvirpwsi` confirmado.
- [x] Migrations `202607180001` a `202607180015` aplicadas no projeto remoto.
- [ ] Schema, RLS, funções, views e buckets verificados funcionalmente ponta a ponta.
- [ ] Seed da temporada 2026 confirmado no ambiente remoto.
- [x] Advisors de segurança e desempenho revisados.

Os advisors ainda registram recomendações sobre permissões de funções `SECURITY DEFINER`, inicialização de `auth.uid()` em políticas RLS e políticas permissivas sobrepostas. Essas recomendações devem ser tratadas em uma migration dedicada, com testes de autorização, sem revogações genéricas que possam interromper as políticas atuais.

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
- [x] Fila offline permanece vinculada ao usuário e ao projeto, limita tentativas e coloca falhas persistentes em quarentena criptografada.
- [x] Modal administrativo restaura foco, fecha com `Escape` e mantém navegação por `Tab` dentro do diálogo.
- [ ] Service worker não cacheia painel, autenticação, API ou RSC privado.
- [ ] `/api/health` retorna `app: udk` sem credenciais.

## Portões finais

- [ ] `pnpm verify`.
- [x] `pnpm lint`.
- [x] `pnpm typecheck`.
- [x] `pnpm test`.
- [x] `pnpm build`.
- [x] Supabase CI verde no head final.
- [x] Application CI verde no head final.
- [ ] Preview Vercel `READY` no head final.
- [ ] PR #13 mesclado por squash.
- [ ] Deployment de produção `READY`.

## Segurança

Nunca cadastre `service_role`, senha do banco ou tokens administrativos em variáveis públicas, arquivos do repositório, logs ou código do navegador. Revogue tokens enviados em conversas ou outros canais não destinados a segredos.
