# AUDITORIA COMPLETA — UDK (Ultras do Kart)

> **Data:** 06/08/2026
> **Auditor:** Founder/Designer Obcecado por Conversao
> **Versao analisada:** main@HEAD (dev server local, 1440x900 desktop + 390x844 mobile)

---

## AVISO DE SEGURANCA

**Tokens expostos no chat.** Os tokens Vercel, Supabase e GitHub foram colados diretamente na mensagem. Recomendacao imediata:

1. **Revogar todos os tres tokens agora** — Vercel Dashboard > Settings > Tokens > Revoke; Supabase Dashboard > Account > Access Tokens > Revoke; GitHub > Settings > Developer Settings > Personal Access Tokens > Delete.
2. **Rotacionar SUPABASE_SERVICE_ROLE** se ele estiver no mesmo .env.
3. **Nunca mais colar tokens em chats, commits ou mensagens.**

---

## CRITICO

Problemas que **impedem a inscricao do piloto**, quebram no mobile ou matam a conversao primaria.

---

### C1. Botao "ENTRAR NO GRID" sumiu no mobile

- **Componente:** Header / barra de navegacao
- **Problema:** No celular (390x844), o botao "ENTRAR NO GRID" desaparece completamente. O menu hamburger so mostra "ENTRAR". O piloto que viu a pista e quer se inscrever **nao tem caminho direto pra inscricao no celular**.
- **Solucao:** Botao CTA fixo na parte de baixo da tela em telas <=1180px, ou colocar "ENTRAR NO GRID" como primeiro item do menu mobile com estilo primario (`background: var(--cinema-cyan); color: var(--cinema-black)`). Touch target minimo: 56px de altura.

---

### C2. Login — formulario ficou embaixo da dobra no mobile

- **Componente:** /login
- **Problema:** No celular (390px), a imagem de karts ocupa uns 60% da tela. O formulario de email/senha so aparece quando rola pra baixo. Piloto com pressa no paddock, de luva, no calor — **nao vai rolar a tela**.
- **Solucao:** No celular, inverte a ordem: formulario primeiro (em cima), imagem embaixo. Usa `order: -1` no painel ou `flex-direction: column-reverse` no grid mobile.

---

### C3. Menu mobile — texto "Menu" aparecendo no hamburger

- **Componente:** Header mobile
- **Problema:** O hamburger mostra a palavra "Menu" do lado do icone de tres linhas. Em design mobile premium, o hamburger so pode ser o icone (tres linhas ou X).
- **Solucao:** Tira o texto "Menu" em <=1180px. Deixa so o icone SVG de 24x24px com `aria-label="Abrir menu"`. Touch target: 44x44px minimo.

---

### C4. Inscricao — sidebar desaparece no mobile

- **Componente:** Pagina /inscricao
- **Problema:** A barra lateral com "Campeonato: UDK / Categoria / Local / Progresso" some no celular. O piloto perde a referencia de onde esta no fluxo de 6 etapas.
- **Solucao:** No celular, transforma a sidebar em um **stepper horizontal compacto** (etapa 01/06 com bolinhas ou barra de progresso). Fixo no topo, altura maxima 48px.

---

### C5. Tabela de classificacao — nao se adapta ao mobile

- **Componente:** Tabela /classificacao
- **Problema:** A tabela do desktop tem 7 colunas (POS, PILOTO, CATEGORIA, VITORIAS, PODIOS, DIF, PONTOS). No celular, as colunas vao ficar ilegiveis.
- **Solucao:** Transforma em **cards empilhados** em <=768px: `[POS #NOME] [Categoria] [Pontos em destaque]`. Cada card com padding 16px e separador de 1px.

---

### C6. Busca de piloto — botao "BUSCAR" separado do campo

- **Componente:** Campo de busca na classificacao
- **Problema:** O campo de busca e o botao "BUSCAR" estao separados. No celular, isso e desperdicio de espaco e aumenta a friccao. O piloto precisa de busca instantanea, nao de botao extra.
- **Solucao:** Remove o botao "BUSCAR". Usa `type="search"` com debounce de 300ms. Busca em tempo real enquanto digita. No celular, o campo ocupa 100% da largura.

