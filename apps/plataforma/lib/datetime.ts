const DEFAULT_TIME_ZONE = "America/Sao_Paulo";

function parseLocalDateTime(value: string): {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
} {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(value);
  if (!match) throw new Error("Data e hora inválidas.");

  const [, year, month, day, hour, minute, second = "00"] = match;
  const parts = {
    year: Number(year),
    month: Number(month),
    day: Number(day),
    hour: Number(hour),
    minute: Number(minute),
    second: Number(second),
  };

  if (
    parts.month < 1 ||
    parts.month > 12 ||
    parts.day < 1 ||
    parts.day > 31 ||
    parts.hour > 23 ||
    parts.minute > 59 ||
    parts.second > 59
  ) {
    throw new Error("Data e hora inválidas.");
  }

  return parts;
}

function zonedParts(date: Date, timeZone: string): Record<string, number> {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);

  return Object.fromEntries(
    parts
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, Number(part.value)]),
  );
}

function timeZoneOffsetMilliseconds(date: Date, timeZone: string): number {
  const parts = zonedParts(date, timeZone);
  const representedAsUtc = Date.UTC(
    parts.year ?? 0,
    (parts.month ?? 1) - 1,
    parts.day ?? 1,
    parts.hour ?? 0,
    parts.minute ?? 0,
    parts.second ?? 0,
  );
  return representedAsUtc - date.getTime();
}

export function dateTimeLocalToIso(value: string, timeZone = DEFAULT_TIME_ZONE): string {
  const parts = parseLocalDateTime(value);
  const wallTimeAsUtc = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second,
  );

  let instant = new Date(wallTimeAsUtc);
  for (let attempt = 0; attempt < 2; attempt += 1) {
    instant = new Date(wallTimeAsUtc - timeZoneOffsetMilliseconds(instant, timeZone));
  }

  const rendered = zonedParts(instant, timeZone);
  if (
    rendered.year !== parts.year ||
    rendered.month !== parts.month ||
    rendered.day !== parts.day ||
    rendered.hour !== parts.hour ||
    rendered.minute !== parts.minute
  ) {
    throw new Error("Data e hora inexistentes no fuso informado.");
  }

  return instant.toISOString();
}

export function isoToDateTimeLocal(value: string, timeZone = DEFAULT_TIME_ZONE): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const parts = zonedParts(date, timeZone);
  const pad = (number: number) => String(number).padStart(2, "0");
  return `${parts.year}-${pad(parts.month ?? 1)}-${pad(parts.day ?? 1)}T${pad(parts.hour ?? 0)}:${pad(parts.minute ?? 0)}`;
}
