# Integração de mídia oficial UDK

Data: 2026-08-06
Branch: `feat/official-media-integration-20260806`

## Contexto

O site público já possui uma estrutura visual consolidada, mas ainda utiliza fotografias externas genéricas em `apps/plataforma/lib/visual-assets.ts`. O acervo oficial compartilhado no Google Drive contém fotos profissionais, arquivos RAW, capas prontas e vídeos reais do campeonato. A integração deve substituir os conteúdos genéricos sem degradar legibilidade, desempenho, responsividade ou estabilidade das páginas.

## Objetivo

Usar mídia real do UDK nas principais páginas públicas, com seleção editorial por contexto, arquivos otimizados hospedados no próprio projeto, fallbacks determinísticos e auditoria visual automatizada em desktop e mobile.

## Escopo

A implementação cobre:

- Home;
- Calendário;
- Classificação;
- Resultados;
- Pilotos;
- Notícias;
- Regulamento;
- Inscrição;
- Login;
- componentes compartilhados de hero, cards, pódio e fallbacks;
- pipeline de imagens e capas de vídeo;
- testes unitários e auditoria visual Playwright.

## Fora do escopo

- edição destrutiva dos arquivos originais do Google Drive;
- streaming direto do Google Drive no site;
- criação de uma biblioteca administrativa de mídia;
- reconhecimento automático de pilotos;
- alteração de banco de dados, Supabase, autenticação ou contratos de API;
- publicação de vídeos longos sem compressão.

## Direção escolhida

### Estratégia recomendada

Os arquivos selecionados serão baixados, recortados e convertidos para formatos web, depois versionados em `apps/plataforma/public/media/official/`. O código consumirá apenas caminhos locais. Vídeos serão usados de forma restrita: um clipe curto e silencioso no hero da Home, com poster estático, fallback e substituição por imagem em telas pequenas ou quando `prefers-reduced-motion` estiver ativo.

Essa abordagem foi escolhida porque:

- elimina dependência do Google Drive e de serviços externos durante a navegação;
- permite cache imutável no deploy da Vercel;
- mantém as capturas visuais determinísticas;
- reduz risco de links expirados, limites de tráfego ou bloqueios CORS;
- preserva controle sobre enquadramento, peso e qualidade.

### Alternativas rejeitadas

1. **Referenciar arquivos diretamente no Drive**: simples no início, porém lento, instável, difícil de auditar e inadequado para produção.
2. **Hospedar tudo em Supabase Storage**: válido para uma biblioteca dinâmica futura, mas adiciona configuração, custos e dependência desnecessária para um conjunto editorial estático.
3. **Usar somente frames de vídeo**: reduziria variedade e desperdiçaria fotografias profissionais já disponíveis.

## Inventário inicial confirmado

O acervo contém, entre outros:

- `ULT-DPTO-Cover.jpg` e `ULT-DPTO.mp4`;
- `ULT-FLAVIO-Cover.jpg` e `ULT-FLAVIO.mp4`;
- `DSC00414-1.jpg`;
- vídeos curtos como `215A.mp4`, `201A.mp4`, `209A.mp4`, `233A.mp4`, `255A.mp4`, `263A.mp4`, `275A.mp4` e `280A.mp4`;
- grande volume de vídeos `.MOV`;
- fotografias RAW `.ARW`;
- arquivo de composição `ULTRAS.psd`.

Arquivos RAW e PSD só serão usados quando houver ganho visual claro. A primeira entrega prioriza JPEGs existentes e frames extraídos de vídeos, evitando ampliar o processamento sem necessidade.

## Mapa editorial por página

### Home

- hero com clipe curto horizontal da pista ou largada;
- poster estático otimizado para carregamento inicial;
- imagem mobile dedicada;
- se o vídeo não carregar, o poster permanece visível;
- o vídeo não terá áudio, controles ou reprodução quando o usuário pedir redução de movimento.

### Calendário

