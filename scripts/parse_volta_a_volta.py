#!/usr/bin/env python3
"""Parse the LapTime "volta a volta" PDF used by the UDK results import.

The report prints timing rows on odd pages and the matching speed column on
the following even page.  The parser intentionally keeps the report's kart
assignment as session data and never treats it as a driver's fixed number.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import unicodedata
from collections import Counter, defaultdict
from pathlib import Path

import pdfplumber


TIME = r"(?:\d{1,2}:)?\d{1,2}:\d{2}\.\d{3}"
ROW_RE = re.compile(
    rf"^\s*(\d+)\s+(\d+)\s+({TIME})\s+({TIME})\s+({TIME})(?:\s+({TIME}))?\s*$"
)
SPEED_RE = re.compile(rf"^\s*(?:(?P<elapsed>{TIME})\s+)?(?P<speed>\d+[,.]\d{{2,3}})\s*$")

NAME_TO_SLUG = {
    "agenor-junior": "agenor-jr",
    "alexandre-konovaloff-jannotti": "alexandre-janotti",
    "anderson-silveira": "anderson-silveira",
    "andre-felisberto": "andre-felisberto",
    "arthur-ferreira-duarte-camilo-santos": "arthur-henrique",
    "bernardo-ferreira-duarte-santos": "bernardo",
    "bernardo-thadeu-baya-andrade": "bernardo-thadeu",
    "braulio-cezar-bonoto": "braulio-bonoto",
    "enzo-neves-camara": "enzo-camara",
    "fabio-filho": "fabio-filho",
    "fael-werner": "raphael-werner",
    "fernando-marciel-godoy": "fernando-godoy",
    "flavio-victor-camara": "flavio-camara",
    "francisco-biulchi": "francisco-biuchi",
    "gabriel-nogueira-fernandes": "gabriel-fernandes",
    "gegela": "gegela",
    "guilherme-faria": "guilherme-faria",
    "lucas-godoi": "lucas-godoy",
    "lucas-guimaraes": "lucas-guimaraes",
    "lucas-rabelo": "lucas-rabelo",
    "lucca-micheletti-dambros": "lucca-dambros",
    "marcelo-augusto": "marcelo-augusto",
    "marcelo-henrique-aguiar-marques": "marcelo-marques",
    "marcos-felipe-lomanto": "marcos-felipe",
    "matteo-rinold": "matteo-rinoldi",
    "pablo-fonseca": "pablo-fonseca",
    "pedro-guilherme-lemos-teixeira": "pedro-guilherme",
    "pedro-teles": "pedro-teles",
    "rafael-goncalves-de-morais": "rafael-morais",
    "rafael-soares": "rafael-soares",
    "reinaldo-teles": "reinaldo-teles",
    "renato-de-oliveira-ribeiro": "renato-oliveira",
    "rodrigo-boris": "rodrigo-boris",
    "samael-pereira-da-silva-roque": "samael",
    "saulo-chagas-vieira": "saulo-vieira",
    "rafael-teodoro-santos-de-oliveira": "theodoro",
    "toninho-da-prata-silveira": "toninho-da-prata",
    "vitor-hugo": "vitor-hugo",
    "wesley-almeida-cardoso": "wesley-cardoso",
}

IGNORED_LINE_PARTS = (
    "baterias",
    "ultras",
    "corrida",
    "traçado",
    "data/hora",
    "super kart",
    "diretor de prova",
    "comissário desportivo",
    "cronometragem",
    "kartodromo internacional",
    "betim ltda",
    "página",
    "laptime -",
    "penalidades:",
    "penalizado em",
    "adv:",
)


def normalize_key(value: str) -> str:
    value = re.sub(r"\s*-\s*I\s*$", "", value.strip(), flags=re.IGNORECASE)
    value = unicodedata.normalize("NFKD", value)
    value = value.encode("ascii", "ignore").decode("ascii")
    return re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")


def parse_time(value: str) -> int:
    parts = value.split(":")
    if len(parts) == 3:
        hours, minutes, seconds = parts
        minutes = int(hours) * 60 + int(minutes)
    else:
        minutes, seconds = parts
        minutes = int(minutes)
    whole, millis = seconds.split(".")
    return minutes * 60_000 + int(whole) * 1_000 + int(millis)


def parse_speed(value: str) -> float:
    return float(value.replace(",", "."))


def is_name_line(line: str) -> bool:
    stripped = line.strip()
    if not stripped or ROW_RE.match(stripped) or SPEED_RE.match(stripped):
        return False
    if stripped.startswith("#") or not re.search(r"[A-Za-zÀ-ÿ]", stripped):
        return False
    lowered = stripped.lower()
    return not any(part in lowered for part in IGNORED_LINE_PARTS)


def parse_report(source: Path) -> dict:
    source_hash = hashlib.sha256(source.read_bytes()).hexdigest()
    rows: list[dict] = []
    page_diagnostics: list[dict] = []
    current_driver: dict | None = None

    with pdfplumber.open(source) as pdf:
        if len(pdf.pages) % 2:
            raise ValueError(f"expected an even number of pages, got {len(pdf.pages)}")

        for page_index in range(0, len(pdf.pages), 2):
            odd_page_number = page_index + 1
            even_page_number = page_index + 2
            odd_lines = (pdf.pages[page_index].extract_text(x_tolerance=1, y_tolerance=3) or "").splitlines()
            even_lines = (pdf.pages[page_index + 1].extract_text(x_tolerance=1, y_tolerance=3) or "").splitlines()
            page_rows: list[dict] = []

            for line in odd_lines:
                match = ROW_RE.match(line.strip())
                if match:
                    if current_driver is None:
                        raise ValueError(f"row without driver on page {odd_page_number}: {line}")
                    kart, lap_number, lap_time, dmv, dlcat, elapsed = match.groups()
                    page_rows.append(
                        {
                            "driver": current_driver["name"],
                            "driver_slug": current_driver["slug"],
                            "kart_number": int(kart),
                            "lap_number": int(lap_number),
                            "lap_time_ms": parse_time(lap_time),
                            "elapsed_time_ms": parse_time(elapsed) if elapsed else None,
                            "dmv_ms": parse_time(dmv),
                            "dlcat_ms": parse_time(dlcat),
                            "speed_kph": None,
                            "source_page": odd_page_number,
                        }
                    )
                    continue

                if is_name_line(line):
                    name = re.sub(r"\s*-\s*I\s*$", "", line.strip(), flags=re.IGNORECASE)
                    key = normalize_key(name)
                    slug = NAME_TO_SLUG.get(key)
                    if slug is None:
                        raise ValueError(f"unmapped driver {name!r} (key={key!r}) on page {odd_page_number}")
                    current_driver = {"name": name, "slug": slug}

            speed_rows: list[dict] = []
            for line in even_lines:
                match = SPEED_RE.match(line.strip())
                if match:
                    speed_rows.append(
                        {
                            "elapsed_time_ms": parse_time(match.group("elapsed"))
                            if match.group("elapsed")
                            else None,
                            "speed_kph": parse_speed(match.group("speed")),
                        }
                    )

            if len(page_rows) != len(speed_rows):
                raise ValueError(
                    f"page pair {odd_page_number}/{even_page_number} has "
                    f"{len(page_rows)} timing rows and {len(speed_rows)} speed rows"
                )

            elapsed_recovered = 0
            elapsed_mismatches = 0
            for row, speed in zip(page_rows, speed_rows):
                if row["elapsed_time_ms"] is None:
                    row["elapsed_time_ms"] = speed["elapsed_time_ms"]
                    elapsed_recovered += 1
                elif speed["elapsed_time_ms"] is not None and row["elapsed_time_ms"] != speed["elapsed_time_ms"]:
                    elapsed_mismatches += 1
                if row["elapsed_time_ms"] is None:
                    raise ValueError(f"missing elapsed time on page pair {odd_page_number}/{even_page_number}")
                row["speed_kph"] = speed["speed_kph"]
                rows.append(row)

            page_diagnostics.append(
                {
                    "odd_page": odd_page_number,
                    "even_page": even_page_number,
                    "rows": len(page_rows),
                    "elapsed_recovered": elapsed_recovered,
                    "elapsed_mismatches": elapsed_mismatches,
                }
            )

    by_driver: dict[str, list[dict]] = defaultdict(list)
    for row in rows:
        by_driver[row["driver_slug"]].append(row)

    drivers = []
    for slug, driver_rows in sorted(by_driver.items()):
        karts = sorted({row["kart_number"] for row in driver_rows})
        laps = [row["lap_number"] for row in driver_rows]
        if len(karts) != 1:
            raise ValueError(f"driver {slug} changed karts in report: {karts}")
        if laps != list(range(1, len(laps) + 1)):
            raise ValueError(f"driver {slug} has non-contiguous laps: {laps[:5]}...{laps[-5:]}")
        drivers.append(
            {
                "slug": slug,
                "report_name": driver_rows[0]["driver"],
                "kart_number": karts[0],
                "laps": len(driver_rows),
                "first_page": min(row["source_page"] for row in driver_rows),
                "last_page": max(row["source_page"] for row in driver_rows),
            }
        )

    return {
        "source": {
            "filename": source.name,
            "sha256": source_hash,
            "pages": len(page_diagnostics) * 2,
            "page_pairs": len(page_diagnostics),
        },
        "summary": {
            "drivers": len(drivers),
            "laps": len(rows),
            "elapsed_recovered": sum(page["elapsed_recovered"] for page in page_diagnostics),
            "elapsed_mismatches": sum(page["elapsed_mismatches"] for page in page_diagnostics),
            "karts": len({row["kart_number"] for row in rows}),
            "lap_counts": Counter(row["driver_slug"] for row in rows),
        },
        "drivers": drivers,
        "rows": rows,
        "page_diagnostics": page_diagnostics,
    }


def sql_string(value: str) -> str:
    return "'" + value.replace("'", "''") + "'"


def generate_migration(parsed: dict, migration_path: Path) -> None:
    source = parsed["source"]
    rows = parsed["rows"]
    driver_values = ",\n".join(
        f"    ({sql_string(driver['slug'])}, {driver['kart_number']})" for driver in parsed["drivers"]
    )
    lap_values = ",\n".join(
        "    ("
        + ", ".join(
            [
                sql_string(row["driver_slug"]),
                str(row["lap_number"]),
                str(row["lap_time_ms"]),
                str(row["elapsed_time_ms"]),
                f"{row['speed_kph']:.3f}",
            ]
        )
        + ")"
        for row in rows
    )
    migration = f"""-- Importa o relatorio oficial de voltas individuais da etapa de 18/08/2026.
