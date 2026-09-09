from __future__ import annotations

import argparse
import json
import os
import subprocess
from dataclasses import dataclass
from datetime import datetime
from html import escape
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen
from zoneinfo import ZoneInfo

from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle


PAGE_SIZE = landscape(A4)
INK = colors.HexColor("#121212")
PAPER = colors.HexColor("#F7F5F0")
MUTED = colors.HexColor("#68645D")
NEON = colors.HexColor("#DAFC08")
LINE = colors.HexColor("#D8D3C9")
INSANOS = colors.HexColor("#DAFC08")
RAPIDOS = colors.HexColor("#F7F5F0")
WARNING = colors.HexColor("#FFF0E9")


@dataclass(frozen=True)
class ResultSpec:
    title: str
    filename: str
    label: str
    format: str


RESULTS = (
    ResultSpec(
        "Resultado oficial - 1a etapa - Endurance - Geral",
        "udk-2026-1a-etapa-endurance-geral.pdf",
        "1a etapa - Endurance",
        "endurance",
    ),
    ResultSpec(
        "Resultado oficial - 2a etapa - Corrida 1 - Geral",
        "udk-2026-2a-etapa-corrida-1-geral.pdf",
        "2a etapa - Corrida 1",
        "regular",
    ),
    ResultSpec(
        "Resultado oficial - 2a etapa - Corrida 2 - Geral",
        "udk-2026-2a-etapa-corrida-2-geral.pdf",
        "2a etapa - Corrida 2",
        "regular",
    ),
)


def fetch_json(base_url: str, anon_key: str, resource: str, params: dict[str, str]) -> list[dict[str, object]]:
    query = urlencode(params)
    url = f"{base_url.rstrip('/')}/rest/v1/{resource}?{query}"
    request = Request(
        url,
        headers={"apikey": anon_key, "Authorization": f"Bearer {anon_key}"},
    )
    try:
        with urlopen(request, timeout=30) as response:
            body = response.read().decode("utf-8")
    except (HTTPError, URLError) as error:
        try:
            completed = subprocess.run(
                [
                    "curl",
                    "--http1.1",
                    "--fail",
                    "--silent",
                    "--show-error",
                    url,
                    "-H",
                    f"apikey: {anon_key}",
                    "-H",
                    f"Authorization: Bearer {anon_key}",
                ],
                check=False,
                capture_output=True,
                text=True,
            )
        except FileNotFoundError:
            completed = None
        if completed is None or completed.returncode != 0:
            detail = (
                completed.stderr.strip()
                if completed is not None
                else "curl is unavailable"
            )
            raise RuntimeError(f"Supabase request failed for {resource}: {detail or error}") from error
        body = completed.stdout
    payload = json.loads(body)
    if not isinstance(payload, list):
        raise RuntimeError(f"Supabase returned an unexpected payload for {resource}")
    return [row for row in payload if isinstance(row, dict)]


def number(value: object, fallback: float = 0) -> float:
    try:
        parsed = float(value)  # type: ignore[arg-type]
    except (TypeError, ValueError):
        return fallback
    return parsed


def text(value: object, fallback: str = "") -> str:
    return value if isinstance(value, str) else fallback


def format_time(milliseconds: object, missing: str = "-") -> str:
    if milliseconds is None or milliseconds == "":
        return missing
    total = int(number(milliseconds, -1))
    if total < 0:
        return missing
    minutes, remainder = divmod(total, 60_000)
    seconds, millis = divmod(remainder, 1_000)
    hours, minutes = divmod(minutes, 60)
    if hours:
        return f"{hours}:{minutes:02d}:{seconds:02d}.{millis:03d}"
    return f"{minutes}:{seconds:02d}.{millis:03d}"


def format_date(value: object) -> str:
    source = text(value)
    if not source:
        return ""
    try:
        parsed = datetime.fromisoformat(source.replace("Z", "+00:00"))
    except ValueError:
        return source
    return parsed.astimezone(ZoneInfo("America/Sao_Paulo")).strftime("%d/%m/%Y")


def category_label(value: object) -> str:
    slug = text(value).lower()
    if slug == "insanos":
        return "ULTRAS INSANOS"
    if slug == "rapidos":
        return "ULTRAS RAPIDOS"
    return text(value, "GERAL").upper()


