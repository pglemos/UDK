import type { Metadata } from "next";
import { RegistrationEntry } from "../../components/registration-entry";
import { RaceShell } from "../../components/race/race-shell";
import { PageHero } from "../../components/race/ui";

export const metadata: Metadata = {
  title: "Inscrição",
  description: "Inicie sua inscrição na temporada UDK 2026 e acompanhe cada etapa pela plataforma oficial.",
  alternates: { canonical: "/inscricao" },
};

export default function RegistrationPage() {
  return (
    <RaceShell>
      <main id="conteudo" className="tg-registration-page">
        <PageHero
          index="07"
          eyebrow="Seu lugar no grid"
          title="Inscrição"
          description="Uma jornada clara da criação da conta à homologação, sem esconder etapas ou transformar cadastro em labirinto."
        />
        <section className="tg-registration-intro">
          <div className="race-container">
            <span>01 / Comece por aqui</span>
            <h2>O primeiro passo precisa ser simples. A preparação pode ser intensa depois.</h2>
            <p>Escolha sua categoria de interesse e continue dentro da plataforma oficial para completar dados, documentos, termos e pagamento.</p>
          </div>
        </section>
        <section className="tg-registration-shell">
          <div className="race-container"><RegistrationEntry /></div>
        </section>
      </main>
    </RaceShell>
  );
}
