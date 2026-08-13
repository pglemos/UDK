// Retrato de layout de todas as rotas públicas, em dois breakpoints.
//
// Serve de rede de proteção para refatorações de CSS: capture antes, refatore,
// capture depois e compare. Duas capturas do mesmo código dão diff zero, então
// qualquer diferença apontada é efeito real da mudança.
//
//   node scripts/visual-snapshot.mjs tmp/antes.json
//   # ...refatorar...
//   node scripts/visual-snapshot.mjs tmp/depois.json
//   node scripts/visual-snapshot.mjs --diff tmp/antes.json tmp/depois.json
//
// Requer um dev server em BASE (padrão http://localhost:3001) e playwright-core
// disponível. O pacote não é dependência do workspace de propósito — instale
// sob demanda com `npm i -g playwright-core` ou rode a partir de um diretório
// temporário que o tenha.
import fs from "node:fs";
import path from "node:path";

const BASE = process.env.BASE ?? "http://localhost:3001";

const ROTAS = [
  "/", "/login", "/classificacao", "/calendario", "/resultados",
  "/pilotos", "/noticias", "/regulamento", "/patrocinadores",
  "/inscricao", "/painel", "/nova-senha", "/recuperar-senha", "/rota-inexistente",
];

const VIEWPORTS = [
  { nome: "mobile", width: 390, height: 844 },
  { nome: "desktop", width: 1440, height: 900 },
];

// Roda dentro da página: caixa e estilos-chave de cada elemento com classe.
const coletar = () => {
  const arred = (n) => Math.round(n * 10) / 10;
  const els = [...document.querySelectorAll("[class]")];
  const itens = els.slice(0, 900).map((el) => {
    const r = el.getBoundingClientRect();
    const c = getComputedStyle(el);
    const classes = (typeof el.className === "string" ? el.className : "").trim();
    return [
      el.tagName.toLowerCase() + "." + classes.split(/\s+/).slice(0, 3).join("."),
      arred(r.x), arred(r.y), arred(r.width), arred(r.height),
      c.display, c.position, c.color, c.backgroundColor,
      c.fontSize, c.fontWeight, c.gridTemplateColumns, c.flexDirection,
      c.overflowX, c.zIndex, c.opacity,
    ].join("|");
  });
  return {
    scrollWidth: document.documentElement.scrollWidth,
    scrollHeight: document.documentElement.scrollHeight,
    totalElementos: els.length,
    itens,
  };
};

function diff(arquivoAntes, arquivoDepois) {
  const antes = JSON.parse(fs.readFileSync(arquivoAntes, "utf8"));
  const depois = JSON.parse(fs.readFileSync(arquivoDepois, "utf8"));
  let rotas = 0;
  let elementos = 0;
  const amostras = [];

  for (const chave of Object.keys(antes)) {
    const a = antes[chave];
    const b = depois[chave] ?? {};
    if (a.scrollWidth !== b.scrollWidth || a.scrollHeight !== b.scrollHeight) {
      amostras.push(`${chave} — página ${a.scrollWidth}x${a.scrollHeight} -> ${b.scrollWidth}x${b.scrollHeight}`);
    }
    const ia = a.itens ?? [];
    const ib = b.itens ?? [];
    let n = 0;
    for (let i = 0; i < Math.max(ia.length, ib.length); i++) {
      if (ia[i] === ib[i]) continue;
      n++;
      if (amostras.length < 15) {
        amostras.push(`${chave}\n   antes : ${ia[i] ?? "(ausente)"}\n   depois: ${ib[i] ?? "(ausente)"}`);
      }
    }
    if (n) {
      rotas++;
      elementos += n;
    }
  }

  console.log(`rotas com diferença: ${rotas}/${Object.keys(antes).length} | elementos: ${elementos}`);
  for (const linha of amostras) console.log("- " + linha);
  return elementos === 0 ? 0 : 1;
}

async function capturar(saida) {
  const { chromium } = await import("playwright-core");
  const navegador = await chromium.launch();
  const resultado = {};

  for (const vp of VIEWPORTS) {
    const ctx = await navegador.newContext({
      viewport: { width: vp.width, height: vp.height },
      reducedMotion: "reduce", // congela animações: sem isso o retrato não é estável
    });
    const page = await ctx.newPage();
    for (const rota of ROTAS) {
      try {
        await page.goto(BASE + rota, { waitUntil: "networkidle", timeout: 45000 });
        await page.waitForTimeout(1200);
        resultado[`${vp.nome} ${rota}`] = await page.evaluate(coletar);
      } catch (erro) {
        resultado[`${vp.nome} ${rota}`] = { erro: String(erro).slice(0, 120) };
      }
    }
    await ctx.close();
  }

  await navegador.close();
  fs.mkdirSync(path.dirname(path.resolve(saida)), { recursive: true });
  fs.writeFileSync(saida, JSON.stringify(resultado, null, 1));

  const chaves = Object.keys(resultado);
  const falhas = chaves.filter((k) => resultado[k].erro);
  console.log(`capturado: ${chaves.length} combinações rota/viewport em ${saida}`);
  if (falhas.length) console.log("falhas:", falhas.join(", "));
  return falhas.length ? 1 : 0;
}

const [primeiro, ...resto] = process.argv.slice(2);
if (primeiro === "--diff") {
  if (resto.length !== 2) throw new Error("uso: --diff <antes.json> <depois.json>");
  process.exit(diff(resto[0], resto[1]));
} else if (primeiro) {
  process.exit(await capturar(primeiro));
} else {
  console.log("uso: node scripts/visual-snapshot.mjs <saida.json> | --diff <antes.json> <depois.json>");
  process.exit(1);
}
