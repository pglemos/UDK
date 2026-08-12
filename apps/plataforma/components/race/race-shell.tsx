import Link from "next/link";
import { ArrowUpRight, Instagram, MapPin } from "lucide-react";
import { CinematicIntro, CinematicPointer, CinematicRouteCurtain } from "./cinematic-motion";
import { OfficialLogo } from "./official-logo";
import { RaceHeader } from "./race-header";
import { ScrollProgress } from "./motion";

const footerNavigation = [
  ["/calendario", "Calendário"],
  ["/classificacao", "Classificação"],
  ["/resultados", "Resultados"],
  ["/pilotos", "Pilotos"],
  ["/noticias", "Notícias"],
  ["/regulamento", "Regulamento"],
] as const;

export function RaceShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="race-site udk-site cinema-site">
      <CinematicIntro />
      <ScrollProgress />
      <CinematicRouteCurtain />
      <CinematicPointer />
      <RaceHeader />
      {children}

      <footer className="udk-footer cinema-footer">
        <div className="cinema-footer-callout">
          <div className="race-container">
            <span>Temporada 2026</span>
            <h2>O próximo capítulo pode começar com o seu nome.</h2>
            <Link className="race-button race-button-primary" href="/inscricao">
              Começar inscrição <ArrowUpRight aria-hidden="true" />
            </Link>
          </div>
        </div>

        <div className="race-container udk-footer-main">
          <div className="udk-footer-brand">
            <OfficialLogo variant="negative" width={190} />
            <p>
              Competição, evolução e respeito. Um campeonato construído por quem vive o kart no box,
              na pista e depois da bandeirada.
            </p>
          </div>

          <div className="udk-footer-column">
            <span>Campeonato</span>
            <nav aria-label="Navegação do rodapé">
              {footerNavigation.map(([href, label]) => <Link href={href} key={href}>{label}</Link>)}
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
            <span>Onde a pista chama</span>
            <p><MapPin aria-hidden="true" /> Kartódromo Internacional de Betim<br />Betim, Minas Gerais</p>
            <a href="https://www.instagram.com/ultrasdokart" target="_blank" rel="noreferrer">
              <Instagram aria-hidden="true" /> Instagram oficial
            </a>
          </div>
        </div>

        <div className="race-container udk-footer-bottom">
          <span>© 2026 Ultras do Kart. Todos os direitos reservados.</span>
          <span>UDK • A pista não espera.</span>
        </div>
      </footer>

      <div className="udk-mobile-cta">
        <Link href="/inscricao">
          Entrar no grid <ArrowUpRight aria-hidden="true" size={16} />
        </Link>
        <Link href="/login">Entrar</Link>
      </div>
    </div>
  );
}
