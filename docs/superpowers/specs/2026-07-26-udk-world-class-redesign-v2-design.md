# UDK World-Class Redesign V2 — Design Specification

## Status

Aprovado para prototipação estática antes de qualquer alteração no aplicativo publicado.

## Objetivo

Reconstruir a experiência pública do Ultras do Kart com uma direção visual única e coerente: **70% campeonato internacional + 30% cultura Ultras**. O resultado deve parecer um produto esportivo premium, cinematográfico e confiável, sem cair em dashboard corporativo, excesso de glow, colagens improvisadas ou páginas visualmente desconectadas.

## Escopo desta fase

Esta fase entrega um protótipo navegável multipágina em HTML, CSS e JavaScript puro. Ele serve como contrato visual para aprovação antes da migração ao aplicativo Next.js.

Páginas obrigatórias:

- Home
- Calendário
- Classificação
- Resultados
- Pilotos
- Perfil individual de piloto
- Notícias
- Página interna de notícia
- Regulamento
- Login
- Inscrição

Nenhuma alteração será feita na produção da Vercel durante esta fase.

## Princípio criativo

### 70% Campeonato internacional

- Fotografia ampla e cinematográfica.
- Composição editorial com hierarquia clara.
- Tipografia de alto impacto, mas legível.
- Dados esportivos tratados como transmissão profissional.
- Espaço negativo, ritmo e contraste controlados.
- CTAs claros e poucos por bloco.

### 30% Cultura Ultras

- Texturas discretas de pista, box, borracha e metal.
- Numeração de kart, frases curtas e detalhes de paddock.
- Recortes diagonais e microelementos técnicos em pontos específicos.
- Energia noturna e sensação de comunidade.
- Nunca usar a cultura Ultras como desculpa para poluição visual.

## Identidade visual

### Marca

- Usar apenas os arquivos oficiais da UDK.
- Não redesenhar, distorcer, reconstruir ou aplicar efeitos destrutivos na marca.
- Logo branca/negativa em fundos escuros.
- Logo principal apenas onde houver fundo claro suficiente.

### Tipografia

- Headings: Roboto Condensed.
- Texto e interface: Roboto.
- Títulos podem usar itálico e peso alto, sem condensação artificial.
- Evitar títulos gigantes em todas as seções. O hero recebe o maior contraste; páginas internas usam escala editorial mais moderada.

### Cor

- Base: preto grafite, carvão, asfalto e branco quente.
- Ciano é acento de interface, nunca fundo permanente de grandes áreas.
- Branco quente cria respiro em seções editoriais.
- Dourado, prata e bronze aparecem somente em posição/pódio.
- Vermelho fica restrito a alertas, penalidades e sinais esportivos.

### Superfícies

- Evitar uma parede contínua de cards escuros.
- Alternar seções cinematográficas, editoriais claras e painéis de dados.
- Bordas são discretas e funcionais.
- Sombras são profundas apenas quando ajudam a hierarquia.
- Cantos retos ou levemente arredondados; nada de SaaS genérico com radius excessivo.

## Estrutura global

### Header

- Transparente sobre hero e sólido após scroll.
- Logo à esquerda.
- Navegação central no desktop.
- Entrar e inscrição à direita.
- Menu mobile em tela cheia com rotas numeradas.
- Indicador ativo discreto.

### Footer

- Marca, manifesto curto, navegação, Instagram e localização.
- CTA de inscrição com hierarquia clara.
- Sem excesso de links irrelevantes.

### Transições

- Page fade/slide curta entre páginas.
- Scroll reveal apenas em conteúdos de segundo plano.
- Hero entra imediatamente, sem esconder informações essenciais.
- Hover revela movimento, escala ou linha, sem espetáculo gratuito.
- `prefers-reduced-motion` deve remover animações não essenciais.

## Home

### Hero

- Ocupa entre 80 e 92vh no desktop.
- Fotografia real ou ativo autorizado como plano principal.
- Texto principal à esquerda, com máximo de duas linhas dominantes.
- Card de próxima etapa integrado à composição, não flutuando como widget de dashboard.
- Dois CTAs: inscrição e calendário.
- Contagem regressiva e dados mínimos da próxima etapa.

### Faixa de campeonato

- Informações curtas: temporada, local, quantidade de etapas e categorias.
- Movimento horizontal sutil opcional.

### Manifesto editorial

- Seção clara ou quase clara para quebrar a monotonia do fundo escuro.
- Uma frase forte, texto curto e imagem lateral.
- Cultura Ultras aparece aqui de modo autoral.

### Próximas etapas

- Uma etapa principal com fotografia e três etapas em trilho secundário.
- Status claros: concluída, inscrições abertas, próxima, em breve.

### Classificação

- Top 5 em painel editorial.
- Avatar/foto somente quando existir.
- Número, nome, categoria e pontos.
- Nada de estatística inventada.

### Notícias

- Uma matéria principal e duas secundárias.
- Imagens diferentes quando disponíveis.
- Estado vazio elegante quando não houver conteúdo real.

### Patrocinadores e CTA final

