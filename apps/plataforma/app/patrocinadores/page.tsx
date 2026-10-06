import type { Metadata } from "next";
import Image from "next/image";
import { Reveal } from "../../components/race/motion";
import { RaceShell } from "../../components/race/race-shell";
import { EmptyState, SectionHeading } from "../../components/race/ui";
import { getSponsors } from "../../lib/public-content";
import { fallbackFederations } from "../../lib/public-content-fallbacks";

export const metadata: Metadata = {
  title: "Patrocinadores",
  description: "Marcas parceiras do campeonato Ultras do Kart.",
  alternates: { canonical: "/patrocinadores" },
};

function instagramHandle(url: string): string {
  try {
    const [handle] = new URL(url).pathname.split("/").filter(Boolean);
    return handle ? `@${handle}` : "Instagram";
  } catch {
    return "Instagram";
  }
}

export default async function SponsorsPage() {
  const sponsors = await getSponsors();

  return (
    <RaceShell>
      <main id="conteudo" tabIndex={-1}>
        <section className="race-page-hero race-page-hero-sponsors">
          <div className="race-container">
            <h1>Patrocinadores</h1>
            <p>Parceiros do campeonato Ultras do Kart.</p>
          </div>
        </section>

        <section className="race-section">
          <div className="race-container">
            <Reveal>
              <SectionHeading
                eyebrow="Quem acelera conosco"
                title="Patrocinadores oficiais"
                description="Conheça as marcas que apoiam a temporada 2026."
              />
            </Reveal>

            {sponsors.length ? (
              <div className="race-sponsor-grid">
                {sponsors.map((sponsor, index) => {
                  const content = (
                    <>
                      <div className="race-sponsor-logo" data-sponsor-slug={sponsor.slug}>
                        {sponsor.logoUrl ? (
                          <Image
                            src={sponsor.logoUrl}
                            alt={`Logo ${sponsor.name}`}
                            width={360}
                            height={190}
                            sizes="(max-width: 640px) 80vw, (max-width: 900px) 38vw, 28vw"
                            loading="eager"
                          />
                        ) : (
                          <strong>{sponsor.name.slice(0, 2).toUpperCase()}</strong>
                        )}
                      </div>
                      <h2>{sponsor.name}</h2>
                      <span>{sponsor.tier || "Patrocinador oficial"}</span>
                      {sponsor.websiteUrl ? (
                        <small>{instagramHandle(sponsor.websiteUrl)}</small>
                      ) : null}
                    </>
                  );

                  return (
                    <Reveal key={sponsor.slug} delay={index * 60}>
                      {sponsor.websiteUrl ? (
                        <a
                          className="race-sponsor-card"
                          href={sponsor.websiteUrl}
                          target="_blank"
                          rel="noreferrer"
                          aria-label={`Abrir Instagram de ${sponsor.name}`}
                        >
                          {content}
                        </a>
                      ) : (
                        <article className="race-sponsor-card">{content}</article>
                      )}
                    </Reveal>
                  );
                })}
              </div>
            ) : (
              <EmptyState
                eyebrow="Grid de parceiros"
                title="Espaço reservado às marcas oficiais"
                description="As marcas parceiras aparecerão aqui após a publicação pela organização."
              />
            )}
          </div>
        </section>

        <section className="race-section race-federations" id="federacoes">
          <div className="race-container">
            <Reveal>
              <SectionHeading
                eyebrow="Entidade esportiva"
                title="Federação parceira"
                description="Associação de Kart Amador de Minas Gerais."
              />
            </Reveal>

            <div className="race-federation-grid">
              {fallbackFederations.map((federation) => (
                <a
                  key={federation.slug}
                  className="race-federation-card"
                  href={federation.websiteUrl}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`Abrir Instagram de ${federation.name}`}
                >
                  <div className="race-federation-logo" data-sponsor-slug={federation.slug}>
                    <Image
                      src={federation.logoUrl}
                      alt={`Logo ${federation.name}`}
                      width={360}
                      height={89}
                      sizes="(max-width: 640px) 80vw, 360px"
                      loading="eager"
                    />
                  </div>
                  <h2>{federation.name}</h2>
                  <span>{federation.label}</span>
                  <small>{instagramHandle(federation.websiteUrl)}</small>
                </a>
              ))}
            </div>
          </div>
        </section>
      </main>
    </RaceShell>
  );
}