---

## ALTO IMPACTO

Atritos visuais, ruido nos dados, falta de hierarquia ou decisoes de UI que geram hesitacao.

---

### A1. Dois sistemas de design ao mesmo tempo — globals.css vs cinema-core.css

- **Componente:** Arquitetura CSS
- **Problema:** Existem dois sistemas de design completos: `globals.css` (tema claro, paleta `--graphite`/`--cyan`/`--canvas`) e `cinema-core.css` (tema escuro, paleta `--cinema-black`/`--cinema-cyan`/`--cinema-paper`). O `layout.tsx` importa `globals.css` + `race.css` (que internamente importa cinema-core). Resultado: **peso CSS duplicado, conflitos possiveis e confusao na manutencao**.
- **Solucao:** Consolida em um unico design system. Usa o cinema (escuro) como base pra todas as paginas publicas. Migra as variaveis do globals.css pro cinema-core. Elimina o globals.css depois da migracao completa.

---

### A2. Mais de 40 arquivos CSS — sobrecarga de manutencao

- **Componente:** Estrutura de estilos
- **Problema:** Existem ~40 arquivos CSS no app/: `race-a.css`, `race-b.css`, `race-c.css`, `race-core.css`, `race-fidelity-*.css`, `cinema-*.css`, `tg-core-*.css`, `tg-pages-*.css`, `visual-*.css`, `audit-*.css`, `final-audit-overrides.css`. Cada "auditoria" gera um novo arquivo CSS com overrides. Isso e **divida tecnica visual** que indica refactoracao evasiva.
- **Solucao:** Refatora em no maximo 5 arquivos: `tokens.css` (variaveis), `base.css` (reset/tipografia), `components.css` (botoes, cards, modais), `layouts.css` (grids, shells), `responsive.css` (media queries).

---

### A3. Fontes carregadas 3 vezes

- **Componente:** Performance / tipografia
- **Problema:** O `globals.css` importa Google Fonts (Barlow Condensed + Inter), o `cinema-core.css` importa de novo (Barlow Condensed + Inter), e o `layout.tsx` carrega via `next/font` (Syne + Manrope). Sao **6 fontes** carregadas, 2 delas duplicadas.
- **Solucao:** Consolida pra 2-3 fontes no maximo via `next/font` (elimina requests externos): Syne pra display, Manrope pra corpo. Se Barlow Condensed for essencial pra identidade, mantem so no `layout.tsx` com `next/font/google`. Remove os imports @import do globals.css e cinema-core.css.

---

### A4. Hero "A PISTA NAO ESPERA" — contraste fraco no mobile

- **Componente:** Hero home mobile
- **Problema:** O texto branco da headline se sobrepoe a uma foto de karts com areas claras (asfalto iluminado). Em luz solar direta (paddock ao ar livre), a legibilidade cai muito.
- **Solucao:** Adiciona um gradiente overlay mais forte no mobile: `background: linear-gradient(180deg, rgba(5,6,7,0.7) 0%, rgba(5,6,7,0.85) 100%)`. Garante contraste minimo WCAG AA (4.5:1) pra texto normal, 3:1 pra texto grande.

---

### A5. Contagem regressiva — sem sincronia com o servidor

- **Componente:** Countdown "ATE A LARGADA" no hero
- **Problema:** O countdown e calculado pelo navegador (JavaScript). Se o piloto abre o site e deixa aberto, os numeros podem ficar desatualizados. Nao tem indicador de "atualizado ha X segundos".
- **Solucao:** Sincroniza com `Date.now()` do servidor via API. Adiciona um indicador discreto "ao vivo" ou "sincronizado" do lado do countdown. Usa `setInterval` com 1s de precisao + calibra a cada 60s.

---

### A6. Classificacao — "Lider" sem destaque visual

