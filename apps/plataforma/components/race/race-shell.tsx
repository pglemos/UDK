import Link from "next/link";
import { ArrowUpRight, Camera, MapPin } from "lucide-react";
import { OfficialLogo } from "./official-logo";
import { RaceHeader } from "./race-header";

const footerNavigation = [
  ["/calendario", "Calendário"],
  ["/classificacao", "Classificação"],
  ["/resultados", "Resultados"],
  ["/pilotos", "Pilotos"],
  ["/noticias", "Notícias"],
  ["/regulamento", "Regulamento"],
] as const;

export function RaceShell({
  children,
  showMobileCta = false,
  showFooterCallout = true,
}: {
  children: React.ReactNode;
  showMobileCta?: boolean;
  showFooterCallout?: boolean;
}) {
  return (
    <div className={`race-site udk-site cinema-site${showMobileCta ? "" : " no-mobile-cta"}`}>
      <RaceHeader />
      {children}

      <footer className="udk-footer cinema-footer">
        {showFooterCallout ? (
          <div className="cinema-footer-callout">
            <div className="race-container">
              <span>Temporada 2026</span>
              <h2>Faça parte do próximo grid.</h2>
              <Link className="race-button race-button-primary" href="/inscricao">
                Começar inscrição <ArrowUpRight aria-hidden="true" />
              </Link>
            </div>
          </div>
        ) : null}

        <div className="race-container udk-footer-main">
          <div className="udk-footer-brand">
            <OfficialLogo variant="negative" width={190} />
            <p>
              O campeonato de quem vive o kart. Competição, evolução e respeito no Kartódromo de
              Betim.
            </p>
          </div>

          <div className="udk-footer-column">
            <span>Campeonato</span>
            <nav aria-label="Navegação do rodapé">
              {footerNavigation.map(([href, label]) => (
                <Link href={href} key={href}>
                  {label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="udk-footer-column">
            <span>Plataforma</span>
            <nav aria-label="Acesso à plataforma">
              <Link href="/login">Entrar</Link>
              <Link href="/inscricao">Inscrição</Link>
              <Link href="/painel">Área do piloto</Link>
              <Link href="/patrocinadores">Patrocinadores</Link>
            </nav>
          </div>

          <div className="udk-footer-column udk-footer-contact">
            <span>Nos encontre</span>
            <p>
              <MapPin aria-hidden="true" />
              <span>
                Kartódromo Internacional de Betim
                <br /> Betim, Minas Gerais
              </span>
            </p>
            <a href="https://www.instagram.com/ultrasdokart" target="_blank" rel="noreferrer">
              <Camera aria-hidden="true" /> Instagram oficial
            </a>
          </div>
        </div>

        <div className="race-container udk-footer-bottom">
          <span>© 2026 Ultras do Kart. Todos os direitos reservados.</span>
          <span>UDK • A pista não espera.</span>
        </div>
      </footer>

      {showMobileCta ? (
        <div className="udk-mobile-cta">
          <Link href="/inscricao">
            Começar inscrição <ArrowUpRight aria-hidden="true" size={16} />
          </Link>
          <Link href="/login">Entrar</Link>
        </div>
      ) : null}
    </div>
  );
}
