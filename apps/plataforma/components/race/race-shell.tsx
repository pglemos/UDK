import Link from "next/link";
import { ArrowUpRight, Instagram } from "lucide-react";
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
    <div className="race-site udk-site">
      <ScrollProgress />
      <RaceHeader />
      {children}
      <footer className="udk-footer">
        <div className="race-container udk-footer-main">
          <div className="udk-footer-brand">
            <OfficialLogo variant="negative" width={158} />
            <p>
              Campeonato de kart construído sobre evolução, respeito e disputa limpa. Cada etapa conta; cada volta deixa marca.
            </p>
            <Link className="race-button race-button-primary" href="/inscricao">
              Entrar no grid <ArrowUpRight aria-hidden="true" />
            </Link>
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
            <span>Acompanhe</span>
            <div className="udk-footer-social">
              <a href="https://www.instagram.com/ultrasdokart" target="_blank" rel="noreferrer" aria-label="Instagram oficial do UDK">
                <Instagram aria-hidden="true" /> Instagram oficial
              </a>
            </div>
            <p>Kartódromo Internacional de Betim<br />Betim, Minas Gerais</p>
          </div>
        </div>

        <div className="race-container udk-footer-bottom">
          <span>© 2026 Ultras do Kart. Todos os direitos reservados.</span>
          <span>UDK • Temporada 2026</span>
        </div>
      </footer>
    </div>
  );
}