def result_adjustments(entry: dict[str, object]) -> str:
    adjustments: list[str] = []
    if entry.get("pole") is True or text(entry.get("pole")).lower() == "true":
        adjustments.append("POLE +1")
    if entry.get("fastest_lap") is True or text(entry.get("fastest_lap")).lower() == "true":
        adjustments.append("MV +1")
    if entry.get("best_pit") is True or text(entry.get("best_pit")).lower() == "true":
        adjustments.append("PARADA +10")
    penalty_points = number(entry.get("penalty_points"))
    if penalty_points:
        adjustments.append(f"- {int(penalty_points)} pts")
    penalty_ms = number(entry.get("penalty_ms"))
    if penalty_ms:
        adjustments.append(f"+ {penalty_ms / 1000:g}s")
    return " / ".join(adjustments) or "-"


def p(text_value: object, style: ParagraphStyle) -> Paragraph:
    return Paragraph(escape(text(text_value)).replace("\n", "<br/>"), style)


def build_table(entries: list[dict[str, object]], styles: dict[str, ParagraphStyle]) -> Table:
    header = [
        "POS.",
        "PILOTO",
        "CATEGORIA",
        "VOLTAS",
        "TEMPO",
        "MELHOR VOLTA",
        "AJUSTES",
        "PONTOS",
    ]
    rows: list[list[object]] = [header]
    for entry in entries:
        status = text(entry.get("status")).lower()
        position = int(number(entry.get("position"), 0))
        position_label = str(position) if position > 0 else "-"
        if status in {"nc", "dnf", "disqualified"}:
            position_label = f"{position_label} / NC"
        rows.append(
            [
                position_label,
                text(entry.get("driver_name"), "Piloto"),
                category_label(entry.get("category_slug") or entry.get("category")),
                str(int(number(entry.get("laps")))),
                format_time(entry.get("total_time_ms")),
                format_time(entry.get("best_lap_ms")),
                result_adjustments(entry),
                str(int(number(entry.get("points")))),
            ]
        )

    table = Table(
        rows,
        colWidths=[34, 190, 96, 48, 91, 80, 175, 59],
        repeatRows=1,
        hAlign="LEFT",
    )
    commands: list[tuple[object, ...]] = [
        ("BACKGROUND", (0, 0), (-1, 0), INK),
        ("TEXTCOLOR", (0, 0), (-1, 0), PAPER),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, 0), 7.2),
        ("FONTNAME", (0, 1), (0, -1), "Helvetica-Bold"),
        ("FONTNAME", (1, 1), (1, -1), "Helvetica-Bold"),
        ("FONTNAME", (7, 1), (7, -1), "Helvetica-Bold"),
        ("FONTSIZE", (0, 1), (-1, -1), 7.2),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 7),
        ("RIGHTPADDING", (0, 0), (-1, -1), 7),
        ("TOPPADDING", (0, 0), (-1, 0), 7),
        ("BOTTOMPADDING", (0, 0), (-1, 0), 7),
        ("TOPPADDING", (0, 1), (-1, -1), 2.5),
        ("BOTTOMPADDING", (0, 1), (-1, -1), 2.5),
        ("LINEBELOW", (0, 0), (-1, 0), 1, NEON),
        ("LINEBELOW", (0, 1), (-1, -1), 0.35, LINE),
        ("ALIGN", (0, 0), (0, -1), "CENTER"),
        ("ALIGN", (3, 1), (5, -1), "RIGHT"),
        ("ALIGN", (7, 1), (7, -1), "RIGHT"),
    ]
    for row_index, entry in enumerate(entries, start=1):
        status = text(entry.get("status")).lower()
        category = text(entry.get("category_slug")).lower()
        row_background = colors.HexColor("#FFFEFA" if row_index % 2 else "#F0EDE6")
        commands.append(("BACKGROUND", (0, row_index), (-1, row_index), row_background))
        commands.append(
            (
                "BACKGROUND",
                (2, row_index),
                (2, row_index),
                INSANOS if category == "insanos" else RAPIDOS,
            )
        )
        if status in {"nc", "dnf", "disqualified"}:
            commands.extend(
                [
                    ("BACKGROUND", (0, row_index), (0, row_index), WARNING),
                    ("TEXTCOLOR", (0, row_index), (0, row_index), colors.HexColor("#A53E26")),
                ]
            )
        if int(number(entry.get("position"), 0)) == 1:
            commands.append(("LINEBEFORE", (0, row_index), (0, row_index), 2, NEON))
    table.setStyle(TableStyle(commands))
    return table


