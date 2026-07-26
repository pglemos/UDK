import type { Metadata } from "next";
import Link from "next/link";
import { PublicLayout } from "../../components/public-layout";
import { PublicPageHero } from "../../components/public-page-hero";
import { getPublicData } from "../../lib/public-data";

export const metadata: Metadata = {
  title: "Pilotos",
  description: "Diretório público dos pilotos homologados na temporada UDK.",
  alternates: { canonical: "/pilotos" },
};

export default async function DriversPage() {
  const { drivers } = await getPublicData();
  return (
    <PublicLayout>
      <main>
        <PublicPageHero title="Pilotos" description="Conheça quem disputa cada décimo no UDK." />
        <section className="public-section">
          <div className="public-cards">
            {drivers.map((driver) => (
              <Link className="public-card" href={`/pilotos/${driver.slug}`} key={driver.slug}>
                <span className="public-number">#{driver.number}</span>
                <h3>{driver.name}</h3>
                <p>{driver.category}</p>
                <b>{driver.points} pontos</b>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </PublicLayout>
  );
}
