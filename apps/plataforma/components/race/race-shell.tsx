import Link from "next/link";
import { Instagram, Youtube } from "lucide-react";
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
    <div className="race-site">
      <ScrollProgress />
      <RaceHeader />
      {children}
      <footer className="race-footer">
        <div className="race-footer-main">
          <div className="race-footer-brand">
            <OfficialLogo variant="negative" width={190} />
            <p>
              Campeonato de kart com intensidade, evolução, respeito e disputa limpa.
              Betim, Minas Gerais.
            </p>
          </div>
          <div>
            <span className="race-footer-label">Campeonato</span>
            <nav aria-label="Navegação do rodapé">
              {footerNavigation.map(([href, label]) => (
                <Link href={href} key={href}>{label}</Link>
              ))}
            </nav>
          </div>
          <div>
            <span className="race-footer-label">Acompanhe</span>
            <div className="race-social-links">
              <a href="https://www.instagram.com/ultrasdokart" target="_blank" rel="noreferrer">
                <Instagram aria-hidden="true" /> Instagram
              </a>
              <a href="https://www.youtube.com" target="_blank" rel="noreferrer">
                <Youtube aria-hidden="true" /> YouTube
              </a>
            </div>
          </div>
        </div>
        <div className="race-footer-bottom">
          <span>© 2026 Ultras do Kart</span>
          <span>Temporada 2026</span>
          <Link href="/login">Plataforma oficial</Link>
        </div>
      </footer>
    </div>
  );
}
