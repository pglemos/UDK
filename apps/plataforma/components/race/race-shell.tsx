import Link from "next/link";
import { Instagram, Youtube } from "lucide-react";
import { OfficialLogo } from "./official-logo";
import { RaceHeader } from "./race-header";
import { ScrollProgress } from "./motion";

export function RaceShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="race-site udk-site">
      <ScrollProgress />
      <RaceHeader />
      {children}
      <footer className="udk-footer">
        <div className="race-container udk-footer-inner">
          <div className="udk-footer-brand">
            <OfficialLogo variant="negative" width={122} />
            <span>© 2026 Ultras do Kart. Todos os direitos reservados.</span>
          </div>
          <div className="udk-footer-social">
            <a href="https://www.instagram.com/ultrasdokart" target="_blank" rel="noreferrer" aria-label="Instagram do UDK">
              <Instagram aria-hidden="true" />
            </a>
            <a href="https://www.youtube.com" target="_blank" rel="noreferrer" aria-label="YouTube do UDK">
              <Youtube aria-hidden="true" />
            </a>
            <Link href="/login">Plataforma oficial</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
