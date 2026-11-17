import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * PDFs no mesmo padrão da cronometragem oficial do Kartódromo Internacional de Betim
 * ("Resultado oficial" e "Volta a volta"), com a marca UDK. Montados em HTML A4 e salvos
 * pelo "Salvar como PDF" do navegador, como a própria cronometragem faz.
 */

type Lap = { n: number; ms: number; elapsed: number | null; valid: boolean };
type Entry = {
  id: string;
  position: number;
  kart: number | null;
  name: string;
  category: string;
  laps: Lap[];
  lapCount: number;
  bestMs: number | null;
  totalMs: number | null;
  points: number;
  pole: boolean;
  fastest: boolean;
  penaltyMs: number;
  penaltyPoints: number;
  status: string;
  note: string;
};
export type RaceReport = {
  resultId: string;
  kind: "qualifying" | "race" | "endurance";
  stageOrdinal: string;
  stageTitle: string;
  sessionName: string;
  track: string;
  startsAt: string | null;
  entries: Entry[];
  penalties: string[];
};

const ACCENT = "#0b7a53";

export function lapTime(ms: number | null | undefined): string {
  if (ms === null || ms === undefined || !Number.isFinite(ms) || ms <= 0) return "–";
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  const s = Math.floor((ms % 60_000) / 1000);
  const mm = Math.round(ms % 1000);
  const tail = `${String(s).padStart(2, "0")}.${String(mm).padStart(3, "0")}`;
  return h ? `${h}:${String(m).padStart(2, "0")}:${tail}` : `${m}:${tail}`;
}

function gap(ms: number): string {
  if (!Number.isFinite(ms)) return "–";
  if (ms === 0) return "0.000";
  return `+${(ms / 1000).toFixed(3)}`;
}

const esc = (value: unknown) =>
  String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

function sessionKind(name: string, kind: string | null, format: string): RaceReport["kind"] {
  if (kind === "qualifying" || /tomada|super pole/i.test(name)) return "qualifying";
  if (kind === "endurance" || format === "endurance") return "endurance";
  return "race";
}

export async function loadRaceReport(client: SupabaseClient, resultId: string): Promise<RaceReport> {
  const { data: result, error } = await client
    .from("results")
    .select("id,stage_id,stage:stages(title,track,starts_at,format,season_id),session:sessions!results_session_id_fkey(name,kind,starts_at)")
    .eq("id", resultId)
    .single();
  if (error) throw error;
  const stage = result.stage as unknown as { title: string; track: string | null; starts_at: string; format: string; season_id: string };
  const session = result.session as unknown as { name: string; kind: string | null; starts_at: string | null } | null;

  const [{ data: stages }, { data: entries, error: entriesError }, { data: penalties }] = await Promise.all([
    client.from("stages").select("id,starts_at").eq("season_id", stage.season_id).is("deleted_at", null).order("starts_at"),
    client
      .from("result_entries")
      .select("id,position,kart_number,laps,best_lap_ms,total_time_ms,points,pole,fastest_lap,penalty_ms,penalty_points,status,sporting_note,driver:drivers(sport_name,full_name,category:categories(name))")
      .eq("result_id", resultId)
      .is("deleted_at", null)
      .order("position"),
    client.from("penalties").select("code,summary,effect,driver:drivers(sport_name,full_name)").eq("stage_id", result.stage_id).is("deleted_at", null),
  ]);
  if (entriesError) throw entriesError;

  const ids = (entries ?? []).map((entry) => String(entry.id));
  const lapsByEntry = new Map<string, Lap[]>();
  for (let offset = 0; ids.length && offset < 20000; offset += 1000) {
    const { data: laps, error: lapsError } = await client
      .from("laps")
      .select("result_entry_id,lap_number,lap_time_ms,elapsed_time_ms,valid")
      .eq("result_id", resultId)
      .is("deleted_at", null)
      .order("lap_number")
      .range(offset, offset + 999);
    if (lapsError) throw lapsError;
    for (const lap of laps ?? []) {
      const list = lapsByEntry.get(String(lap.result_entry_id)) ?? [];
      list.push({ n: Number(lap.lap_number), ms: Number(lap.lap_time_ms), elapsed: lap.elapsed_time_ms === null ? null : Number(lap.elapsed_time_ms), valid: Boolean(lap.valid) });
      lapsByEntry.set(String(lap.result_entry_id), list);
    }
    if ((laps ?? []).length < 1000) break;
  }

  const ordinal = `${(stages ?? []).findIndex((row) => row.id === result.stage_id) + 1}ª`;
  const kind = sessionKind(session?.name ?? "", session?.kind ?? null, stage.format);
  const sessionLabel = (session?.name ?? "Corrida").replace(" - Horário", " (sentido horário)").replace(" - Anti-horário", " (sentido anti-horário)");

  return {
    resultId,
    kind,
    stageOrdinal: ordinal,
    stageTitle: stage.title,
    sessionName: sessionLabel,
    track: stage.track ?? "",
    startsAt: session?.starts_at ?? stage.starts_at,
    penalties: (penalties ?? [])
      .filter((row) => kind !== "qualifying")
      .map((row) => {
        const driver = row.driver as unknown as { sport_name: string | null; full_name: string } | null;
        return `${row.code} · ${driver?.sport_name || driver?.full_name || ""} — ${row.effect}`;
      }),
    entries: (entries ?? []).map((entry) => {
      const driver = entry.driver as unknown as { sport_name: string | null; full_name: string; category: { name: string } | null } | null;
      const laps = (lapsByEntry.get(String(entry.id)) ?? []).sort((a, b) => a.n - b.n);
      return {
        id: String(entry.id),
        position: Number(entry.position),
        kart: entry.kart_number === null ? null : Number(entry.kart_number),
        name: driver?.full_name || driver?.sport_name || "Piloto",
        category: driver?.category?.name ?? "Geral",
        laps,
        lapCount: Number(entry.laps ?? laps.length),
        bestMs: entry.best_lap_ms === null ? null : Number(entry.best_lap_ms),
        totalMs: entry.total_time_ms === null ? laps.at(-1)?.elapsed ?? null : Number(entry.total_time_ms),
        points: Number(entry.points ?? 0),
        pole: Boolean(entry.pole),
        fastest: Boolean(entry.fastest_lap),
        penaltyMs: Number(entry.penalty_ms ?? 0),
        penaltyPoints: Number(entry.penalty_points ?? 0),
        status: String(entry.status),
        note: String(entry.sporting_note ?? ""),
      };
    }),
  };
}

