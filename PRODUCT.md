# Ultras do Kart

<!-- impeccable:product-schema 1 -->

## Platform

web

## Product Purpose

Site e plataforma do campeonato Ultras do Kart. O pedido do usuário é refazer páginas, componentes e navegação para celular e desktop.

## Brand Commitments

- Manter azul/ciano, conforme resposta explícita do usuário.
- Usar mídia real do campeonato, preservando pessoas, karts e marcas; não gerar substitutos para fotografias existentes.
- Preservar o nome e a marca UDK.
- O usuário rejeitou a apresentação atual por parecer pouco moderna, pouco criativa e conter textos com aparência de conteúdo gerado por IA.
- Textos devem ser específicos, curtos e naturais em português brasileiro.

## Evidence on Hand

- Implementação existente em `apps/plataforma`: calendário, classificação, resultados, pilotos, notícias, regulamento, patrocinadores, inscrição, autenticação e painel.
- Fotos, vídeo e marcas existentes em `apps/plataforma/public/media/official` e `apps/plataforma/public/brand`.
- Dados do campeonato nas integrações existentes; resultados oficiais em PDF.
- A implementação exibe etapas em Betim e categorias Ultras Rápidos e Ultras Insanos. Estes fatos devem continuar ligados às fontes existentes.

## Capabilities and Constraints

Reaproveitar os fluxos e integrações existentes. Uma mudança visual não autoriza inventar depoimentos, fotos de pilotos, preços, posições, estatísticas ou regras. Não alterar dados oficiais, permissões ou autenticação durante o redesenho.

## Direction Status

O usuário rejeitou a composição Equipe UDK em 6 de outubro de 2026. Ela não é uma referência aprovada para o estado atual.

A proposta A, Corrida em destaque, foi aprovada no painel de decisão em 8 de outubro de 2026: `optionId a`, `buildPath comp`, seed `d4dff423`, comp `.impeccable/mocks/beauty-20261006/a.png`. A confirmação e a procedência estão em `a.json` no mesmo diretório. O comp é uma captura de HTML com fotografia real; a geração nativa falhou e nenhuma imagem gerada foi usada. Essa escolha substitui a recuperação anterior como referência visual da Home.

A implementação separa título e ações da foto estática e une foto e ticket ciano da próxima etapa. Preserva dados, integrações e destinos dos fluxos existentes. O poster anterior continua usado em outras superfícies; o novo recorte da Home tem fonte histórica, transformação e hash registrados no manifesto de mídia e na procedência do PNG.

A evidência visual e o encerramento procedural são distintos: o gate `plates` permanece aberto por identificar a foto real, também usada no comp HTML, como recorte do comp. `.impeccable/build/source-photo-exception.md` registra a limitação; não houve `--force`, regeneração de pessoas ou aprovação forjada. Capturas e comparação visual apoiam a fidelidade da composição, sem provar todas as abas autenticadas ou a conclusão dos fluxos de inscrição e recuperação de senha.

O contrato da Home está em `apps/plataforma/.impeccable/surfaces/apps-plataforma-app-page-tsx.md`; `DESIGN.md` e `.impeccable/design.json` registram os padrões reutilizados na implementação. A revisão e suas evidências ficam em `.impeccable/review/beauty-20261008`.
