import type { Metadata } from "next";
import { PublicLayout } from "../../components/public-layout";
import { PublicPageHero } from "../../components/public-page-hero";
import { RegistrationEntry } from "../../components/registration-entry";

export const metadata: Metadata = {
  title: "Inscrição",
  description: "Inicie sua inscrição na temporada UDK 2026.",
  alternates: { canonical: "/inscricao" },
};

export default function RegistrationPage() {
  return (
    <PublicLayout>
      <main>
        <PublicPageHero title="Inscrições" description="Seu lugar no grid começa com uma conta única e um processo auditável." />
        <section className="public-section">
          <RegistrationEntry />
        </section>
      </main>
    </PublicLayout>
  );
}