function kindLabel(kind: RaceReport["kind"]): string {
  return kind === "qualifying" ? "TOMADA DE TEMPO" : kind === "endurance" ? "ENDURANCE" : "CORRIDA";
}

function dateLine(iso: string | null): string {
  if (!iso) return "";
  const date = new Date(iso);
  const day = date.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });
  const weekday = date.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo", weekday: "long" });
  const hour = date.toLocaleTimeString("pt-BR", { timeZone: "America/Sao_Paulo", hour: "2-digit", minute: "2-digit" });
  return `${day} (${weekday}) · ${hour}`;
}

const css = `@page{size:A4;margin:12mm 11mm 14mm;@bottom-left{content:"UDK · Ultras do Kart · cronometragem oficial do Kartódromo Internacional de Betim";font:7pt system-ui,'Segoe UI',sans-serif;color:#555}@bottom-right{content:"Página " counter(page) " de " counter(pages);font:7pt system-ui,'Segoe UI',sans-serif;color:#555}}
*{box-sizing:border-box}html,body{margin:0}body{font:8.4pt/1.3 system-ui,-apple-system,'Segoe UI',sans-serif;color:#111;-webkit-print-color-adjust:exact;print-color-adjust:exact}
header{display:grid;grid-template-columns:auto 1fr auto;gap:16px;align-items:center;border-bottom:2px solid ${ACCENT};padding-bottom:9px;margin-bottom:12px}
header img{height:40px;display:block}.kicker{color:${ACCENT};font-size:7.5pt;font-weight:700;letter-spacing:.08em}
h1{font-size:18pt;margin:1px 0 2px;line-height:1.1}.meta{font-size:9pt}.meta2{font-size:8pt;color:#444}
.rule{justify-self:end;text-align:right}.pill{display:inline-block;border:1px solid ${ACCENT};color:${ACCENT};background:#eef8f3;border-radius:999px;padding:3px 10px;font-size:8pt}.pill b{font-weight:700}.issued{margin-top:6px;font-size:7.5pt;color:#444}
table{width:100%;border-collapse:collapse}th{font-size:6.8pt;color:#333;text-transform:uppercase;letter-spacing:.03em;text-align:left;padding:6px 4px;border-bottom:1.5px solid #111;background:#f2f2f2;vertical-align:bottom}
td{padding:5px 4px;border-bottom:1px solid #ddd;vertical-align:middle}.r{text-align:right;white-space:nowrap;font-variant-numeric:tabular-nums}.c{text-align:center}
.pos{font-weight:700;font-size:9.5pt;text-align:center}.kart{display:inline-block;min-width:30px;text-align:center;border:1px solid #666;border-radius:4px;padding:1px 5px;font-weight:600}
.name{font-weight:600}.best{display:inline-block;background:${ACCENT};color:#fff;border-radius:3px;padding:1px 5px;font-weight:700}.cat{color:#444;font-size:7.6pt}
.notes{margin-top:10px;font-size:8pt;line-height:1.5}.label{color:${ACCENT};font-size:7pt;font-weight:700;letter-spacing:.08em;margin-right:6px}.muted{color:#555}
.notes ul{margin:2px 0 6px;padding-left:16px}.sign{display:grid;grid-template-columns:repeat(3,1fr);gap:28px;margin-top:34px;break-inside:avoid}.sign div{border-top:1px solid #111;padding-top:5px;text-align:center;font-weight:600}
.sign small{display:block;text-align:left;font-weight:400;color:#555;margin-top:12px}
.comp{margin-top:12px;break-inside:avoid-page}.comp-head{background:#ececec;border:1px solid #bbb;border-bottom:0;padding:5px 8px;font-size:8.6pt}.comp-head b{font-weight:700}
.comp table th{background:#fff;border-bottom:1px solid #111;padding:3px 4px}.comp table td{padding:2.5px 4px;border-bottom:1px solid #e3e3e3}.comp tr:nth-child(even) td{background:#fafafa}
.comp tr.is-best td{background:#e8f5ee!important}.comp tr.is-best .tv{color:${ACCENT};font-weight:700}.comp tr.void td{color:#999;text-decoration:line-through}
.sheet-tools{position:sticky;top:0;display:flex;gap:10px;align-items:center;padding:8px 14px;background:#20262b;color:#fff;font:600 12px system-ui}.sheet-tools button{font:inherit;padding:6px 12px;border-radius:4px;border:0;background:${ACCENT};color:#fff;cursor:pointer}
@media print{.sheet-tools{display:none}}`;