-- Fonte: {source['filename']} (SHA-256: {source['sha256']}).
-- O kart e uma atribuicao da sessao; o numero fixo do piloto permanece nulo.

alter table public.laps
  add column if not exists elapsed_time_ms bigint;

alter table public.laps
  drop constraint if exists laps_elapsed_time_valid_check;

alter table public.laps
  add constraint laps_elapsed_time_valid_check
  check (elapsed_time_ms is null or elapsed_time_ms > 0);

comment on column public.laps.elapsed_time_ms is
  'Tempo acumulado da volta no relatorio LapTime, em milissegundos.';

with scope as (
  select stage.id as stage_id
  from public.stages stage
  join public.seasons season on season.id = stage.season_id
  join public.championships championship on championship.id = season.championship_id
  where championship.slug = 'udk'
    and season.year = 2026
    and (stage.starts_at at time zone 'America/Sao_Paulo')::date = date '2026-08-18'
), inserted as (
  insert into public.import_batches (
    stage_id, source, original_filename, content_hash, status, confidence, diagnostics
  )
  select
    scope.stage_id,
    'laptime',
    {sql_string(source['filename'])},
    {sql_string(source['sha256'])},
    'imported',
    100,
    jsonb_build_object(
      'pages', {source['pages']},
      'page_pairs', {source['page_pairs']},
      'drivers', {parsed['summary']['drivers']},
      'laps', {parsed['summary']['laps']},
      'elapsed_recovered', {parsed['summary']['elapsed_recovered']},
      'elapsed_mismatches', {parsed['summary']['elapsed_mismatches']},
      'karts', {parsed['summary']['karts']},
      'result_external_ids', jsonb_build_array(2026081801, 2026081802)
    )
  from scope
  where not exists (
    select 1 from public.import_batches existing
    where existing.content_hash = {sql_string(source['sha256'])}
      and existing.deleted_at is null
  )
  returning id
)
select count(*) from inserted;

