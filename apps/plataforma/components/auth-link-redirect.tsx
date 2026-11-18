"use client";

import { useEffect } from "react";

/**
 * Links de convite e de nova senha do Supabase podem cair em qualquer página
 * (por exemplo, a home). Leva o visitante direto para a tela de criar senha,
 * preservando o token que vem no endereço.
 */
export function AuthLinkRedirect() {
  useEffect(() => {
    const { hash, pathname, search } = window.location;
    const params = new URLSearchParams(search);
    const fromHash = hash.includes("access_token") && /type=(invite|recovery)/.test(hash);
    const fromCode = params.has("code") && /^(invite|recovery)$/.test(params.get("type") ?? "");
    if ((fromHash || fromCode) && pathname !== "/nova-senha") {
      window.location.replace(`/nova-senha${search}${hash}`);
    }
  }, []);
  return null;
}