- hero com pista ou grid;
- cards de etapas usando fotografias diferentes, sem repetição imediata;
- enquadramento priorizando karts e contexto de evento, não retratos individuais.

### Classificação

- hero com disputa em pista;
- pódio com retratos reais quando disponíveis;
- fallback com fotos reais de pilotos ou karts, sem blocos abstratos;
- textos e posição continuam legíveis sobre a imagem.

### Resultados

- hero com cronometragem, painel, bandeirada ou pós-corrida;
- `DSC00414-1.jpg` é candidata principal por mostrar contexto de resultado;
- cards mantêm dados como informação dominante.

### Pilotos

- capas `ULT-DPTO-Cover.jpg` e `ULT-FLAVIO-Cover.jpg` serão candidatas para retratos reais;
- frames de vídeos individuais podem completar pilotos sem foto;
- nenhum nome será inferido por reconhecimento visual; o vínculo será feito apenas por nome de arquivo ou confirmação explícita disponível no acervo.

### Notícias

- capas reais de entrevistas, bastidores, etapas e premiação;
- cada item usa uma imagem coerente com seu tipo editorial;
- notícias sem mídia recebem fallback real rotativo e determinístico.

### Regulamento

- hero com briefing, preparação ou grid;
- conteúdo permanece sóbrio, com contraste maior e menos movimento visual.

### Inscrição

- hero com preparação de piloto, entrega de equipamento ou convivência no paddock;
- `215A.mp4` e frames associados são candidatos para essa função;
- chamada para ação continua visualmente dominante.

### Login

- imagem estática escura e limpa;
- sem vídeo;
- fundo não deve competir com formulário, logo ou campos.

## Estrutura de arquivos

```text
apps/plataforma/public/media/official/
  home/
    hero-desktop.webp
    hero-mobile.webp
    hero-poster.webp
    hero-loop.mp4
  heroes/
    calendario.webp
    classificacao.webp
    resultados.webp
    pilotos.webp
    noticias.webp
    regulamento.webp
    inscricao.webp
    login.webp
  drivers/
    dpto.webp
    flavio.webp
    fallback-01.webp
    fallback-02.webp
    fallback-03.webp
  stages/
    stage-01.webp
    stage-02.webp
    stage-03.webp
    stage-04.webp
    stage-05.webp
  news/
    news-01.webp
    news-02.webp
    news-03.webp
  source-manifest.json
```

`source-manifest.json` registrará, para cada derivado, o arquivo de origem, finalidade, dimensões e transformação aplicada. Isso preserva rastreabilidade sem expor links do Drive no código de produção.

## Regras de processamento

### Imagens

- formato principal: WebP;
- qualidade alvo: 80 a 88, ajustada visualmente;
- hero desktop: largura máxima de 1920 px;
- hero mobile: largura máxima de 900 px, recorte vertical dedicado;
- cards: largura máxima entre 800 e 1200 px;
- manter proporção e evitar upscale;
- remover metadados desnecessários;
- aplicar correção leve de exposição, contraste e nitidez apenas quando necessário;
- evitar filtros que alterem cores oficiais de uniforme, kart ou patrocinadores.

### Vídeo

- apenas um loop principal na Home nesta entrega;
- duração alvo entre 6 e 12 segundos;
- sem áudio;
- H.264 em MP4 para ampla compatibilidade;
- resolução máxima 1920×1080;
- taxa de bits ajustada para manter o arquivo abaixo de aproximadamente 8 MB quando a qualidade permitir;
- `playsInline`, `muted`, `loop` e poster obrigatório;
- não usar autoplay em mobile quando isso comprometer carregamento ou economia de dados.

## Arquitetura de código

### Catálogo de mídia

`apps/plataforma/lib/visual-assets.ts` continuará sendo a única fonte de verdade para mídia editorial. As URLs externas serão substituídas por caminhos locais. O tipo `PremiumVisual` será ampliado apenas se necessário para suportar poster, origem mobile ou metadados de vídeo.

### Hero compartilhado

