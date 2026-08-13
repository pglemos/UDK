# Por que A1 e A2 não são um refactor mecânico

Levantamento feito em 12/08/2026, ao tentar executar o passo 5.2 do
`patch/README.md` (consolidar as folhas de estilo em cinco arquivos).

## O que se esperava

`app/layout.tsx` importa as folhas nesta ordem:

```ts
import "./globals.css";
import "./race.css";              // @import das cinema-*, visual-*, audit-*, official-media
import "./brand-racing-texture.css";
import "./udk-production-fixes.css";
```

A leitura natural é que essa seja a cascata: `globals.css` primeiro, o patch de
produção por último. Consolidar seria concatenar nessa ordem.

## O que acontece de fato

O Next divide o CSS em dois chunks e os ordena pelo grafo de módulos, não pela
ordem dos imports. Posição do primeiro seletor de cada folha dentro de cada
chunk do build de produção:

| Folha | chunk A (113 KB) | chunk B (65 KB) |
|---|---|---|
| `globals.css` | 29 443 | **62 724 (último)** |
| `cinema-core.css` | 50 718 | 2 221 |
| `audit-fixes.css` | 99 527 | 39 980 |
| `udk-production-fixes.css` | — | 60 069 |

Dois pontos importam:

1. **`globals.css` não é o primeiro.** No chunk B ele é o último de todos,
   depois inclusive do patch de produção.
2. **A ordem relativa muda entre os chunks.** No chunk A `globals.css` vem
   antes de `cinema-core.css`; no chunk B, muito depois.

Ou seja: qual tema vence depende de qual chunk a rota carrega. É isso que faz
`/login`, `/nova-senha` e a tabela de `/classificacao` aparecerem no tema claro
dentro de um site escuro — não é uma escolha de design, é ordem de bundling.

## Consequência prática

Uma consolidação que concatene as folhas na ordem dos imports **muda a cascata**.
Medido com `scripts/visual-snapshot.mjs`: 371 elementos diferentes em 24 das 28
combinações rota/breakpoint. Entre as regressões, `.cinema-menu-caption` perdia
o `display: none` e `.cinema-home-hero-media` perdia o `position: absolute`,
zerando a altura do hero da home.

Reproduzir a ordem acidental do bundler é possível, mas congela o acidente e não
resolve nada.

## Caminho recomendado

Nesta ordem, cada passo com o snapshot rodado antes e depois:

1. **Unificar o tema primeiro (A1), não por último.** Enquanto duas paletas
   coexistirem, a ordem de bundling continua decidindo qual vence, e nenhuma
   consolidação é segura. Migrar o que `globals.css` ainda fornece (painel,
   telas de auth, `module-crud`) para as variáveis `--cinema-*` e apagar o
   arquivo remove a ambiguidade.
2. **Só então consolidar (A2).** Com um único sistema, a ordem entre as folhas
   restantes deixa de ser carga de trabalho e a concatenação vira segura.
3. Manter `udk-production-fixes.css` como último import enquanto houver
   overrides pendentes.

## Ferramenta

`scripts/visual-snapshot.mjs` captura caixa e estilos-chave de todo elemento com
classe, em 14 rotas × 2 breakpoints. Duas capturas do mesmo código dão diff
zero, então qualquer diferença é efeito real da mudança.

```bash
node scripts/visual-snapshot.mjs tmp/antes.json
node scripts/visual-snapshot.mjs tmp/depois.json
node scripts/visual-snapshot.mjs --diff tmp/antes.json tmp/depois.json
```
