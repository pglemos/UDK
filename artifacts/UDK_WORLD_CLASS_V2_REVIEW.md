# UDK World Class V2 — Relatório de revisão

## Direção aprovada

**70% campeonato internacional + 30% cultura Ultras.**

A experiência combina fotografia cinematográfica, composição editorial, superfícies alternadas, dados esportivos com leitura de transmissão e detalhes de paddock aplicados sem poluição visual.

## Escopo entregue

Protótipo estático multipágina em HTML, CSS e JavaScript, sem framework e sem dependência de servidor:

1. Home
2. Calendário
3. Classificação
4. Resultados
5. Pilotos
6. Perfil individual de piloto
7. Notícias
8. Página interna de notícia
9. Regulamento
10. Login
11. Inscrição em etapas

## Conteúdo e autenticidade

Foram usados dados reais consultados no projeto Supabase UDK:

- cinco etapas da temporada 2026;
- cinco pilotos públicos;
- classificação, pontos, vitórias e pódios existentes na base.

Resultados, notícias e patrocinadores não possuem registros oficiais na base. Por isso, essas áreas exibem estados vazios editoriais, sem fabricar vencedores, tempos, matérias ou parceiros.

A página interna de notícia está identificada como demonstração do protótipo. O regulamento apresenta a estrutura visual dos capítulos, sem oferecer download inexistente.

## Sistema visual

- Logo oficial UDK em suas versões apropriadas.
- Roboto Condensed para títulos e Roboto para interface e texto.
- Fundo grafite e asfalto, seção editorial clara e ciano restrito a ações e informação.
- Dourado, prata e bronze reservados às posições de pódio.
- Cards usados apenas quando necessários; páginas alternam bandas, trilhos, tabelas, listas e composição aberta.
- Hero sem painel SaaS flutuante e sem coleção de métricas inventadas.

## Interações verificadas

- menu mobile em tela cheia, abertura, fechamento e tecla Escape;
- filtros de formato do calendário;
- tabs de classificação geral, Ultras Rápidos e Ultras Insanos;
- pódio e diferenças recalculados por categoria;
- busca de pilotos;
- seleção dinâmica de perfil por parâmetro `slug`;
- navegação de capítulos do regulamento;
- feedback demonstrativo no login;
- wizard de inscrição com avanço, retorno, validação e resumo;
- wizard sem deslocamento automático na primeira renderização;
- `prefers-reduced-motion` respeitado.

## Validação automática

O validador estático aprovou as onze páginas e verifica:

- existência de páginas e ativos;
- referências locais em `href` e `src`;
- `lang="pt-BR"`;
- exatamente um `h1` por página;
- presença de `main`, header, footer e rota ativa;
- atributos `alt` em imagens;
- ausência de `Lorem ipsum`;
- seções obrigatórias da home;
- estados vazios para conteúdo não publicado;
- carregamento de `registration.js` apenas na inscrição.

Resultado:

```text
UDK prototype validation passed: 11 pages
```

## QA de navegador

Método: Playwright Python com Chromium do sistema. Como navegação HTTP e `file://` foram bloqueadas pelo ambiente, CSS, JavaScript e imagens foram incorporados temporariamente no HTML durante a auditoria. Os arquivos entregues continuam separados e funcionam localmente ao abrir `index.html` em um navegador comum.

Viewports verificadas:

- desktop: 1440 × 900;
- tablet: 768 × 900;
- mobile: 390 × 844.

Foram auditadas 33 combinações de página e viewport. Resultado:

- nenhum overflow horizontal de página;
- nenhuma imagem quebrada;
- nenhum campo sem label acessível;
- nenhum botão vazio sem nome acessível;
- um único `h1` em todas as páginas;
- todas as interações principais aprovadas.

Capturas produzidas:

- 11 páginas em desktop;
- 11 páginas em mobile;
- contact sheet desktop;
- contact sheet mobile.

## Pontos visuais comparados

1. **Primeiro viewport:** imagem protagonista, título com no máximo duas linhas dominantes, dois CTAs e próxima etapa integrada.
2. **Ritmo editorial:** alternância entre fundo escuro, seção clara e painéis esportivos, sem parede contínua de cards.
3. **Tipografia:** escala forte no hero e moderada nas páginas internas, com quebra específica para mobile.
4. **Dados esportivos:** tabela completa em desktop e cartões hierárquicos em mobile, sem tabela espremida.
5. **Autenticação e inscrição:** formulário claro, controles legíveis e progressão demonstrativa funcional.
6. **Estados vazios:** resultados, notícias e patrocinadores permanecem honestamente sem conteúdo oficial.
7. **Marca:** arquivos oficiais aplicados sem reconstrução, distorção ou efeitos destrutivos.

## Limitações intencionais

- O protótipo não persiste dados.
- O login não autentica.
- A inscrição não cria cadastro real.
- A imagem principal é um ativo provisório já existente no material do projeto.
- Não foram criadas fotos identificáveis de pilotos.
- O protótipo não foi publicado na Vercel.
- `apps/plataforma` não foi alterado.

## Como revisar

Abra `index.html`. Todas as páginas são acessíveis pelo header, menu mobile e links internos. Avalie direção visual, composição, hierarquia, densidade de informação e comportamento responsivo antes da migração para Next.js.
