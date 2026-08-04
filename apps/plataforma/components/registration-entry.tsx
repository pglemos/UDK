"use client";

import Link from "next/link";
import { CheckCircle2, ChevronRight, LoaderCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { registrationDestination } from "../lib/auth-mode";
import { supabase } from "../lib/supabase";

const steps = [
  ["01", "Conta"],
  ["02", "Perfil"],
  ["03", "Categoria"],
  ["04", "Documentos"],
  ["05", "Termos"],
  ["06", "Confirmação"],
] as const;

export function RegistrationEntry() {
  const [destination, setDestination] = useState("/login?cadastro=1");
  const [checking, setChecking] = useState(true);
  const [category, setCategory] = useState<"insanos" | "rapidos">("insanos");

  useEffect(() => {
    const client = supabase();
    if (!client) {
      setChecking(false);
      return;
    }

    let active = true;
    void client.auth.getSession().then(({ data }) => {
      if (!active) return;
      setDestination(registrationDestination(Boolean(data.session)));
      setChecking(false);
    });

    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="race-registration cinema-registration">
      <section className="race-registration-main">
        <div className="race-stepper" aria-label="Seis etapas da inscrição">
          {steps.map(([number, label], index) => (
            <span className={`race-step${index === 0 ? " is-active" : ""}`} key={number}>
              <b>{number}</b>
              {label}
            </span>
          ))}
        </div>

        <div className="race-registration-copy">
          <span className="race-kicker">Etapa 01 de 06</span>
          <h2>Prepare sua entrada no grid</h2>
          <p>
            Escolha a categoria de interesse e avance para a plataforma oficial. Perfil, documentos,
            termos e confirmação ficam vinculados ao mesmo protocolo para evitar aquele ritual humano
            de preencher a mesma informação em oito telas diferentes.
          </p>
        </div>

        <div className="race-category-choice" role="group" aria-label="Categoria de interesse">
          <button
            className={category === "insanos" ? "is-selected" : ""}
            type="button"
            aria-pressed={category === "insanos"}
            onClick={() => setCategory("insanos")}
          >
            <strong>Ultras Insanos</strong>
            <span>Categoria para quem está entrando no campeonato e quer evoluir em um grid equilibrado.</span>
          </button>
          <button
            className={category === "rapidos" ? "is-selected" : ""}
            type="button"
            aria-pressed={category === "rapidos"}
            onClick={() => setCategory("rapidos")}
          >
            <strong>Ultras Rápidos</strong>
            <span>Categoria de maior ritmo, voltada a pilotos com experiência e desempenho consolidado.</span>
          </button>
        </div>

        <div className="race-alert race-alert-warning">
          A categoria escolhida nesta tela é uma intenção inicial. A homologação continua obedecendo
          aos critérios esportivos e ao regulamento vigente.
        </div>

        <div className="race-registration-actions">
          <Link className="race-button race-button-ghost" href="/regulamento">
            Ler regulamento
          </Link>
          <Link
            className="race-button race-button-primary"
            href={`${destination}${destination.includes("?") ? "&" : "?"}categoria=${category}`}
            aria-disabled={checking}
          >
            {checking ? (
              <>
                <LoaderCircle className="spin" aria-hidden="true" />
                Verificando conta
              </>
            ) : (
              <>
                Continuar inscrição <ChevronRight aria-hidden="true" />
              </>
            )}
          </Link>
        </div>
      </section>

      <aside className="race-registration-summary">
        <span className="race-kicker">Resumo em tempo real</span>
        <h2>Temporada 2026</h2>
        <div className="race-summary-list">
          <div><span>Campeonato</span><b>Ultras do Kart</b></div>
          <div><span>Categoria de interesse</span><b>{category === "insanos" ? "Ultras Insanos" : "Ultras Rápidos"}</b></div>
          <div><span>Local</span><b>Kartódromo de Betim</b></div>
          <div><span>Progresso</span><b>Etapa 01 de 06</b></div>
        </div>
        <div className="race-auth-features">
          <span><CheckCircle2 aria-hidden="true" /> Progresso salvo</span>
          <span><CheckCircle2 aria-hidden="true" /> Protocolo individual</span>
          <span><CheckCircle2 aria-hidden="true" /> Acompanhamento online</span>
        </div>
      </aside>
    </div>
  );
}
