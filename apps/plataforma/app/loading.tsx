import { OfficialLogo } from "../components/race/official-logo";

export default function Loading() {
  return (
    <main className="race-loading" aria-label="Carregando conteúdo">
      <div className="race-loading-inner">
        <OfficialLogo variant="negative" width={190} priority />
        <div className="race-loading-line" aria-hidden="true"><span /></div>
      </div>
    </main>
  );
}
