# Acesso ao painel

## Contas criadas em 13/08/2026

O banco não tinha nenhum usuário em `auth.users` — ninguém havia entrado no
painel ainda. Duas contas foram criadas, ambas com papel `admin` (o trigger de
cadastro também atribui `driver` a todo usuário novo).

| E-mail | Para quê |
|---|---|
| `synvollt@gmail.com` | conta do responsável pela operação |
| `qa.painel@ultrasdokart.com.br` | conta usada na verificação automatizada |

As senhas foram entregues no relatório da sessão que as criou. **Troque a sua no
primeiro acesso** e apague a conta de QA quando ela não for mais útil:

```sql
delete from auth.users where email = 'qa.painel@ultrasdokart.com.br';
```

## Papéis disponíveis

`admin`, `organization`, `judge`, `marshal`, `finance`, `editor`, `sponsor`,
`driver`, `guardian`. O papel decide quais dos 35 módulos aparecem na navegação
e quais permitem escrita.

Para conceder um papel:

```sql
insert into user_roles (user_id, role)
select id, 'organization' from auth.users where email = 'pessoa@exemplo.com';
```

## Estado dos dados

O campeonato tem 1 temporada, 5 etapas, 5 pilotos, 5 posições de classificação
e 7 patrocinadores. As outras 25 abas do painel abrem vazias porque ainda não há
registros — inscrições, documentos, pagamentos, resultados e afins são
preenchidos pela operação.

## Verificação

`scripts/painel-smoke.mjs` percorre as 35 abas autenticadas e reporta erros de
console, requisições falhas e overflow horizontal. Precisa de `playwright-core`
e de um arquivo `contas.json` no formato `{ url, anon, contas: [{ email,
senha }] }`.
