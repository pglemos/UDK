import Link from "next/link";
import { ArrowUpRight, Instagram, MapPin } from "lucide-react";
import { PointerHalo, RouteCurtain } from "./editorial-motion";
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
    <div className="race-site udk-site tg-site">
      <ScrollProgress />
      <RouteCurtain />
      <PointerHalo />
      <RaceHeader />
      {children}
      <footer className="udk-footer tg-footer">
        <div className="tg-footer-callout">
          <div className="race-container">
            <span>Temporada 2026</span>
            <h2>Seu nome pode ser o próximo no grid.</h2>
            <Link className="race-button race-button-primary" href="/inscricao">
              Começar inscrição <ArrowUpRight aria-hidden="true" />
            </Link>
          </div>
        </div>

        <div className="race-container udk-footer-main">
          <div className="udk-footer-brand">
            <OfficialLogo variant="negative" width={180} />
            <p>Competição, evolução e respeito. Um campeonato feito por quem vive o kart além do cronômetro.</p>
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
          <span>© 2026 Ultras do Kart.</span>
          <span>UDK • A pista não espera.</span>
        </div>
      </footer>
    </div>
  );
}