`PageHero` continuará consumindo `pageHeroVisual(index)`. Não haverá lógica específica espalhada por cada rota. O mapa de índice para página continuará determinístico.

### Home hero

O hero da Home poderá usar um componente isolado, responsável por:

- renderizar poster imediatamente;
- carregar vídeo somente no cliente quando permitido;
- respeitar `prefers-reduced-motion`;
- usar imagem estática em mobile quando configurado;
- preservar a mesma camada de contraste e conteúdo atual.

### Fallbacks

`driverVisual`, `stageVisual` e `newsVisual` continuarão determinísticos. A diferença é que passarão a apontar para arquivos oficiais locais. Nenhum fallback dependerá de rede externa.

## Acessibilidade

- imagens decorativas terão `alt=""`;
- imagens informativas terão texto alternativo específico;
- vídeo decorativo não terá áudio nem informação exclusiva;
- conteúdo textual permanecerá completo quando vídeo e imagens falharem;
- redução de movimento será respeitada;
- contraste mínimo será verificado em desktop e mobile;
- foco, navegação e leitura por teclado não serão alterados.

## Desempenho

- imagens de hero prioritárias somente quando realmente acima da dobra;
- cards abaixo da dobra permanecem com lazy loading;
- uso de `sizes` correto por componente;
- nenhuma imagem externa no catálogo oficial;
- vídeo não deve bloquear LCP;
- poster deve ser menor que o vídeo e renderizado primeiro;
- auditoria deve rejeitar imagens com dimensão natural ou renderizada inválida.

## Tratamento de erros

- poster continua visível se o vídeo falhar;
- caminhos ausentes falham nos testes e no build de auditoria;
- auditoria Playwright registra `pageerror`, `console.error`, falhas de requisição e dimensões inválidas;
- cada rota continua sendo capturada mesmo quando outra falha;
- `diagnostics.json` é gerado em qualquer resultado.

## Testes

### Testes unitários

- catálogo oficial não contém URLs `images.unsplash.com`;
- todos os caminhos locais previstos existem;
- cada índice de página aponta para hero distinto quando o design exigir;
- fallbacks de piloto, etapa e notícia são determinísticos;
- componente de vídeo possui poster e fallback;
- redução de movimento impede reprodução automática;
- nenhum componente reintroduz caminhos legados.

### Auditoria visual

- 9 rotas em desktop;
- 9 rotas em mobile;
- rolagem completa para carregar mídia abaixo da dobra;
- validação de `naturalWidth`, `naturalHeight`, largura e altura renderizadas;
- captura de erros de console, runtime e requisição;
- inspeção manual das telas críticas;
- comparação de legibilidade, enquadramento e repetição de imagens.

## Critérios de aceite

A entrega será considerada concluída quando:

1. todas as páginas do escopo usarem mídia oficial local ou fallback oficial local;
2. nenhuma URL do Unsplash permanecer no catálogo de mídia pública;
3. a Home tiver poster estático e vídeo curto com fallback correto;
4. desktop e mobile tiverem enquadramentos adequados;
5. não houver textos cortados, sobreposição, imagens zeradas ou cards pretos;
6. lint, TypeScript, testes, build e quality gates passarem;
7. as 18 capturas visuais forem geradas com diagnóstico sem falhas;
8. a galeria e o ZIP da auditoria final forem entregues para inspeção;
9. nenhuma alteração de Supabase for necessária.

## Sequência de implementação

1. catalogar e selecionar o conjunto mínimo de arquivos do Drive;
2. extrair frames candidatos e criar contato visual para seleção técnica;
3. gerar derivados WebP e o loop MP4;
4. registrar `source-manifest.json`;
5. adicionar testes em estado RED;
6. atualizar o catálogo e componentes compartilhados;
7. executar testes, build e auditoria visual;
8. revisar manualmente as 18 telas;
9. corrigir enquadramentos e compressão;
10. abrir PR, revisar, integrar ao `main` e gerar a auditoria final para o usuário.