- Logos reais quando existirem.
- Texto simples quando não houver ativo.
- CTA final em bloco forte, sem repetir o hero.

## Calendário

- Hero interno compacto.
- Linha da temporada no desktop e cards verticais no mobile.
- Cada etapa exibe número, data, título, traçado, local, status e ação.
- Filtros por formato e status.
- Próxima etapa recebe destaque visual controlado.

## Classificação

- Tabs por categoria.
- Top 3 editorial no desktop.
- Tabela completa abaixo.
- Colunas: posição, piloto, número, categoria, etapas, pontos e diferença.
- Mobile vira lista hierárquica, não tabela espremida.
- Paginação somente quando necessária.

## Resultados

- Seletor de etapa.
- Pódio apenas quando houver dados reais.
- Melhor volta, diferença e pontuação.
- Tabela completa com leitura esportiva.
- Sem fabricar vencedores, tempos ou fotos.

## Pilotos

- Grid editorial com 3 ou 4 colunas no desktop.
- Cards usam fotografia quando disponível e tratamento tipográfico quando não houver.
- Filtros por categoria e busca.
- Informações principais: número, nome, categoria, equipe e pontos.

## Perfil do piloto

- Hero individual com número grande e fotografia.
- Resumo estatístico.
- Evolução por etapa.
- Resultados recentes.
- Biografia curta e equipe.
- Estado sem dados claramente sinalizado.

## Notícias

- Destaque principal editorial.
- Grid de matérias secundárias.
- Página interna com capa, título, data, categoria, corpo e navegação para matérias relacionadas.
- Não criar notícias falsas para preencher layout.

## Regulamento

- Índice lateral sticky no desktop.
- Accordion ou navegação por capítulos no mobile.
- Capítulos com boa tipografia e largura de leitura.
- Botão de baixar PDF somente quando o arquivo existir.

## Login

- Tela dividida no desktop.
- Imagem/manifesto de um lado e formulário do outro.
- Mobile prioriza formulário.
- Mensagens de erro claras.
- Sem promessas de recursos inexistentes.

## Inscrição

- Fluxo visual em etapas.
- Nesta fase estática, simular progressão sem persistir dados reais.
- Passos: conta, dados pessoais, categoria, experiência, revisão e confirmação.
- Barra de progresso, validação básica e resumo final.

## Responsividade

Breakpoints de referência:

- Desktop amplo: 1440px ou mais.
- Desktop: 1024px a 1439px.
- Tablet: 768px a 1023px.
- Mobile: 375px a 767px.

Requisitos:

- Nenhuma tabela deve produzir scroll horizontal obrigatório no mobile.
- Nenhum título pode invadir conteúdo adjacente.
- CTAs principais devem permanecer visíveis e legíveis.
- Menu, filtros, tabs e formulários devem funcionar por toque.

## Conteúdo e autenticidade

- Usar dados reais existentes no projeto.
- Usar estados vazios premium quando resultados, notícias, regulamentos ou patrocinadores não existirem.
- Não inventar fotos de pilotos identificáveis.
- Não importar conteúdo do Instagram sem autorização explícita e download permitido.
- Ativos já fornecidos podem ser usados provisoriamente no protótipo.

## Acessibilidade

- Contraste mínimo WCAG AA para texto funcional.
- Navegação por teclado.
- Foco visível.
- `aria-current` nas rotas.
- Labels reais em formulários.
- Texto alternativo informativo em imagens relevantes.
- `prefers-reduced-motion` respeitado.

## Performance

- Sem framework no protótipo.
- JavaScript progressivo e pequeno.
- Imagens com `loading="lazy"`, exceto hero.
- CSS dividido por responsabilidade.
- Nenhum efeito deve bloquear interação ou causar layout shift significativo.

## Estrutura técnica do protótipo

```text
prototypes/udk-world-class-v2/
├── index.html
├── calendario.html
├── classificacao.html
├── resultados.html
├── pilotos.html
├── piloto.html
├── noticias.html
├── noticia.html
├── regulamento.html
├── login.html
├── inscricao.html
├── assets/
│   ├── css/
│   │   ├── tokens.css
│   │   ├── global.css
│   │   ├── components.css
│   │   ├── pages.css
│   │   └── responsive.css
│   ├── js/
│   │   ├── data.js
│   │   ├── shell.js
│   │   ├── interactions.js
│   │   └── registration.js
│   └── media/
└── scripts/
    └── validate-prototype.mjs
```

## Critérios de aprovação

O protótipo só é considerado aprovado quando:

1. Todas as onze páginas estão navegáveis.
2. Desktop e mobile possuem composição própria.
3. A home tem impacto cinematográfico sem esconder conteúdo.
4. Dados esportivos são legíveis e não parecem dashboard corporativo.
5. Não há conteúdo esportivo inventado.
6. A marca oficial é aplicada corretamente.
7. Nenhum link ou ativo essencial está quebrado.
8. O protótipo funciona abrindo `index.html` localmente.
9. A validação automática de rotas e referências passa.
10. Nenhuma alteração foi publicada na Vercel antes da aprovação do usuário.
