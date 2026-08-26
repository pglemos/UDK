---
target: "https://www.ultrasdokart.com.br/"
total_score: 26
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 4
timestamp: 2026-08-19T07-47-48Z
slug: www-ultrasdokart-com-br
---
Method: dual-agent (A: Wegener · B: Locke)

# Crítica Impeccable v4 — Ultras do Kart

Escopo: home pública, `/classificacao`, `/resultados`, os filtros de `insanos` e `rapidos`, `/pilotos`, o perfil do Matteo com volta a volta, 404, offline e os 36 módulos principais do painel. A inspeção foi feita em produção, em desktop (1710×802) e mobile (390×844).

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|---|---:|---|
| 1 | Visibility of System Status | 3/4 | Statuses, filtros e estados vazios funcionam, mas a etapa pode aparecer como próxima mesmo já homologada. |
| 2 | Match System / Real World | 2/4 | Inglês em datas e categorias quebra o compromisso com pt-BR e o vocabulário do campeonato. |
| 3 | User Control and Freedom | 3/4 | Busca, filtros, paginação e navegação oferecem saída clara; a ação de etapa encerrada ainda não é coerente. |
| 4 | Consistency and Standards | 2/4 | Contagens de pilotos divergem e há mistura de idioma, rótulos e hierarquia entre páginas operacionais. |
| 5 | Error Prevention | 3/4 | Formulários e confirmações têm boas salvaguardas; a fonte de verdade do estado/contagem precisa ser única. |
| 6 | Recognition Rather Than Recall | 3/4 | Navegação, filtros e estados são reconhecíveis, mas os dados principais ficam depois de blocos editoriais extensos. |
| 7 | Flexibility and Efficiency of Use | 2/4 | Há filtros e paginação, porém o caminho até a tabela ou lista exige rolagem desnecessária. |
| 8 | Aesthetic and Minimalist Design | 2/4 | A identidade é forte, mas o hero editorial compete com tarefas de consulta. |
| 9 | Help Users Recognize, Diagnose, and Recover from Errors | 3/4 | Estados vazios e páginas de erro são utilizáveis; mensagens e recuperação devem seguir o mesmo idioma. |
| 10 | Help and Documentation | 3/4 | Regulamento e orientações existem, mas o contexto de cada decisão ainda poderia ser mais imediato. |
| **Total** |  | **26/40** | **Aceitável: melhorias significativas necessárias antes de considerar a experiência madura.** |

## Design Specificity Verdict

### Avaliação de design

O produto tem autoria real: identidade de kart, contraste escuro, acentos ciano/rosa, rankings, resultados oficiais, perfis de pilotos e volta a volta formam um vocabulário próprio de competição. Não parece um dashboard genérico.

O problema é que as páginas operacionais ainda se comportam como páginas de campanha. Em `/classificacao`, `/resultados`, `/pilotos` e calendário, o espetáculo visual vem antes da resposta que o usuário procura. A personalidade é forte, mas a interface perde precisão justamente quando o usuário precisa conferir posição, categoria, etapa ou piloto.

### Varredura determinística

A avaliação B registrou três alertas `overused-font` em `apps/plataforma/public/offline.html:9`, `:31` e `:48`. Eles parecem falso positivo de regra: o detector marcou Arial, enquanto o problema visual mais importante observado nas páginas é a consistência do idioma e da hierarquia, não a fonte do offline.

O log de `npx impeccable detect` fornecido nesta conversa também registrou oito anti-patterns: stripe lateral em `apps/plataforma/app/brand-racing-texture.css:129`, transições de `min-height` e `padding` em `apps/plataforma/app/cinema-home.css:626` e `:719`, borda lateral em `apps/plataforma/app/cinema-pages.css:1234`, easing elástico em `apps/plataforma/app/udk-production-fixes.css:77` e três alertas de composição/tipografia em `apps/plataforma/public/offline.html`. São backlog de refinamento; não devem superar os problemas de dados, estado e idioma.

