import type { Metadata } from "next";
import { PublicLayout } from "../../components/public-layout";
import { PublicPageHero } from "../../components/public-page-hero";
import { getPublicData } from "../../lib/public-data";

export const metadata: Metadata = {
  title: "Calendário",
  description: "Etapas e horários oficiais da temporada UDK 2026.",
  alternates: { canonical: "/calendario" },
};

export default async function CalendarPage() {
  const { stages } = await getPublicData();
  return (
    <PublicLayout>
      <main>
        <PublicPageHero title="Calendário oficial" description="Todas as etapas da temporada 2026." />
        <section className="public-section public-dark">
          <div className="public-schedule">
            {stages.map((stage) => (
              <article key={`${stage.date}-${stage.title}`}>
                <b>{stage.date}</b>
                <div><h3>{stage.title}</h3><p>{stage.track}</p></div>
                <strong>{stage.time}</strong>
              </article>
            ))}
          </div>
        </section>
      </main>
    </PublicLayout>
  );
}
