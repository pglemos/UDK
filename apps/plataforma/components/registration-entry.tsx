"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LoaderCircle } from "lucide-react";
import { registrationDestination } from "../lib/auth-mode";
import { supabase } from "../lib/supabase";

export function RegistrationEntry() {
  const [destination, setDestination] = useState("/login?cadastro=1");
  const [checking, setChecking] = useState(true);

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
    <div className="public-registration">
      <h2>Temporada UDK 2026</h2>
      <p>
        Use uma única conta para escolher categoria, enviar documentos, acompanhar o pagamento e
        consultar a homologação da sua inscrição.
      </p>
      <Link className="public-button" href={destination} aria-disabled={checking}>
        {checking ? <><LoaderCircle className="spin" /> Verificando conta</> : "Iniciar inscrição"}
      </Link>
    </div>
  );
}