Não houve overlay visual aplicado: a inspeção foi feita na produção em modo de leitura, sem injeção mutável. Não há overlay confiável disponível na aba do navegador.

## Overall Impression

A base é confiável e visualmente reconhecível, mas as telas de consulta ainda pedem que o piloto atravesse uma apresentação antes de operar. A maior oportunidade é transformar a marca de corrida em uma interface de direção de prova: dados e estado primeiro, impacto visual como suporte.

## Cognitive Load

Carga moderada-alta nas telas de operação, com quatro falhas principais:

- Foco único: hero, métricas, narrativa e controles competem com a tabela/lista.
- Agrupamento: filtros e dados ficam separados por conteúdo editorial.
- Hierarquia visual: o elemento mais chamativo nem sempre é o resultado solicitado.
- Divulgação progressiva: a página entrega muita atmosfera antes de revelar a informação operacional.

As escolhas isoladas de filtro, busca e paginação são manejáveis; o excesso está na sequência e na quantidade de conteúdo simultâneo, não na falta de recursos.

## Emotional Journey

O primeiro contato comunica energia e pertencimento. O momento de maior confiança são os resultados oficiais, os PDFs e o detalhamento de volta a volta. A principal queda emocional ocorre quando a home anuncia uma etapa como “Próxima etapa — 18 AUG”, embora a etapa apareça como “Homologado” em 19/08 e ainda ofereça “Entrar no grid”. Para quem está tentando se inscrever ou conferir o campeonato, isso parece risco operacional, não apenas um detalhe visual.

## What's Working

- A identidade de competição é específica e consistente o bastante para diferenciar UDK de um painel administrativo comum.
- As rotas públicas principais têm funcionamento sólido: busca, filtros, paginação, estados vazios, 404, offline, PDFs oficiais, imagens carregando e nenhum erro ou warning no console durante a inspeção.
- O cadastro de piloto está alinhado ao negócio: não pede número de kart/piloto, contempla foto, peso, altura, sexo, UF sem bandeiras, saúde, emergência e confirmações obrigatórias.

## Priority Issues

### [P1] Idioma misturado nas superfícies públicas e operacionais

**O que:** aparecem `ENDURANCE`, `Endurance`, `ENDURENCE` e datas como `18 AUG`, `08 SEP`, `13 OCT`, `10 NOV` e `12 DEC`.

**Por que importa:** o sistema foi definido como pt-BR. A mistura reduz confiança, cria ruído para leitura rápida e pode fazer o campeonato parecer parcialmente inacabado.

**Correção:** centralizar a formatação de datas e categorias em pt-BR, revisar o catálogo de rótulos e adicionar teste que falhe quando tokens ingleses escaparem para as rotas renderizadas. Corrigir também `ENDURENCE` para o termo oficial adotado.

**Suggested command:** `$impeccable clarify` e `$impeccable harden`

### [P1] Estado da etapa contraditório

**O que:** em 19/08 a home mostra a etapa de 18/08 como “Próxima etapa” e ainda oferece “Entrar no grid”, enquanto a própria etapa está “Homologado”.

**Por que importa:** CTA de inscrição para uma etapa encerrada pode gerar cadastro inválido, suporte e perda de confiança na classificação.

**Correção:** derivar título, status, data e CTA da mesma fonte de verdade e do fuso do campeonato. Depois de homologada, mostrar “Etapa encerrada”, “Ver resultados” ou “Ver classificação”, nunca “Entrar no grid”.

**Suggested command:** `$impeccable harden`

### [P1] Conteúdo editorial esconde o trabalho principal

**O que:** calendário, classificação, resultados e pilotos exibem hero/editorial antes de filtros e dados.

**Por que importa:** piloto, organização e espectador entram para localizar um nome, posição, volta ou documento. A rolagem extra aumenta tempo de consulta e piora o uso no celular.

