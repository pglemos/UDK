import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PublicLayout } from "../../../components/public-layout";
import { PublicPageHero } from "../../../components/public-page-hero";
import { getPublicData } from "../../../lib/public-data";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const { drivers } = await getPublicData();
  const driver = drivers.find((item) => item.slug === slug);
  if (!driver) return { title: "Piloto não encontrado" };
  return {
    title: driver.name,
    description: `Perfil esportivo de ${driver.name} na temporada UDK 2026.`,
    alternates: { canonical: `/pilotos/${driver.slug}` },
  };
}

export default async function DriverProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { drivers } = await getPublicData();
  const driver = drivers.find((item) => item.slug === slug);
  if (!driver) notFound();

  return (
    <PublicLayout>
      <main>
        <PublicPageHero eyebrow={`#${driver.number} • ${driver.category}`} title={driver.name} description="Perfil esportivo oficial da temporada 2026." />
        <section className="public-section">
          <div className="public-profile-grid">
            <div className="public-metric"><b>{driver.points}</b><span>Pontos</span></div>
            <div className="public-metric"><b>{driver.wins}</b><span>Vitórias</span></div>
            <div className="public-metric"><b>{driver.podiums}</b><span>Pódios</span></div>
            <div className="public-metric"><b>2026</b><span>Temporada</span></div>
          </div>
        </section>
      </main>
    </PublicLayout>
  );
}