- **Componente:** Tabela de classificacao, coluna DIF
- **Problema:** O texto "Lider" pro 1o lugar usa a mesma fonte/cor dos valores "-8", "-14". Nao tem coroa, ouro ou destaque que indique o lider na hora.
- **Solucao:** Pro 1o lugar: borda esquerda dourada (`border-left: 3px solid #ffc64b`), texto "Lider" em `color: var(--cinema-gold)`, background sutil `rgba(255,198,75,0.08)`. Pro 2o e 3o lugar: prata e bronze respectivamente.

---

### A7. Cards de pilotos — sem efeito hover

- **Componente:** Cards de classificacao/pilotos
- **Problema:** Os cards de classificacao tem `cursor: pointer` mas nenhum `:hover` visual. O piloto nao sabe que e clicavel.
- **Solucao:** Adiciona `transition: transform 200ms ease, box-shadow 200ms ease` + hover: `transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.12)`.

---

### A8. Formulario de login — sem feedback de carregamento

- **Componente:** Formulario /login
- **Problema:** Ao clicar "ENTRAR NA PLATAFORMA", nao tem spinner nem desabilitacao do botao. O piloto pode clicar varias vezes, gerando varias requisicoes.
- **Solucao:** Adiciona estado `loading`: desabilita botao + troca texto por spinner SVG + opacity 0.7. Usa atributo `disabled` + `aria-busy="true"`.

---

### A9. Badge "INSCRICOES ABERTAS" — sem indicador de status

- **Componente:** Cards de etapas
- **Problema:** O badge "INSCRICOES ABERTAS" e so texto cyan. Nao tem icone de status (check, circle, pulse) que indique estado ativo vs fechado.
- **Solucao:** Adiciona bolinha pulsante (`animation: pulse 2s infinite`) do lado do texto. Pra inscricoes fechadas: bolinha cinza + texto "INSCRICOES ENCERRADAS".

---

### A10. Imagens de pilotos — sem lazy loading consistente

- **Componente:** Cards de pilotos na home
- **Problema:** Todas as imagens de karts/pilotos carregam de uma vez. Sao ~8 imagens Unsplash de alta resolucao. No celular 3G, isso piora o LCP.
- **Solucao:** Adiciona `loading="lazy"` em todas as imagens abaixo do fold. Usa `next/image` com `priority` so na imagem do hero. Configura `sizes` pra evitar download de imagens 2400px em telas 390px.

---

### A11. Navegacao — sem indicador de pagina ativa no mobile

- **Componente:** Header navigation
- **Problema:** O indicador de pagina ativa e uma borda cyan embaixo. Mas no mobile (hamburger), nao tem indicador visual de qual pagina o piloto esta.
- **Solucao:** No menu mobile, adiciona `background: rgba(0,217,255,0.1)` + `border-left: 3px solid var(--cinema-cyan)` no item ativo.

---

### A12. Footer — CTA "COMECE SUA INSCRICAO" sem destaque

- **Componente:** Footer
- **Problema:** O CTA "COMECE SUA INSCRICAO" no footer e um link simples. Nao tem botao visual com destaque. Em comparacao com o header (que tem o botao cyan), o footer parece desimportante.
- **Solucao:** Usa a classe `button-primary` no link do footer. Adiciona icone de seta pra indicar acao.

---

### A13. Patrocinadores — sem efeito hover

- **Componente:** "MARCAS QUE ACELERAM COM O UDK"
- **Problema:** Os logos de patrocinadores tem `filter: grayscale(1) brightness(1.7) opacity(0.72)` no estado normal e `filter: none; opacity: 1` no hover. Mas nao tem cursor pointer nem transicao suave.
- **Solucao:** Adiciona `cursor: pointer` + `transition: filter 300ms ease, opacity 300ms ease`. Verifica se os links apontam pra URLs validas.

---

### A14. Numeros reais — "21 PODIOS ACUMULADOS" sem contexto

