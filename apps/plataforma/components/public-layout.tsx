import Link from "next/link";

const navigation = [
  ["/calendario", "Calendário"],
  ["/classificacao", "Classificação"],
  ["/resultados", "Resultados"],
  ["/pilotos", "Pilotos"],
  ["/regulamento", "Regulamento"],
  ["/noticias", "Notícias"],
] as const;

export function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="public-site">
      <header className="public-header">
        <Link href="/" className="public-brand" aria-label="UDK, página inicial">
          <img src="/udk.svg" alt="UDK" />
        </Link>
        <nav aria-label="Navegação pública">
          {navigation.map(([href, label]) => (
            <Link href={href} key={href}>{label}</Link>
          ))}
        </nav>
        <div className="public-header-actions">
          <Link href="/login" className="public-login-link">Entrar</Link>
          <Link href="/inscricao" className="public-cta">Inscreva-se</Link>
        </div>
      </header>
      {children}
      <footer className="public-footer">
        <img src="/udk.svg" alt="UDK" />
        <p>Ultras do Kart • Kartódromo Internacional de Betim</p>
        <p>Temporada 2026</p>
      </footer>
    </div>
  );
}
