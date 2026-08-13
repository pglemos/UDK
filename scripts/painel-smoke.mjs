// Loga no painel e percorre todas as abas, registrando erros de console,
// requisições falhas, telas vazias e overflow horizontal.
import { chromium } from "playwright-core";
import fs from "node:fs";

const BASE = process.env.ALVO ?? "https://www.ultrasdokart.com.br";
const { contas } = JSON.parse(fs.readFileSync("./contas.json", "utf8"));
const conta = contas.find((c) => c.email.startsWith("qa.")) ?? contas[0];

// Abas extraídas de navigationGroups em app/painel/[[...slug]]/page.tsx.
const ABAS = [
  "", "pilotos", "inscricoes", "documentos", "responsaveis", "termos", "aceites",
  "mudancas-categoria", "calendario", "sessoes", "checkin", "karts", "financeiro",
  "creditos", "resultados", "classificacao", "pontuacao", "importacoes", "voltas",
  "ocorrencias", "evidencias", "julgamentos", "recursos", "endurance",
  "membros-endurance", "stints", "conteudo", "versoes-conteudo", "patrocinadores",
  "usuarios-patrocinador", "campanhas", "notificacoes", "relatorios",
  "configuracoes", "permissoes",
];

const navegador = await chromium.launch();
const ctx = await navegador.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
const page = await ctx.newPage();

const erros = [];
const rede = [];
page.on("console", (m) => { if (m.type() === "error") erros.push(m.text().slice(0, 160)); });
page.on("response", (r) => { if (r.status() >= 400) rede.push(`${r.status()} ${r.url().replace(BASE, "").slice(0, 90)}`); });

// login
await page.goto(`${BASE}/login`, { waitUntil: "networkidle", timeout: 60000 });
await page.fill('input[type="email"], input[name="email"]', conta.email);
await page.fill('input[type="password"], input[name="password"]', conta.senha);
await page.click('button[type="submit"]');
await page.waitForURL(/painel/, { timeout: 45000 }).catch(() => {});
await page.waitForTimeout(3500);

const logado = page.url().includes("painel");
console.log(`login: ${logado ? "OK" : "FALHOU"} -> ${page.url()}`);
if (!logado) {
  console.log("erros:", erros.slice(0, 5).join(" | "));
  console.log("corpo:", (await page.textContent("body")).replace(/\s+/g, " ").slice(0, 300));
  await navegador.close();
  process.exit(1);
}

const linhas = [];
for (const aba of ABAS) {
  erros.length = 0; rede.length = 0;
  const url = `${BASE}/painel${aba ? "/" + aba : ""}`;
  await page.goto(url, { waitUntil: "networkidle", timeout: 60000 }).catch(() => {});
  await page.waitForTimeout(1600);
  const d = await page.evaluate(() => {
    const txt = document.body.innerText.replace(/\s+/g, " ").trim();
    const conteudo = document.querySelector(".content");
    return {
      titulo: document.querySelector(".operations-header b")?.textContent?.trim() ?? "",
      chars: (conteudo?.innerText ?? txt).trim().length,
      vazio: /Nada por aqui|Nenhum registro|sem dados|Em breve/i.test(txt),
      negado: /Acesso negado|access-denied|Sem permiss/i.test(txt),
      erroApp: /Application error|Internal Server Error|Erro inesperado/i.test(txt),
      tabelas: document.querySelectorAll(".admin-table").length,
      botoes: document.querySelectorAll("button, .action-button").length,
      horiz: document.documentElement.scrollWidth > window.innerWidth,
      sidebarAtivo: document.querySelector(".nav-group a.active")?.textContent?.trim().slice(0, 24) ?? "-",
    };
  }).catch((e) => ({ erroApp: true, titulo: String(e).slice(0, 60) }));

  linhas.push({
    aba: aba || "(dashboard)", titulo: d.titulo, chars: d.chars, tabelas: d.tabelas,
    botoes: d.botoes, ativo: d.sidebarAtivo,
    flags: [d.erroApp && "ERRO-APP", d.negado && "negado", d.vazio && "vazio", d.horiz && "OVERFLOW"].filter(Boolean).join(","),
    console: erros.length, http: rede.slice(0, 2).join(" ; "),
  });
}

console.table(linhas);

await navegador.close();
