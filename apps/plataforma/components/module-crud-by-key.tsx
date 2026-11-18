"use client";

import type { SupabaseClient } from "@supabase/supabase-js";
import { getModuleConfig } from "../lib/module-config";
import type { OfflineQueueOwner } from "../lib/offline-queue";
import { ModuleCrud } from "./module-crud";

/** Carregado sob demanda: traz a configuração dos módulos só quando uma lista genérica abre. */
export function ModuleCrudByKey({
  client,
  owner,
  moduleKey,
  readOnly,
}: {
  client: SupabaseClient;
  owner: OfflineQueueOwner;
  moduleKey: string;
  readOnly: boolean;
}) {
  const config = getModuleConfig(moduleKey);
  if (!config) return null;
  return <ModuleCrud client={client} owner={owner} config={{ ...config, readOnly: config.readOnly || readOnly }} />;
}
