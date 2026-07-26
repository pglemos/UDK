import type { Metadata } from "next";
import { RaceShell } from "../../components/race/race-shell";
import { PageHero } from "../../components/race/ui";
import { RegistrationEntry } from "../../components/registration-entry";

export const metadata: Metadata = {
  title: "Inscrição",
  description: "Inicie sua inscrição na temporada UDK 2026 e acompanhe cada etapa pela plataforma oficial.",
  alternates: { canonical: "/inscricao" },
};

export default function RegistrationPage() {
  return (
    <RaceShell>
      <main id="conteudo">
        <PageHero
          eyebrow="Seu lugar no grid"
          title="Inscrição"
          description="Uma jornada clara para criar a conta, escolher a categoria, enviar documentos, aceitar os termos e acompanhar a homologação."
        />
        <section className="race-section">
          <div className="race-container">
            <RegistrationEntry />
          </div>
        </section>
      </main>
    </RaceShell>
  );
}