- **Componente:** Stats section na home
- **Problema:** O numero "21" pros podios acumulados nao tem tooltip ou link que mostre de quem sao os podios. O visitante fica na duvida: "21 podios de quem?".
- **Solucao:** Adiciona tooltip ou link que filtre pilotos por podios, ou reescreve pra "21 podios distribuidos entre 5 pilotos" pra dar contexto imediato.

---

### A15. Indicador de scroll "ROLE PRA ACOMPANHAR" — fraco no mobile

- **Componente:** Hero home
- **Problema:** O indicador de scroll "ROLE PARA ACOMPANHAR A TEMPORADA" e so texto pequeno. No celular, muita gente nao percebe que tem conteudo embaixo.
- **Solucao:** Transforma numa seta animada (`@keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(8px)} }`) posicionada na parte inferior do hero.

---

## DESEJAVEL

Micro-polimentos de estetica de alta performance, animacoes sutis de velocidade, refinamento de bordas/sombras e elevacao do valor percebido da marca.

---

### D1. Transicao de paginas — sem animacao de entrada

- **Componente:** Todas as paginas
- **Problema:** A troca de paginas e instantanea sem nenhuma animacao. Isso faz o site parecer estatico e sem personalidade de motorsport.
- **Solucao:** Adiciona `@keyframes fadeSlideUp` (opacity 0->1 + translateY(12px)->0) com duracao 400ms no conteudo principal. Aplica via wrapper no `page.tsx` ou no `loading.tsx`.

---

### D2. Headline do hero — sem animacao de entrada cinematografica

- **Componente:** Hero "A PISTA NAO ESPERA"
- **Problema:** A headline enorme aparece de forma estatica. Pra um site de motorsport, falta **velocidade visual**.
- **Solucao:** Anima as palavras em sequencia com `animation: slideInLeft 600ms ease-out` com delay escalonado (0ms, 100ms, 200ms). Usa `clip-path` ou `transform: translateX(-30px)` com `opacity: 0` como estado inicial.

---

### D3. Countdown — sem efeito de flip/tick

- **Componente:** Countdown no hero
- **Problema:** Os numeros mudam sem nenhuma animacao visual. Em sites de F1 e motorsport premium, os numeros de countdown tem efeito de "flip" ou "tick".
- **Solucao:** Aplica `transform: scaleX(0)` momentaneo + `scaleX(1)` quando o numero muda. Usa `transition: transform 150ms ease` com `transform-origin: center`.

---

### D4. Classificacao — sem animacao de ordenacao

- **Componente:** Tabela de classificacao
- **Problema:** Quando o piloto troca de aba (Geral -> Insanos -> Rapidos), os dados aparecem de forma estatica.
- **Solucao:** Anima as linhas da tabela com `transition: opacity 300ms ease, transform 300ms ease` em sequencia (stagger 50ms por linha).

---

### D5. Botao "ENTRAR NO GRID" — sem efeito de pulse/glow

- **Componente:** CTA principal
- **Problema:** O botao cyan e funcional mas nao passa **urgencia**. Em conversao extrema, o CTA tem que "gritar" silenciosamente.
- **Solucao:** Adiciona `box-shadow` animado sutil: `@keyframes ctaGlow { 0%,100%{box-shadow: 0 0 0 0 rgba(0,217,255,0.4)} 50%{box-shadow: 0 0 0 8px rgba(0,217,255,0)} }` com duracao 2s, aplicado so no hero da home.

---

### D6. Card de etapa — sem animacao de hover com elevacao

- **Componente:** Cards de etapas no calendario
- **Problema:** Os cards nao tem nenhuma elevacao ou movimento no hover.
- **Solucao:** No hover, aplica `transform: translateY(-4px) scale(1.01)` + `box-shadow: 0 16px 40px rgba(0,0,0,0.2)`. Pra imagem interna: `transform: scale(1.05)` com `transition: transform 600ms var(--cinema-ease)`.

---

### D7. Header fixo — sem transicao de background

