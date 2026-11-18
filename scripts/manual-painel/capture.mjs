// Captura as telas do painel em alta resolução para o manual (sessão por link de acesso único).
import { chromium } from "playwright-core";
import { createClient } from "@supabase/supabase-js";
import { mkdirSync, writeFileSync } from "node:fs";

const ref = "gyhsirfwwsmugvirpwsi";
const SITE = "https://www.ultrasdokart.com.br";
const keys = await (await fetch(`https://api.supabase.com/v1/projects/${ref}/api-keys?reveal=true`, { headers: { Authorization: `Bearer ${process.env.SUPABASE_ACCESS_TOKEN}` } })).json();
const admin = createClient(`https://${ref}.supabase.co`, keys.find((k) => k.name === "service_role").api_key, { auth: { persistSession: false } });
const { data: link, error } = await admin.auth.admin.generateLink({ type: "magiclink", email: "synvollt@gmail.com", options: { redirectTo: `${SITE}/painel` } });
if (error) throw error;

const shots = JSON.parse(process.argv[2] ? (await import("node:fs")).readFileSync(process.argv[2], "utf8") : "[]");
mkdirSync("shots", { recursive: true });
const browser = await chromium.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: true });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2, locale: "pt-BR" });
const page = await ctx.newPage();
await page.goto(link.properties.action_link, { waitUntil: "networkidle" });
await page.waitForTimeout(4000);

// mascara dados pessoais e desenha marcadores numerados
const prepare = async (marks) => {
  await page.evaluate((marks) => {
    const mask = (s) => s.replace(/[\w.+-]+@[\w-]+\.[\w.]+/g, "•••@•••").replace(/\(?\d{2}\)?\s?9?\d{4,5}-?\d{4}/g, "(••) •••••-••••").replace(/\d{3}\.\d{3}\.\d{3}-\d{2}/g, "•••.•••.•••-••");
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let n; while ((n = walker.nextNode())) { const t = mask(n.nodeValue); if (t !== n.nodeValue) n.nodeValue = t; }
    document.querySelectorAll("input").forEach((i) => { if (i.value) i.value = mask(i.value); });
    document.querySelectorAll(".udk-mark").forEach((e) => e.remove());
    marks.forEach(([selector, label, dx = 0, dy = 0], index) => {
      const el = document.querySelector(selector);
      if (!el) return;
      const r = el.getBoundingClientRect();
      const ring = document.createElement("div");
      ring.className = "udk-mark";
      Object.assign(ring.style, { position: "fixed", left: `${r.left - 4}px`, top: `${r.top - 4}px`, width: `${r.width + 8}px`, height: `${r.height + 8}px`, border: "3px solid #28cce5", borderRadius: "8px", zIndex: 99998, pointerEvents: "none", boxShadow: "0 0 0 4px rgba(40,204,229,.18)" });
      const dot = document.createElement("div");
      dot.className = "udk-mark";
      dot.textContent = String(label ?? index + 1);
      Object.assign(dot.style, { position: "fixed", left: `${Math.max(4, r.left - 18 + dx)}px`, top: `${Math.max(4, r.top - 18 + dy)}px`, width: "30px", height: "30px", borderRadius: "50%", background: "#081116", color: "#28cce5", font: "800 15px/30px Archivo, Arial, sans-serif", textAlign: "center", border: "2px solid #28cce5", zIndex: 99999, pointerEvents: "none" });
      document.body.append(ring, dot);
    });
  }, marks);
};

for (const s of shots) {
  await page.setViewportSize(s.mobile ? { width: 390, height: 844 } : { width: 1440, height: 900 });
  await page.goto(`${SITE}${s.path}`, { waitUntil: "networkidle" }).catch(() => {});
  await page.waitForTimeout(3500);
  for (const step of s.before ?? []) {
    if (step.click) await page.click(step.click, { timeout: 5000 }).catch(() => {});
    if (step.scroll) await page.evaluate((y) => window.scrollTo(0, y), step.scroll);
    if (step.eval) await page.evaluate(step.eval).catch(() => {});
    await page.waitForTimeout(step.wait ?? 900);
  }
  await prepare(s.marks ?? []);
  await page.screenshot({ path: `shots/${s.id}.png` });
  console.log("ok", s.id);
}
await browser.close();
writeFileSync("shots/.done", new Date().toISOString());
