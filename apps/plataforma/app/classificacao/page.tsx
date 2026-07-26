import type { Metadata } from "next";
import Link from "next/link";
import { PublicLayout } from "../../components/public-layout";
import { PublicPageHero } from "../../components/public-page-hero";
import { getPublicData } from "../../lib/public-data";

export const metadata: Metadata = {
  title: "Classificação",
  description: "Classificação oficial, pontos, vitórias e pódios da temporada UDK.",
  alternates: { canonical: "/classificacao" },
};

export default async function StandingsPage() {
  const { drivers } = await getPublicData();
  return (
    <PublicLayout>
      <main>
        <PublicPageHero title="Classificação" description="Pontos, vitórias, pódios e posições oficiais." />
        <section className="public-section">
          <div className="public-table-wrap">
            <table className="public-table">
              <thead><tr><th>Pos.</th><th>Piloto</th><th>Categoria</th><th>Vitórias</th><th>Pódios</th><th>Pontos</th></tr></thead>
              <tbody>
                {drivers.map((driver, index) => (
                  <tr key={driver.slug}>
                    <td>{String(index + 1).padStart(2, "0")}</td>
                    <td><Link href={`/pilotos/${driver.slug}`}>#{driver.number} {driver.name}</Link></td>
                    <td>{driver.category}</td>
                    <td>{driver.wins}</td>
                    <td>{driver.podiums}</td>
                    <td><b>{driver.points}</b></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </PublicLayout>
  );
}
