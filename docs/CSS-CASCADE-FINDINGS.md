# O que A1 e A2 realmente envolvem

Levantamento de 12/08/2026, ao tentar executar os passos 5.2 e 5.3 do
`patch/README.md` (consolidar as folhas e unificar o tema).

Duas conclusões, uma sobre bundling e outra sobre design. A segunda contradiz o
que este documento afirmava na primeira versão — a correção está registrada
abaixo.

## 1. A ordem de carregamento do CSS não é a ordem dos imports

`app/layout.tsx` importa as folhas nesta ordem:

```ts
import "./globals.css";
import "./race.css";              // @import das cinema-*, visual-*, audit-*, official-media
import "./brand-racing-texture.css";
import "./udk-production-fixes.css";
```

O Next divide o resultado em dois chunks e os ordena pelo grafo de módulos, não
por essa lista. Posição do primeiro seletor de cada folha em cada chunk do build
de produção:

| Folha | chunk A (113 KB) | chunk B (65 KB) |
|---|---|---|
| `globals.css` | 29 443 | **62 724 (último)** |
| `cinema-core.css` | 50 718 | 2 221 |
| `audit-fixes.css` | 99 527 | 39 980 |
| `udk-production-fixes.css` | — | 60 069 |

`globals.css` não é o primeiro: num chunk é o último de todos, depois inclusive
do patch de produção. E a ordem relativa entre as folhas **muda de um chunk para
o outro**.

Consequência prática: consolidar concatenando na ordem dos imports muda a
cascata. Medido com `scripts/visual-snapshot.mjs`, deu **371 elementos
diferentes em 24 das 28** combinações rota/breakpoint — `.cinema-menu-caption`
perdia o `display: none`, `.cinema-home-hero-media` perdia o `position:
absolute` e o hero da home colapsava para altura zero. Essa tentativa foi
revertida.

Reproduzir a ordem acidental do bundler é possível, mas congela o acidente sem
resolver nada. A consolidação precisa vir junto de uma decisão explícita de
ordem, validada com o snapshot.

## 2. As telas claras são intencionais, não um vazamento de tema

**Correção.** A primeira versão deste documento dizia que `/login`,
`/nova-senha` e a tabela de `/classificacao` apareciam claras porque a ordem de
bundling fazia `globals.css` vencer. Isso está errado. O tema cinema é
deliberadamente bicromático e define a paleta clara em `cinema-core.css`:

```css
--cinema-paper: #f3f0e8;
--cinema-ink: #111315;
```

Quem pinta essas superfícies é o próprio sistema cinema, com `background:
var(--cinema-paper)` — em `.race-auth-panel` (`cinema-core.css:1354`),
`.cinema-ranking` (`cinema-home.css:598`) e nos cabeçalhos de página
(`cinema-pages.css:9`), entre outros. Escuro para hero, header e rodapé; claro
para leitura densa: formulários, rankings e tabelas.

Isso foi verificado trocando a paleta de `globals.css` inteira para os tokens
escuros e recapturando o snapshot: das 28 combinações, **o único elemento que
mudou foi o `<html>`**, na cor herdada — que já é sobrescrita em todo lugar.
Nenhuma tela pública depende de `globals.css`.

### O que `globals.css` realmente serve

O painel autenticado, e só ele. São 60 classes exclusivas, 50 usadas em TSX:
`admin-table`, `sidebar-navigation`, `dashboard-panel`, `modal`, `module-crud`,
`reports-workspace`, `form-grid` e afins. Todas atrás de login.

## Caminho recomendado

1. **A1 não é "unificar dois temas concorrentes".** É decidir se o painel
   administrativo deve migrar para a paleta escura do site. O projeto de design
   mostra o painel escuro (`#050607`, `#0b0d0f`, `#111417`, texto `#9ba3a9`),
   então a direção existe — falta a decisão e um jeito de validar.
2. **A validação do painel exige uma sessão autenticada.** O snapshot atual
   cobre 14 rotas públicas; `/painel` sem login rende só a tela de acesso, com
   25 elementos. Sem credencial de teste, mudar `globals.css` é uma alteração
   que não se consegue verificar antes de publicar.
3. **A2 depois de A1**, com o snapshot rodado antes e depois de cada arquivo
   movido, e com `udk-production-fixes.css` mantido por último.

## Ferramenta

`scripts/visual-snapshot.mjs` captura caixa e estilos-chave de todo elemento com
classe, em 14 rotas × 2 breakpoints. Duas capturas do mesmo código dão diff
zero, então qualquer diferença é efeito real da mudança.

```bash
node scripts/visual-snapshot.mjs tmp/antes.json
node scripts/visual-snapshot.mjs tmp/depois.json
node scripts/visual-snapshot.mjs --diff tmp/antes.json tmp/depois.json
```
