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
          <h2>Qual é sua categoria?</h2>
          <p>Depois da escolha, entre ou crie uma conta para completar a inscrição.</p>
        </div>

        <div className="race-category-choice" role="group" aria-label="Categoria de interesse">
          <button
            className={category === "insanos" ? "is-selected" : ""}
            type="button"
            aria-pressed={category === "insanos"}
            onClick={() => setCategory("insanos")}
          >
            <strong>Ultras Insanos</strong>
            <span>Para pilotos que estão começando no campeonato.</span>
          </button>
          <button
            className={category === "rapidos" ? "is-selected" : ""}
            type="button"
            aria-pressed={category === "rapidos"}
            onClick={() => setCategory("rapidos")}
          >
            <strong>Ultras Rápidos</strong>
            <span>Para pilotos com experiência e desempenho consolidado.</span>
          </button>
        </div>

        <div className="race-alert race-alert-warning">
          A organização confirma a categoria conforme os critérios do regulamento.
        </div>

        <div className="race-registration-actions">
          <Link className="race-button race-button-ghost" href="/regulamento">
            Ler regulamento
          </Link>
          <Link
            className="race-button race-button-primary"
            href={`${destination}${destination.includes("?") ? "&" : "?"}categoria=${category}`}
            aria-disabled={checking || undefined}
            tabIndex={checking ? -1 : undefined}
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
        <h2>Temporada 2026</h2>
        <div className="race-summary-list">
          <div>
            <span>Campeonato</span>
            <b>Ultras do Kart</b>
          </div>
          <div>
            <span>Categoria de interesse</span>
            <b>{category === "insanos" ? "Ultras Insanos" : "Ultras Rápidos"}</b>
          </div>
          <div>
            <span>Local</span>
            <b>Kartódromo de Betim</b>
          </div>
          <div>
            <span>Progresso</span>
            <b>Etapa 01 de 06</b>
          </div>
        </div>
        <div className="race-auth-features">
          <span>
            <CheckCircle2 aria-hidden="true" /> Progresso salvo
          </span>
          <span>
            <CheckCircle2 aria-hidden="true" /> Protocolo individual
          </span>
          <span>
            <CheckCircle2 aria-hidden="true" /> Acompanhamento online
          </span>
        </div>
      </aside>
    </div>
  );
}
