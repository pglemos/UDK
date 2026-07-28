# UDK Twice + The Grind Redesign — Design Specification

## Status

Aprovado para implementação integral no aplicativo Next.js e publicação final na `main`.

## Direção criativa

O portal público do Ultras do Kart será reconstruído com a seguinte proporção:

- **60% Twice Media House:** composição cinematográfica, hero audiovisual, tipografia editorial, navegação imersiva, transições e apresentação de etapas como projetos.
- **40% The Grind:** narrativa humana, comunidade, conteúdo longo com ritmo, conversão progressiva, números reais e formulários em etapas.

As referências orientam arquitetura, ritmo, movimento e acabamento. Código, textos, imagens e identidade proprietária não serão copiados.

## Objetivo

Transformar o UDK em uma experiência esportiva premium, emocional e confiável, com dados oficiais do Supabase, foco em inscrição e profundidade de comunidade. O resultado não deve parecer dashboard SaaS, template genérico ou coleção de cards escuros.

## Princípios obrigatórios

1. Fotografia e vídeo ocupam papéis estruturais, não decorativos.
2. Cada seção possui composição própria, mas segue um sistema visual único.
3. O ciano é acento, nunca um banho permanente sobre a página.
4. Grandes títulos aparecem em pontos de impacto, não em toda seção.
5. Dados esportivos recebem leitura editorial e de transmissão.
6. Estados vazios são honestos e visualmente completos.
7. Nenhuma estatística, notícia, resultado ou patrocinador será inventado.
8. Logo oficial UDK sem distorção, reconstrução ou efeitos destrutivos.
9. Movimento deve reforçar hierarquia e navegação, respeitando `prefers-reduced-motion`.
10. Desktop, tablet e mobile possuem composição própria.

## Sistema visual

### Paleta

- Fundo principal: `#07090B`.
- Asfalto: `#0D1115`.
- Papel editorial: `#F4F2EC`.
- Texto claro: `#F7F8F8`.
- Texto escuro: `#111316`.
- Ciano UDK: `#00D9FF`.
- Dourado, prata e bronze apenas para pódio.

### Tipografia

- Headings: Roboto Condensed, pesos 700–900.
- Interface e texto: Roboto, pesos 400–700.
- Títulos com itálico somente em palavras de tensão ou movimento.
- Largura de leitura de texto editorial limitada a 68 caracteres.

### Motivos de assinatura

- Marcas de corte e numeração técnica discreta.
- Trilhos horizontais para etapas e histórias.
- Painéis editoriais claros alternados com fotografia full-bleed.
- Linhas cinéticas e transições por máscara.
- Menu fullscreen com rotas numeradas e imagem contextual.

## Shell global

### Header

- Transparente sobre o hero.
- Sólido e compacto após scroll.
- Logo à esquerda, navegação central, login e inscrição à direita.
- Menu mobile fullscreen com rotas numeradas.
- Indicador de rota ativa discreto.

### Footer

- Logo grande, manifesto curto, navegação, Instagram e localização.
- CTA de inscrição com forte hierarquia.
- Fundo visual com movimento sutil e sem links irrelevantes.

## Home

1. Intro curta com logo e transição por máscara.
2. Hero de 90vh com imagem autorizada existente, título em duas linhas, inscrição e calendário.
3. Próxima etapa integrada ao hero com data, local, traçado e contagem regressiva.
4. Faixa cinética da temporada.
5. Manifesto editorial em fundo claro com texto e fotografia.
6. Temporada apresentada como projetos, com etapa principal e trilho das demais.
7. Classificação Top 5 com dados reais.
8. Pilotos em composição assimétrica, usando fotografia apenas quando existente e fallback tipográfico quando ausente.
9. Comunidade e cultura Ultras com conteúdo real e manifesto, sem depoimentos falsos.
10. Notícias com estado vazio editorial quando não houver conteúdo.
11. Patrocinadores com estado vazio quando não houver registros.
12. CTA final de inscrição sem repetir o hero.

## Páginas internas

### Calendário

Hero compacto, linha editorial da temporada, filtros por formato e status, etapa futura em destaque e composição vertical no mobile.

### Classificação

Top 3 editorial, tabs por categoria, ranking completo, diferença para o líder e cartões hierárquicos no mobile.

### Resultados

Seletor de etapa, pódio somente com três resultados reais, melhor volta e tabela completa. Sem dados, estado editorial com link para calendário.

### Pilotos

Grid assimétrico, busca e filtros. Número, nome, categoria, equipe e pontos. Fallback gráfico quando não houver foto.

### Perfil do piloto

Hero individual, número dominante, categoria, pontos, vitórias, pódios, biografia, evolução e resultados recentes. Ausências de dados claramente sinalizadas.

### Notícias

Destaque principal, trilho editorial e página interna de leitura. Sem notícias oficiais, estado vazio; não publicar matéria fictícia.

### Regulamento

Índice sticky, capítulos com largura de leitura controlada, accordion no mobile e download apenas quando existir arquivo.

### Login

Tela 52/48 em desktop, narrativa visual de um lado e formulário do outro. Mobile prioriza formulário.

### Inscrição

Fluxo em seis etapas: conta, dados pessoais, categoria, experiência, revisão e confirmação. Preservar a integração real já existente e melhorar hierarquia, feedback e progresso.

## Interações

- Transição de entrada curta por rota.
- Reveal por scroll apenas em conteúdo secundário.
- Hover de mídia com escala entre 1.02 e 1.05.
- Cursor contextual apenas em desktop com ponteiro preciso.
- Trilhos horizontais controlados por roda/arraste quando aplicável.
- Menu mobile fechado por botão, rota e tecla Escape.
- Foco visível em todos os controles.

## Dados e Supabase

- Reutilizar as consultas e tipos existentes.
- Não criar tabelas novas sem necessidade comprovada.
- Manter RLS e contratos públicos atuais.
- Usar fallbacks somente quando já previstos no projeto.
- Não gravar dados demonstrativos em produção.

## Performance e acessibilidade

- Imagens abaixo da dobra com carregamento tardio.
- Hero prioritário e dimensionado.
- Sem bibliotecas de animação novas; usar CSS e APIs nativas.
- WCAG AA para texto funcional.
- Um único `h1` por página.
- Sem overflow horizontal obrigatório em 390px.
- `prefers-reduced-motion` remove movimentos não essenciais.

## Validação obrigatória

Antes de integrar na `main`:

- `pnpm verify`
- `pnpm format:check`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm build`
- inspeção visual em 1440px, 1024px, 768px e 390px;
- navegação por todas as rotas públicas;
- verificação de links, ativos, menu, filtros, tabs e inscrição;
- comparação visual contra os princípios Twice/The Grind;
- nenhum deploy de produção antes da aprovação técnica.

## Critérios de conclusão

1. Todas as rotas públicas compartilham a nova direção.
2. Home possui narrativa completa e primeira dobra cinematográfica.
3. Páginas internas não parecem variações da mesma grade de cards.
4. Dados do Supabase continuam funcionando.
5. Nenhum conteúdo oficial é fabricado.
6. Mobile possui composição própria e sem cortes.
7. Build, testes e QA visual passam.
8. Um único merge consolidado é enviado para `main`.
9. O deployment da Vercel fica `READY` e o domínio público serve o novo commit.