with kart(driver_slug, kart_number) as (
  values
{driver_values}
), scope as (
  select result.id as result_id, entry.id as result_entry_id, driver.id as driver_id, driver.slug
  from public.results result
  join public.result_entries entry on entry.result_id = result.id and entry.deleted_at is null
  join public.drivers driver on driver.id = entry.driver_id and driver.deleted_at is null
  where result.source_system = 'laptime'
    and result.external_racing_id in (2026081801, 2026081802)
    and result.deleted_at is null
)
update public.result_entries entry
set kart_number = kart.kart_number
from scope
join kart on kart.driver_slug = scope.slug
where entry.id = scope.result_entry_id;

with source_rows(driver_slug, lap_number, lap_time_ms, elapsed_time_ms, speed_kph) as (
  values
{lap_values}
), scope as (
  select result.id as result_id, entry.id as result_entry_id, driver.id as driver_id, driver.slug
  from public.results result
  join public.result_entries entry on entry.result_id = result.id and entry.deleted_at is null
  join public.drivers driver on driver.id = entry.driver_id and driver.deleted_at is null
  where result.source_system = 'laptime'
    and result.external_racing_id in (2026081801, 2026081802)
    and result.deleted_at is null
)
insert into public.laps (
  result_id, result_entry_id, driver_id, lap_number, lap_time_ms, elapsed_time_ms, speed_kph,
  position, valid, invalid_reason
)
select
  scope.result_id,
  scope.result_entry_id,
  scope.driver_id,
  source_rows.lap_number,
  source_rows.lap_time_ms,
  source_rows.elapsed_time_ms,
  source_rows.speed_kph,
  null,
  true,
  null
