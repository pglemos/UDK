import type { Metadata } from "next";
import { RegistrationEntry } from "../../components/registration-entry";
import { RaceShell } from "../../components/race/race-shell";
import { PageHero } from "../../components/race/ui";

export const metadata: Metadata = {
  title: "Inscrição",
  description:
    "Inicie sua inscrição na temporada UDK 2026 e acompanhe cada etapa pela plataforma oficial.",
  alternates: { canonical: "/inscricao" },
};

export default function RegistrationPage() {
  return (
    <RaceShell>
      <main id="conteudo" tabIndex={-1} className="tg-registration-page">
        <PageHero
          index="07"
          eyebrow="Seu lugar no grid"
          title="Inscrição"
          description="Escolha sua categoria e comece sua inscrição na temporada 2026."
        />
        <section className="tg-registration-intro">
          <div className="race-container">
            <h2>Escolha sua categoria</h2>
            <p>
              Escolha sua categoria de interesse e continue dentro da plataforma oficial para
              completar dados, documentos, termos e pagamento.
            </p>
          </div>
        </section>
        <section className="tg-registration-shell">
          <div className="race-container">
            <RegistrationEntry />
          </div>
        </section>
      </main>
    </RaceShell>
  );
}