**Correção:** colocar título curto, contexto da etapa e filtros acima da primeira tabela/lista; reduzir o hero nessas páginas, transformar narrativa em bloco secundário e manter controles compactos/sticky quando fizer sentido. Preservar a expressão visual na home e nos detalhes.

**Suggested command:** `$impeccable distill` e `$impeccable layout`

### [P1] Contagem de pilotos inconsistente

**O que:** dashboard/sidebar exibem 48 pilotos, enquanto `/painel/pilotos`, a página pública e a consulta sem excluídos exibem 45.

**Por que importa:** contagem é um sinal de integridade. A divergência faz o organizador questionar se filtros, exclusões ou aprovações estão sendo aplicados corretamente.

**Correção:** compartilhar a mesma consulta e regra (`deleted_at`/status) entre dashboard, sidebar, painel e página pública; exibir a mesma contagem e, se necessário, indicar “aprovados”, “ativos” ou “total” explicitamente.

**Suggested command:** `$impeccable harden`

### [P2] Acessibilidade semântica e foco incompletos

**O que:** “Pular para o conteúdo” chega ao `main`, mas não move o foco para ele; alguns H1 têm texto acessível colado, como `A pistanão espera.` e `Sua temporadacomeça aqui.`

**Por que importa:** teclado e leitor de tela perdem contexto e podem anunciar títulos de modo pouco natural. Isso afeta especialmente o acesso rápido às tabelas e formulários.

**Correção:** tornar o destino do skip-link focável (`tabIndex={-1}`) e mover foco após a navegação; corrigir a separação semântica dos spans/textos; repetir a verificação de headings, foco visível, labels e anúncios de estado.

**Suggested command:** `$impeccable audit`

## Persona Red Flags

### Alex — operador experiente

- Ao abrir classificação/resultados, precisa atravessar hero e narrativa antes do dado que veio conferir.
- A divergência 48/45 impede confiar imediatamente no painel e exige uma investigação manual.
- Não foram observados atalhos de teclado ou ações em lote para acelerar rotinas repetitivas do painel.

### Sam — usuário dependente de acessibilidade

- O skip-link não transfere foco para o `main`, então a promessa de navegação rápida não se completa.
- H1 com texto colado pode ser anunciado de forma confusa pelo leitor de tela.
- Status e diferenças entre páginas precisam continuar disponíveis em texto, não apenas pela cor ou pelo tratamento visual.

### Casey — usuário móvel e interrompido

- Não há overflow horizontal relevante, mas as telas longas ampliam o número de gestos até chegar aos filtros e à lista.
- O CTA principal pode ficar fora da primeira área útil quando o hero aparece antes da tarefa.
- Datas em inglês e estado contraditório exigem releitura justamente no cenário de atenção curta.

## Minor Observations

- `lang="pt-BR"` está presente e é uma boa base para corrigir o restante da localização.
- Não foram observadas imagens quebradas, erros/warnings de console ou overflow horizontal relevante nas dimensões auditadas.
- O offline usa um chip de contexto antes do título e combina borda fina com sombra ampla; é uma oportunidade de refinamento, não uma urgência.
- As transições de `min-height`/`padding`, a faixa lateral espessa e o easing elástico podem ser suavizados depois das correções de produto.
- O alerta de fonte em `offline.html` deve ser confirmado contra a direção visual antes de trocar tipografia; o detector provavelmente está marcando um falso positivo.

## Questions to Consider

- A home deve privilegiar a próxima etapa futura ou o estado da etapa atual? O comportamento precisa ser uma única decisão de produto.
- Nas páginas operacionais, o que merece o primeiro viewport: a identidade editorial ou a tabela/resultado que o piloto veio consultar?
- “48 pilotos” significa total cadastrado, aprovados ou ativos? O rótulo e a consulta devem dizer a mesma coisa.