def draw_page_chrome(canvas, document, label: str) -> None:
    width, height = PAGE_SIZE
    canvas.saveState()
    canvas.setFillColor(INK)
    canvas.rect(0, height - 21 * mm, width, 21 * mm, fill=1, stroke=0)
    canvas.setFillColor(NEON)
    canvas.rect(0, height - 21 * mm, 7 * mm, 21 * mm, fill=1, stroke=0)
    canvas.setFillColor(PAPER)
    canvas.setFont("Helvetica-Bold", 8.5)
    canvas.drawString(14 * mm, height - 10 * mm, "ULTRAS DO KART / UDK 2026")
    canvas.setFont("Helvetica", 8)
    canvas.drawRightString(width - 14 * mm, height - 10 * mm, "RESULTADO OFICIAL")
    canvas.setStrokeColor(LINE)
    canvas.setLineWidth(0.5)
    canvas.line(14 * mm, 11 * mm, width - 14 * mm, 11 * mm)
    canvas.setFillColor(MUTED)
    canvas.setFont("Helvetica", 7)
    canvas.drawString(14 * mm, 6 * mm, "Classificação geral conjunta - categoria identifica a leitura e não reinicia posição ou pontos.")
    canvas.drawRightString(width - 14 * mm, 6 * mm, f"{label}  /  pagina {document.page}")
    canvas.restoreState()


def build_pdf(result: dict[str, object], entries: list[dict[str, object]], spec: ResultSpec, destination: Path) -> None:
    destination.parent.mkdir(parents=True, exist_ok=True)
    styles = getSampleStyleSheet()
    styles_by_name = {
        "eyebrow": ParagraphStyle(
            "pdf_eyebrow",
            parent=styles["Normal"],
            fontName="Helvetica-Bold",
            fontSize=8,
            leading=10,
            textColor=MUTED,
            spaceAfter=5,
        ),
        "title": ParagraphStyle(
            "pdf_title",
            parent=styles["Title"],
            fontName="Helvetica-Bold",
            fontSize=23,
            leading=25,
            textColor=INK,
            alignment=TA_LEFT,
            spaceAfter=5,
        ),
        "meta": ParagraphStyle(
            "pdf_meta",
            parent=styles["Normal"],
            fontName="Helvetica",
            fontSize=9,
            leading=12,
            textColor=MUTED,
            spaceAfter=7,
        ),
        "note": ParagraphStyle(
            "pdf_note",
            parent=styles["Normal"],
            fontName="Helvetica-Bold",
            fontSize=8.5,
            leading=11,
            textColor=INK,
            borderColor=NEON,
            borderWidth=1,
            borderPadding=7,
            spaceAfter=10,
        ),
        "card_label": ParagraphStyle(
            "pdf_card_label",
            parent=styles["Normal"],
            fontName="Helvetica-Bold",
            fontSize=7,
            leading=8,
            textColor=MUTED,
        ),
        "card_value": ParagraphStyle(
            "pdf_card_value",
            parent=styles["Normal"],
            fontName="Helvetica-Bold",
            fontSize=15,
            leading=17,
            textColor=INK,
        ),
        "table_header": ParagraphStyle(
            "pdf_table_header",
            parent=styles["Normal"],
            fontName="Helvetica-Bold",
            fontSize=7.2,
            leading=8,
            textColor=PAPER,
        ),
        "table_cell": ParagraphStyle(
            "pdf_table_cell",
            parent=styles["Normal"],
            fontName="Helvetica",
            fontSize=7.7,
            leading=9,
            textColor=INK,
        ),
        "table_cell_bold": ParagraphStyle(
            "pdf_table_cell_bold",
            parent=styles["Normal"],
            fontName="Helvetica-Bold",
            fontSize=7.7,
            leading=9,
            textColor=INK,
        ),
        "table_position": ParagraphStyle(
            "pdf_table_position",
            parent=styles["Normal"],
            fontName="Helvetica-Bold",
            fontSize=8,
            leading=9,
            textColor=INK,
            alignment="RIGHT",
        ),
        "table_points": ParagraphStyle(
            "pdf_table_points",
            parent=styles["Normal"],
            fontName="Helvetica-Bold",
            fontSize=8,
            leading=9,
            textColor=INK,
            alignment="RIGHT",
        ),
    }
    classified = sum(text(entry.get("status")).lower() == "classified" for entry in entries)
    non_classified = len(entries) - classified
    fastest_lap = next((entry for entry in entries if entry.get("fastest_lap") is True), None)
    if fastest_lap is None:
        fastest_lap = next((entry for entry in entries if text(entry.get("fastest_lap")).lower() == "true"), None)
    fastest_name = text(fastest_lap.get("driver_name"), "-") if fastest_lap else "-"
    result_date = format_date(result.get("starts_at"))
    track = text(result.get("track"), "Kartodromo Internacional de Betim")
    bonus = "+1 pole / +1 melhor volta / +10 melhor parada" if spec.format == "endurance" else "+1 pole / +1 melhor volta por corrida"
    note = (
        "Regra oficial: tabela aplicada à classificação geral conjunta. "
        f"{bonus}. Pilotos NC permanecem no fim do resultado, sem pontos de posição."
    )
    cards = Table(
        [
            [p("ENTRADAS", styles_by_name["card_label"]), p("CLASSIFICADOS", styles_by_name["card_label"]), p("NC / DNF", styles_by_name["card_label"]), p("MELHOR VOLTA", styles_by_name["card_label"])],
            [p(str(len(entries)), styles_by_name["card_value"]), p(str(classified), styles_by_name["card_value"]), p(str(non_classified), styles_by_name["card_value"]), p(fastest_name, styles_by_name["card_value"])],
        ],
        colWidths=[182, 182, 182, 182],
    )
    cards.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#EEEBE3")),
                ("BOX", (0, 0), (-1, -1), 0.5, LINE),
                ("INNERGRID", (0, 0), (-1, -1), 0.5, LINE),
                ("LEFTPADDING", (0, 0), (-1, -1), 9),
                ("RIGHTPADDING", (0, 0), (-1, -1), 9),
                ("TOPPADDING", (0, 0), (-1, -1), 5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ]
        )
    )
    story = [
        p("RESULTADO HOMOLOGADO", styles_by_name["eyebrow"]),
        p(spec.label, styles_by_name["title"]),
        p(f"{track}  /  {result_date}  /  {text(result.get('session_name'), spec.format.upper())}", styles_by_name["meta"]),
        p(note, styles_by_name["note"]),
        cards,
        Spacer(1, 9),
        build_table(entries, styles_by_name),
    ]
    document = SimpleDocTemplate(
        str(destination),
        pagesize=PAGE_SIZE,
        leftMargin=14 * mm,
        rightMargin=14 * mm,
        topMargin=28 * mm,
        bottomMargin=15 * mm,
        title=f"UDK 2026 - {spec.label}",
        author="Ultras do Kart",
        subject="Resultado oficial geral UDK 2026",
    )
    document.build(
        story,
        onFirstPage=lambda canvas, doc: draw_page_chrome(canvas, doc, spec.label),
        onLaterPages=lambda canvas, doc: draw_page_chrome(canvas, doc, spec.label),
    )