- **Componente:** Header sticky
- **Problema:** O header muda de transparente pra background solido de forma abrupta ao rolar.
- **Solucao:** Transicao suave: `transition: background-color 300ms ease, backdrop-filter 300ms ease`. Usa `backdrop-filter: blur(12px)` quando scrolled pra efeito de vidro fosco.

---

### D8. Grid de pilotos — sem animacao de revelacao no scroll

- **Componente:** Grid de pilotos na home
- **Problema:** Todos os cards de pilotos aparecem de uma vez. Nao tem progressao visual.
- **Solucao:** Usa `IntersectionObserver` pra animar cards quando entram no viewport. Cada card com `opacity: 0; transform: translateY(20px)` -> `opacity: 1; transform: translateY(0)` com stagger de 100ms.

---

### D9. Patrocinadores — sem efeito de marquee no scroll

- **Componente:** Sponsor rail
- **Problema:** Os logos de patrocinadores sao estaticos. Em sites premium, a secao de sponsors tem movimento sutil.
- **Solucao:** Aplica `animation: marquee 30s linear infinite` no rail de sponsors com `display: flex; gap: 54px` e duplica o conteudo pra efeito de scroll infinito.

---

### D10. Tela de loading — sem personalidade UDK

- **Componente:** /loading.tsx
- **Problema:** A tela de loading mostra so um spinner generico.
- **Solucao:** Troca pra animacao de **semaforo de largada** (5 luzes vermelhas acendem em sequencia, depois apagam e a tela abre). Usa 5 divs circulares com `animation-delay` escalonado.

---

### D11. Cards de noticias — sem efeito hover com overlay

- **Componente:** Cards de noticias na home
- **Problema:** Os cards de noticias nao tem hover state diferenciado.
- **Solucao:** No hover, escurece a imagem com overlay gradiente (`background: linear-gradient(180deg, transparent 40%, rgba(0,0,0,0.7) 100%)`) e eleva o titulo com `transform: translateY(-4px)`.

---

### D12. Texto "UDK / 2026" — sem animacao de marquee no hero

- **Componente:** Marquee na home
- **Problema:** O texto "ULTRAS DO KART / PERFORMANCE EM PISTA / COMUNIDADE ALEM DA VOLTA" parece ser uma animacao de marquee mas nao ta se movendo no screenshot.
- **Solucao:** Confirma que o marquee ta funcionando com `animation: marquee 20s linear infinite`. Se nao tiver, adiciona: `@keyframes marquee { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }`.

---

### D13. Botao "VER TEMPORADA" — sem icone consistente

- **Componente:** CTA secundario no hero
- **Problema:** O botao "VER TEMPORADA" usa um icone de calendario. O botao "ENTRAR NO GRID" usa uma seta. A linguagem visual de icones nao e consistente.
- **Solucao:** Padroniza: botoes de acao primaria usam seta (->), botoes de navegacao usam seta pra direita (>). Icone de calendario reservado so pra aba Calendario.

---

### D14. Numeros "05 ETAPAS / 05 PILOTOS" — sem animacao de contagem

- **Componente:** Stats numericos na home
- **Problema:** Os numeros 05, 05, 21, 02 aparecem estaticos. Em sites premium, esses numeros animam de 0 ao valor final.
- **Solucao:** Usa `IntersectionObserver` + `requestAnimationFrame` pra animar de 0 ao valor final em 1.5s com easing `ease-out`. Formata com zero-padded pra manter alinhamento.

---

### D15. Footer — sem efeito de gradiente de separacao

- **Componente:** Transicao home -> footer
- **Problema:** O footer comeca abruptamente depois do conteudo.
- **Solucao:** Adiciona um gradiente de transicao: `background: linear-gradient(180deg, var(--cinema-black) 0%, var(--cinema-black) 50%, #07090b 100%)` ou uma borda decorativa com `border-top: 1px solid var(--cinema-line)`.

---

## MAPA DOS 27 ASPECTOS

