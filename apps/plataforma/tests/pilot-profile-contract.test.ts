import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { getModuleConfig } from "../lib/module-config";

const root = path.resolve(import.meta.dirname, "..");

function read(file: string): string {
  return fs.readFileSync(path.join(root, file), "utf8");
}

describe("cadastro operacional de pilotos", () => {
  it("não expõe número e inclui os dados exigidos pela organização", () => {
    const pilot = getModuleConfig("pilotos");
    expect(pilot).toBeDefined();

    const keys = pilot?.fields.map((field) => field.key) ?? [];
    expect(keys).not.toContain("number");
    expect(keys).toEqual(
      expect.arrayContaining([
        "avatar_url",
        "whatsapp",
        "cpf",
        "birth_date",
        "age",
        "email",
        "city",
        "state",
        "weight_kg",
        "height_cm",
        "gender",
        "emergency_contact_name",
        "emergency_contact_phone",
        "medical_restrictions",
        "allergies",
        "medications",
        "operational_notes",
        "contact_authorized",
        "regulation_acknowledged",
        "participation_acknowledged",
        "image_authorized",
      ]),
    );
  });

  it("integra a tela especializada e mantém o conteúdo em português", () => {
    const page = read("app/painel/[[...slug]]/page.tsx");
    const component = read("components/pilot-crud.tsx");

    expect(page).toContain("PilotCrud");
    expect(page).toContain("readOnly={!canMutate}");
    expect(component).toContain("Dados do piloto");
    expect(component).toContain("Autorizo o uso de imagem");
    expect(component).not.toContain("P1 Academy");
  });

  it("não exibe número de piloto nem rótulos em inglês nas superfícies relacionadas", () => {
    const publicSources = [
      read("app/page.tsx"),
      read("app/pilotos/page.tsx"),
      read("app/pilotos/[slug]/page.tsx"),
      read("app/classificacao/page.tsx"),
      read("app/resultados/page.tsx"),
      read("components/race/editorial-primitives.tsx"),
      read("components/race/ui.tsx"),
    ].join("\n");

    expect(publicSources).not.toMatch(/#\{driver\.number\}|#\{entry\.driverNumber\}/);
    expect(publicSources).not.toContain("Explore");
    expect(publicSources).not.toContain(">Poles<");
    expect(publicSources).toContain("Largadas na pole");
  });

  it("torna o número legado opcional no banco e preserva o sorteio por sessão", () => {
    const migration = fs.readFileSync(
      path.join(
        root,
        "../../supabase/migrations/20260818100000_pilot_profile_operational_fields.sql",
      ),
      "utf8",
    );

    expect(migration).toContain("alter column number drop not null");
    expect(migration).toContain("result_entries.kart_number");
    expect(migration).toContain("contact_authorized");
    expect(migration).toContain("weight_kg");
    expect(migration).toContain("state");
  });
});