function headerHtml(report: RaceReport, kind: "RESULTADO OFICIAL" | "VOLTA A VOLTA", logoUrl: string, subtitle?: string) {
  const criterion = report.kind === "qualifying" ? "melhor volta" : "ordem de chegada";
  return `<header><img src="${esc(logoUrl)}" alt="UDK">
  <div><div class="kicker">${kind} · ${kindLabel(report.kind)}</div><h1>${esc(report.stageOrdinal)} etapa · ${esc(report.sessionName)}</h1>
  <div class="meta">${esc(dateLine(report.startsAt))}</div><div class="meta2">${esc([report.track, `${report.entries.length} pilotos`, subtitle].filter(Boolean).join(" · "))}</div></div>
  <div class="rule"><span class="pill">Classificação por <b>${criterion}</b></span><div class="issued">Emitido em ${esc(new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", dateStyle: "short", timeStyle: "short" }))}</div></div></header>`;
}

function bestOf(laps: Lap[]): { ms: number; n: number } | null {
  const valid = laps.filter((lap) => lap.valid && lap.ms > 0);
  if (!valid.length) return null;
  return valid.reduce((a, b) => (b.ms < a.ms ? b : a), valid[0]!) as { ms: number; n: number };
}

export function resultHtml(report: RaceReport, logoUrl: string): string {
  const isQuali = report.kind === "qualifying";
  const sessionBest = Math.min(...report.entries.map((entry) => entry.bestMs ?? Infinity));
  const leader = report.entries[0];
  const rows = report.entries
    .map((entry, index) => {
      const best = bestOf(entry.laps);
      const sorted = entry.laps.filter((lap) => lap.valid).map((lap) => lap).sort((a, b) => a.ms - b.ms);
      const second = sorted[1];
      const last = entry.laps.at(-1);
      const prev = report.entries[index - 1];
      const bestCell = entry.bestMs === sessionBest ? `<span class="best">${lapTime(entry.bestMs)}</span>` : lapTime(entry.bestMs);
      if (isQuali) {
        const difLeader = index === 0 || !entry.bestMs || !leader?.bestMs ? "–" : gap(entry.bestMs - leader.bestMs);
        const difPrev = index === 0 || !entry.bestMs || !prev?.bestMs ? "–" : gap(entry.bestMs - prev.bestMs);
        return `<tr><td class="pos">${entry.position}</td><td><span class="kart">${esc(entry.kart ?? "–")}</span></td><td class="name">${esc(entry.name)}<div class="cat">${esc(entry.category)}</div></td>
          <td class="r">${bestCell}</td><td class="r">${best?.n ?? "–"}</td><td class="r">${difLeader}</td><td class="r">${difPrev}</td><td class="r">${entry.lapCount}</td>
          <td class="r">${lapTime(second?.ms)}</td><td class="r">${second?.n ?? "–"}</td><td class="r">${lapTime(last?.ms)}</td></tr>`;
      }
      const lapsDown = leader ? leader.lapCount - entry.lapCount : 0;
      const difLeader = index === 0 ? "–" : lapsDown > 0 ? `+${lapsDown} volta${lapsDown > 1 ? "s" : ""}` : entry.totalMs && leader?.totalMs ? gap(entry.totalMs - leader.totalMs) : "–";
      const prevDown = prev ? prev.lapCount - entry.lapCount : 0;
      const difPrev = index === 0 ? "–" : prevDown > 0 ? `+${prevDown} volta${prevDown > 1 ? "s" : ""}` : entry.totalMs && prev?.totalMs ? gap(entry.totalMs - prev.totalMs) : "–";
      const marks = [entry.pole ? "pole" : "", entry.fastest ? "MV" : "", entry.penaltyMs ? `+${entry.penaltyMs / 1000}s` : "", entry.penaltyPoints ? `−${entry.penaltyPoints}` : ""].filter(Boolean).join(" ");
      return `<tr><td class="pos">${entry.position}</td><td><span class="kart">${esc(entry.kart ?? "–")}</span></td><td class="name">${esc(entry.name)}<div class="cat">${esc(entry.category)}</div></td>
        <td class="r">${entry.lapCount}</td><td class="r">${lapTime(entry.totalMs)}</td><td class="r">${difLeader}</td><td class="r">${difPrev}</td>
        <td class="r">${bestCell}</td><td class="r">${best?.n ?? "–"}</td><td class="r">${esc(marks || "–")}</td><td class="r"><b>${entry.points}</b></td></tr>`;
    })
    .join("");
  const head = isQuali
    ? `<th class="c">Pos.</th><th>Kart</th><th>Piloto</th><th class="r">Melhor<br>volta</th><th class="r">Na<br>volta</th><th class="r">Dif.<br>líder</th><th class="r">Dif.<br>anterior</th><th class="r">Voltas</th><th class="r">2ª<br>melhor</th><th class="r">Na<br>volta</th><th class="r">Última<br>volta</th>`
    : `<th class="c">Pos.</th><th>Kart</th><th>Piloto</th><th class="r">Voltas</th><th class="r">Tempo<br>total</th><th class="r">Dif.<br>líder</th><th class="r">Dif.<br>anterior</th><th class="r">Melhor<br>volta</th><th class="r">Na<br>volta</th><th class="r">Bônus /<br>punição</th><th class="r">Pts</th>`;
  const fastest = report.entries.find((entry) => entry.bestMs === sessionBest);
  const fastestLap = fastest ? bestOf(fastest.laps) : null;
  const howTo = isQuali
    ? "<b>Na volta</b> número da volta em que o tempo foi feito · <b>Dif. líder</b> diferença de melhor volta para o 1º colocado · <b>Dif. anterior</b> diferença para o piloto da posição acima · <b>2ª melhor</b> segundo melhor tempo do piloto"
    : "<b>Posição</b> ordem de chegada geral (categorias juntas, Art. 18) · <b>Dif. líder / anterior</b> tempo ou voltas para o 1º e para o piloto acima · <b>Bônus / punição</b> pole e melhor volta (+1, Art. 19), penalidades (Art. 22) · <b>Pts</b> pontos da prova";
  const notes = report.entries.filter((entry) => entry.note).map((entry) => `<li>${esc(entry.name)}: ${esc(entry.note)}</li>`).join("");
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Resultado oficial</title><style>${css}</style></head><body>
  ${headerHtml(report, "RESULTADO OFICIAL", logoUrl)}
  <table><thead><tr>${head}</tr></thead><tbody>${rows}</tbody></table>
  <section class="notes">
    <div><span class="label">MELHOR VOLTA DA SESSÃO</span><b>${fastest ? `${lapTime(sessionBest)} · ${esc(fastest.name)} · kart ${esc(fastest.kart ?? "–")}${fastestLap ? ` · na volta ${fastestLap.n}` : ""}` : "Nenhuma volta válida."}</b></div>
    <div><span class="label">COMO LER</span><span class="muted">${howTo} · <b>NC / DC</b> não classificado / desclassificado</span></div>
    ${report.penalties.length ? `<div><span class="label">PENALIDADES DA ETAPA</span><ul>${report.penalties.map((text) => `<li>${esc(text)}</li>`).join("")}</ul></div>` : ""}
    ${notes ? `<div><span class="label">OBSERVAÇÕES DA PROVA</span><ul>${notes}</ul></div>` : ""}
  </section>
  <div class="sign"><div>Diretor de Prova<small>Nome ____________________</small><small>Data ____________________</small></div><div>Comissão Julgadora<small>Nome ____________________</small><small>Data ____________________</small></div><div>Cronometragem<small>Nome ____________________</small><small>Data ____________________</small></div></div>
  </body></html>`;
}

export function lapsHtml(report: RaceReport, logoUrl: string, onlyEntryId?: string): string {
  const entries = onlyEntryId ? report.entries.filter((entry) => entry.id === onlyEntryId) : report.entries;
  const bestByCategory = new Map<string, number>();
  for (const entry of report.entries)
    if (entry.bestMs) bestByCategory.set(entry.category, Math.min(bestByCategory.get(entry.category) ?? Infinity, entry.bestMs));
  const blocks = entries
    .map((entry) => {
      const own = bestOf(entry.laps);
      const catBest = bestByCategory.get(entry.category) ?? null;
      const rows = entry.laps
        .map((lap) => {
          const isBest = own && lap.n === own.n;
          return `<tr class="${!lap.valid ? "void" : isBest ? "is-best" : ""}"><td class="c">${esc(entry.kart ?? "–")}</td><td class="c">${lap.n}</td><td class="r tv">${lapTime(lap.ms)}</td>
            <td class="r">${own && lap.valid ? gap(lap.ms - own.ms) : "–"}</td><td class="r">${catBest && lap.valid ? gap(lap.ms - catBest) : "–"}</td><td class="r">${lapTime(lap.elapsed)}</td><td>${lap.valid ? "–" : "anulada"}</td></tr>`;
        })
        .join("");
      return `<section class="comp"><div class="comp-head">Competidor: <b>${esc(entry.name)}</b> &nbsp;|&nbsp; Kart: <b>#${esc(entry.kart ?? "–")}</b> &nbsp;|&nbsp; Categoria: <b>${esc(entry.category.toUpperCase())}</b> &nbsp;|&nbsp; Posição: <b>${entry.position}º</b></div>
        <table><thead><tr><th class="c">#</th><th class="c">VLT</th><th class="r">TV</th><th class="r">DMV</th><th class="r">DLCAT</th><th class="r">TT</th><th>Penalidades</th></tr></thead>
        <tbody>${rows || '<tr><td colspan="7">Nenhuma volta registrada.</td></tr>'}</tbody></table></section>`;
    })
    .join("");
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Volta a volta</title><style>${css}</style></head><body>
  ${headerHtml(report, "VOLTA A VOLTA", logoUrl, onlyEntryId ? entries[0]?.name : undefined)}
  <p class="muted" style="margin:0 0 4px">TV tempo da volta · DMV diferença para a melhor volta do piloto · DLCAT diferença para a melhor volta da categoria na sessão · TT tempo acumulado</p>
  ${blocks}
  </body></html>`;
}

/** Abre a folha A4 numa aba e chama "Salvar como PDF". O nome do arquivo sai do título. */
export function openPdf(html: string, fileName: string) {
  const win = window.open("", "_blank");
  if (!win) throw new Error("O navegador bloqueou a nova aba. Libere pop-ups para este site e tente de novo.");
  const toolbar = `<div class="sheet-tools">${esc(fileName)}<button type="button" onclick="window.print()">Baixar PDF</button><span style="font-weight:400;opacity:.8">Na janela que abrir, escolha "Salvar como PDF".</span></div>`;
  win.document.open();
  win.document.write(html.replace("<body>", `<body>${toolbar}`).replace(/<title>[^<]*<\/title>/, `<title>${esc(fileName)}</title>`));
  win.document.close();
  const fire = () => setTimeout(() => win.print(), 350);
  if (win.document.readyState === "complete") fire();
  else win.addEventListener("load", fire, { once: true });
}

export function pdfFileName(...parts: (string | number | null | undefined)[]): string {
  return parts
    .filter((part) => part !== null && part !== undefined && part !== "")
    .map((part) => String(part).normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^\w]+/g, "_").replace(/^_|_$/g, ""))
    .join("_");
}
