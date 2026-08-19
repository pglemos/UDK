import Link from "next/link";
import { RaceShell } from "../components/race/race-shell";
import { EmptyState } from "../components/race/ui";

export default function NotFound() {
  return (
    <RaceShell>
      <main id="conteudo" tabIndex={-1} className="race-section" style={{ paddingTop: 150 }}>
        <div className="race-container">
          <EmptyState
            eyebrow="Bandeira vermelha"
            title="Página não encontrada"
            description="A rota saiu da pista ou não está mais disponível."
            action={{ href: "/", label: "Voltar para a home" }}
          />
          <p style={{ textAlign: "center", marginTop: 20 }}>
            <Link className="race-text-link" href="/calendario">Consultar calendário</Link>
          </p>
        </div>
      </main>
    </RaceShell>
  );
}
