export type RoleGrant = {
  id: string;
  role: string;
};

export type RolePermission = {
  user_role_id: string;
  module: string;
  action: string;
  allowed: boolean;
  expires_at?: string | null;
};

type RoleModuleMap = Record<string, readonly string[]>;

const readActions = new Set(["read", "manage"]);
const writeActions = new Set([
  "create",
  "update",
  "delete",
  "approve",
  "publish",
  "homologate",
  "manage",
]);

function activePermissions(
  permissions: RolePermission[],
  roleId: string,
  now: number,
): RolePermission[] {
  return permissions.filter((permission) => {
    if (permission.user_role_id !== roleId) return false;
    if (!permission.expires_at) return true;
    const expiry = new Date(permission.expires_at).getTime();
    return Number.isFinite(expiry) && expiry > now;
  });
}

function explicitlyDenied(
  permissions: RolePermission[],
  module: string,
  actions: Set<string>,
): boolean {
  return permissions.some(
    (permission) =>
      permission.module === module &&
      actions.has(permission.action) &&
      permission.allowed === false,
  );
}

function explicitlyAllowed(
  permissions: RolePermission[],
  module: string,
  actions: Set<string>,
): boolean {
  return permissions.some(
    (permission) =>
      permission.module === module &&
      actions.has(permission.action) &&
      permission.allowed === true,
  );
}

function allModules(roleModules: RoleModuleMap): Set<string> {
  return new Set(Object.values(roleModules).flatMap((modules) => [...modules]));
}

export function computeAllowedModules(
  roleModules: RoleModuleMap,
  grants: RoleGrant[],
  permissions: RolePermission[],
  now = Date.now(),
): Set<string> {
  if (grants.length === 0) return new Set();
  if (grants.some((grant) => grant.role === "admin")) return allModules(roleModules);

  const allowed = new Set<string>(["dashboard"]);
  for (const grant of grants) {
    const baseline = roleModules[grant.role] ?? [];
    const granular = activePermissions(permissions, grant.id, now);

    if (granular.length === 0) {
      baseline.forEach((module) => allowed.add(module));
      continue;
    }

    for (const module of baseline) {
      if (module === "dashboard") continue;
      if (explicitlyDenied(granular, module, readActions)) continue;
      if (explicitlyAllowed(granular, module, readActions)) allowed.add(module);
    }
  }
  return allowed;
}

export function computeWritableModules(
  writableRoleModules: RoleModuleMap,
  grants: RoleGrant[],
  permissions: RolePermission[],
  now = Date.now(),
): Set<string> {
  if (grants.length === 0) return new Set();
  if (grants.some((grant) => grant.role === "admin")) return allModules(writableRoleModules);

  const writable = new Set<string>();
  for (const grant of grants) {
    const baseline = writableRoleModules[grant.role] ?? [];
    const granular = activePermissions(permissions, grant.id, now);

    if (granular.length === 0) {
      baseline.forEach((module) => writable.add(module));
      continue;
    }

    for (const module of baseline) {
      if (explicitlyDenied(granular, module, writeActions)) continue;
      if (explicitlyAllowed(granular, module, writeActions)) writable.add(module);
    }
  }
  return writable;
}