| #   | Aspecto                    | Status                                    | Severidade                 |
| --- | -------------------------- | ----------------------------------------- | -------------------------- |
| 1   | Identidade Visual          | Premium motorsport, consistente           | Parcial - dois CSS systems |
| 2   | Estrutura Visual & Grids   | Forte no desktop, colapsa no mobile       | C4, C5                     |
| 3   | Tipografia                 | Excelente escala, display impactante      | A3 (fontes duplicadas)     |
| 4   | Cores & Estados Semanticos | Paleta racing forte, faltam status states | A6, A9                     |
| 5   | Espacamentos               | Limpos, consistentes                      | OK                         |
| 6   | Raios de Borda             | Consistentes (16px base)                  | OK                         |
| 7   | Sombras                    | Presentes, podem ser mais expressivas     | D6                         |
| 8   | Bordas                     | Separadores claros                        | OK                         |
| 9   | Icones                     | Presentes, faltam em status badges        | A9                         |
| 10  | Botoes                     | Hierarquia clara, falta loading state     | A8, C1                     |
| 11  | Formularios                | Login funcional, falta validacao visual   | A8, C2                     |
| 12  | Cards                      | Estrutura boa, faltam hover states        | A7, D6                     |
| 13  | Tabelas                    | Desktop forte, precisa adaptacao mobile   | C5, A6                     |
| 14  | Modais                     | Nao encontrados na auditoria              | Verificar                  |
| 15  | Sidebar/Navegacao          | Desktop ok, mobile quebrado               | C1, C3, A11                |
| 16  | Filtros                    | Busca presente, botao separado            | C6                         |
| 17  | Tamanhos                   | Touch targets adequados no desktop        | C1 (mobile)                |
| 18  | Estados Vazios             | Nao encontrados na auditoria              | Verificar                  |
| 19  | Animacoes                  | Quase inexistentes                        | D1-D14                     |
| 20  | Transicoes                 | Sem transicao de paginas                  | D1                         |
| 21  | Comportamento de Clique    | Funcional, sem micro-feedbacks            | A7, A8                     |
| 22  | Desktop                    | Excelente em 1440px                       | OK                         |
| 23  | Tablet                     | Nao testado especificamente               | Verificar                  |
| 24  | Mobile                     | Critico - CTA ausente, fold quebrado      | C1-C6                      |
| 25  | Acessibilidade             | Focus-visible presente, contraste parcial | A4, C3                     |
| 26  | Founder/Designer           | Ver secoes CRITICO e ALTO IMPACTO         | C1-C6, A1-A15              |
| 27  | Piloto no Paddock          | Ver secao CRITICO (jornada mobile)        | C1-C6                      |

---

## RESUMO EXECUTIVO

### O que ta funcionando bem

- **Identidade visual forte:** A paleta cyan/graphite + tipografia bold cria uma identidade de motorsport premium imediata.
- **Hero cinematografico:** A headline "A PISTA NAO ESPERA." com imagem de karts e impactante.
- **Classificacao clara:** A tabela de classificacao ta bem hierarquizada com numeros mono-espacados.
- **Login visual:** O layout split com hero visual + formulario e elegante no desktop.
- **Contagem regressiva:** O countdown gera urgencia e conversao.

### O que precisa de acao imediata

1. **Mobile first** — O CTA de inscricao some no mobile (C1). Isso e conversao perdida.
2. **Consolidacao CSS** — Mais de 40 arquivos CSS sao insustentaveis (A2).
3. **Animacoes** — O site parece estatico. Falta velocidade visual (D1-D14).
4. **Loading states** — Formularios sem feedback geram duplo-clique e frustracao (A8).

### Prioridade de implementacao

1. **Semana 1:** Corrige C1 (CTA mobile), C2 (login mobile), C3 (menu mobile)
2. **Semana 2:** Consolida CSS (A1, A2), remove fontes duplicadas (A3)
3. **Semana 3:** Animacoes de entrada (D1-D4), hover states (A7, D6)
4. **Semana 4:** Loading states (A8), status badges (A9), lazy loading (A10)
