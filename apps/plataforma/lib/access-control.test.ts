import { describe, expect, it } from "vitest";
import {
  computeAllowedModules,
  computeWritableModules,
  type RoleGrant,
  type RolePermission,
} from "./access-control";

const roleAccess = {
  admin: ["dashboard", "pilotos", "financeiro"],
  organization: ["dashboard", "pilotos", "financeiro"],
  finance: ["dashboard", "financeiro"],
} as const;

const grants: RoleGrant[] = [
  { id: "role-1", role: "finance" },
];

describe("module access evaluation", () => {
  it("fails closed without an active role", () => {
    expect(computeAllowedModules(roleAccess, [], [])).toEqual(new Set());
  });

  it("uses the role baseline when no granular permissions are configured", () => {
    expect(computeAllowedModules(roleAccess, grants, [])).toEqual(new Set(["dashboard", "financeiro"]));
  });

  it("uses granular permissions as a whitelist and lets explicit denial win", () => {
    const permissions: RolePermission[] = [
      { user_role_id: "role-1", module: "financeiro", action: "read", allowed: true },
      { user_role_id: "role-1", module: "financeiro", action: "update", allowed: true },
      { user_role_id: "role-1", module: "financeiro", action: "update", allowed: false },
    ];

    expect(computeAllowedModules(roleAccess, grants, permissions)).toEqual(
      new Set(["dashboard", "financeiro"]),
    );
    expect(computeWritableModules(roleAccess, grants, permissions)).toEqual(new Set());
  });

  it("keeps global administrators unrestricted", () => {
    expect(
      computeAllowedModules(
        roleAccess,
        [{ id: "admin-role", role: "admin" }],
        [{ user_role_id: "admin-role", module: "pilotos", action: "read", allowed: false }],
      ),
    ).toEqual(new Set(["dashboard", "pilotos", "financeiro"]));
  });
});