from source_rows
join scope on scope.slug = source_rows.driver_slug
on conflict (result_entry_id, lap_number) where deleted_at is null
do update set
  result_id = excluded.result_id,
  driver_id = excluded.driver_id,
  lap_time_ms = excluded.lap_time_ms,
  elapsed_time_ms = excluded.elapsed_time_ms,
  speed_kph = excluded.speed_kph,
  position = excluded.position,
  valid = excluded.valid,
  invalid_reason = excluded.invalid_reason;

create or replace view public.public_portal_laps
with (security_invoker = true)
as
select
  lap.id,
  lap.result_id,
  lap.result_entry_id,
  lap.driver_id,
  driver.slug as driver_slug,
  driver.sport_name as driver_name,
  result.title as result_title,
  stage.title as stage_title,
  lap.lap_number,
  lap.lap_time_ms,
  lap.elapsed_time_ms,
  lap.speed_kph,
  lap.position,
  lap.valid,
  lap.invalid_reason
from public.laps lap
join public.result_entries entry
  on entry.id = lap.result_entry_id
 and entry.result_id = lap.result_id
 and entry.driver_id = lap.driver_id
 and entry.deleted_at is null
join public.results result
  on result.id = lap.result_id
 and result.deleted_at is null
 and result.status = any (array['provisional'::text, 'homologated'::text, 'published'::text, 'rectified'::text])
join public.drivers driver
  on driver.id = lap.driver_id
 and driver.deleted_at is null
 and driver.public_profile
join public.stages stage
  on stage.id = result.stage_id
 and stage.deleted_at is null
where lap.deleted_at is null;

grant select on public.public_portal_laps to anon, authenticated;
"""
    migration_path.write_text(migration, encoding="utf-8")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("source", type=Path)
    parser.add_argument("--json-output", type=Path)
    parser.add_argument("--migration-output", type=Path)
    args = parser.parse_args()
    parsed = parse_report(args.source)
    if args.json_output:
        args.json_output.parent.mkdir(parents=True, exist_ok=True)
        args.json_output.write_text(json.dumps(parsed, ensure_ascii=False, indent=2), encoding="utf-8")
    if args.migration_output:
        args.migration_output.parent.mkdir(parents=True, exist_ok=True)
        generate_migration(parsed, args.migration_output)
    print(json.dumps(parsed["summary"], ensure_ascii=False, sort_keys=True))
    for driver in parsed["drivers"]:
        print(
            f"{driver['slug']}\t{driver['laps']}\tkart={driver['kart_number']}\t"
            f"pages={driver['first_page']}-{driver['last_page']}"
        )


if __name__ == "__main__":
    main()
