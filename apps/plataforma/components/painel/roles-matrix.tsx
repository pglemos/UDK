"use client";

import { Check, Eye, Minus } from "lucide-react";
import {
  panelSections,
  roleAccess,
  roleDescriptions,
  roleLabels,
  roleOrder,
  writableModulesByRole,
  type Role,
} from "../../lib/painel-structure";

type Level = "edit" | "view" | "none";

function levelOf(role: Role, module: string): Level {
  if (writableModulesByRole[role].includes(module)) return "edit";
  if (roleAccess[role].includes(module)) return "view";
  return "none";
}

const levelText: Record<Level, string> = { edit: "Edita", view: "Vê", none: "Sem acesso" };

export function RolesMatrix() {
  const sections = panelSections.filter((section) => section.key !== "inicio");
  return (
    <div className="pv-workspace">
      <p className="pv-lede">
        O que cada papel vê e edita em cada área. Para liberar ou bloquear algo só para uma pessoa, use uma exceção em Pessoas.
        Pilotos e responsáveis só enxergam os próprios dados.
      </p>

      <ul className="pv-role-cards">
        {roleOrder.map((role) => (
          <li key={role}>
            <b>{roleLabels[role]}</b>
            <span>{roleDescriptions[role]}</span>
          </li>
        ))}
      </ul>

      <section className="data-card">
        <div className="data-card-head">
          <ul className="pv-legend" aria-label="Legenda">
            <li><span className="pv-level is-edit"><Check aria-hidden="true" /></span> Edita</li>
            <li><span className="pv-level is-view"><Eye aria-hidden="true" /></span> Só vê</li>
            <li><span className="pv-level is-none"><Minus aria-hidden="true" /></span> Sem acesso</li>
          </ul>
        </div>
        <div className="table-scroll">
          <table className="admin-table pv-table pv-matrix pv-roles">
            <caption className="pv-visually-hidden">Permissões por papel e área do painel</caption>
            <thead>
              <tr>
                <th scope="col">Área</th>
                {roleOrder.map((role) => (
                  <th scope="col" key={role} className="pv-center">
                    {roleLabels[role]}
                  </th>
                ))}
              </tr>
            </thead>
            {sections.map((section) => (
              <tbody key={section.key}>
                <tr className="pv-group-row">
                  <th scope="rowgroup" colSpan={roleOrder.length + 1}>
                    {section.label}
                  </th>
                </tr>
                {section.tabs.map((tab) => (
                  <tr key={tab.module}>
                    <th scope="row" className="pv-row-head">
                      {tab.label}
                    </th>
                    {roleOrder.map((role) => {
                      const level = levelOf(role, tab.module);
                      return (
                        <td key={role} className="pv-center">
                          <span className={`pv-level is-${level}`} title={`${roleLabels[role]}: ${levelText[level]}`}>
                            {level === "edit" ? <Check aria-hidden="true" /> : level === "view" ? <Eye aria-hidden="true" /> : <Minus aria-hidden="true" />}
                            <span className={level === "none" ? "pv-visually-hidden" : undefined}>{levelText[level]}</span>
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            ))}
          </table>
        </div>
      </section>
    </div>
  );
}
