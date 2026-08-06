# Patrocinadores Oficiais UDK - Design

## Objetivo

Publicar o roster atual de patrocinadores do UDK no portal público e preparar o banco para manter os mesmos dados no módulo administrativo.

## Roster oficial

A implementação publica exatamente estas marcas:

1. Grupo Emtel
2. Firepit Brasil
3. Guicosmos TV
4. AKAMIG
5. TransferMix
6. Veste Custom Wear
7. Vintage São Francisco

PVF Transportes deve ser removida e não pode aparecer no fallback, na migração ou na experiência pública.

## Dados comerciais

- `tier`: `Patrocinador oficial`
- `status`: `active`
- `logo_url`: arquivo WebP local em `/sponsors/<slug>.webp`
- `website_url`: perfil oficial no Instagram, usado como destino externo do card

Não será criado um novo campo de banco apenas para Instagram. O schema atual já possui `website_url`, suficiente para o único destino público necessário nesta entrega. Isso evita uma expansão de schema sem ganho funcional.

## Comportamento público

- A página `/patrocinadores` exibe logo, categoria comercial, nome e identificador do Instagram.
- Cada card abre o perfil externo em nova aba com `rel="noreferrer"`.
- A Home continua consumindo `getSponsors()` e exibe o roster oficial.
- Dados antigos ou incompletos vindos do banco não substituem logos e links oficiais locais.
- Registros fora do roster oficial não aparecem no portal público.

## Banco e administração

Uma migração idempotente deve:

- localizar o campeonato `udk`;
- remover `pvf-transportes`;
- inserir ou atualizar o roster oficial;
- remover registros ativos do campeonato que não pertençam ao roster definido nesta entrega;
- preservar a estrutura existente do módulo administrativo.

## Ativos

Todos os arquivos serão convertidos para WebP com canvas transparente de 1200 x 600 px, conteúdo centralizado e proporção original preservada. Nenhum card deve depender de imagem remota.

## Testes

Os testes devem garantir:

- roster exato de sete marcas;
- ausência de PVF;
- categoria comercial exata;
- caminhos locais de logo;
- URLs de Instagram válidas;
- mesclagem determinística entre banco e fallback;
- presença dos ativos no diretório público;
- migração idempotente com remoção de dados aposentados.