def load_results(base_url: str, anon_key: str) -> dict[ResultSpec, tuple[dict[str, object], list[dict[str, object]]]]:
    results = fetch_json(
        base_url,
        anon_key,
        "public_portal_results",
        {"select": "*", "order": "starts_at.asc,session_name.asc"},
    )
    loaded: dict[ResultSpec, tuple[dict[str, object], list[dict[str, object]]]] = {}
    for spec in RESULTS:
        matches = [result for result in results if text(result.get("title")) == spec.title]
        if len(matches) != 1:
            raise RuntimeError(f"Expected one public result for {spec.title}, found {len(matches)}")
        result = matches[0]
        entries = fetch_json(
            base_url,
            anon_key,
            "public_portal_result_entries",
            {
                "select": "position,driver_name,category,category_slug,laps,total_time_ms,best_lap_ms,points,pole,fastest_lap,best_pit,penalty_ms,penalty_points,status",
                "result_id": f"eq.{text(result.get('id'))}",
                "order": "position.asc",
            },
        )
        if not entries:
            raise RuntimeError(f"No public entries found for {spec.title}")
        positions = [int(number(entry.get("position"), 0)) for entry in entries]
        if positions != sorted(positions) or len(set(positions)) != len(positions):
            raise RuntimeError(f"Global positions are not unique and ordered for {spec.title}")
        loaded[spec] = (result, entries)
    return loaded


def main() -> None:
    parser = argparse.ArgumentParser(description="Gera os PDFs oficiais gerais da temporada UDK 2026.")
    parser.add_argument("--supabase-url", default=os.environ.get("NEXT_PUBLIC_SUPABASE_URL"))
    parser.add_argument("--supabase-anon-key", default=os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY"))
    parser.add_argument("--public-dir", type=Path, default=Path("apps/plataforma/public/resultados"))
    parser.add_argument("--output-dir", type=Path, default=Path("output/pdf"))
    args = parser.parse_args()
    if not args.supabase_url or not args.supabase_anon_key:
        raise SystemExit("NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are required")

    loaded = load_results(args.supabase_url, args.supabase_anon_key)
    for spec in RESULTS:
        result, entries = loaded[spec]
        for directory in (args.public_dir, args.output_dir):
            destination = directory / spec.filename
            build_pdf(result, entries, spec, destination)
            print(f"generated {destination} ({len(entries)} entries)")


if __name__ == "__main__":
    main()
