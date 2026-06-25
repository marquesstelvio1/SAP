import { rbacBootstrapRoleTemplates } from "@saptm/database";

export const protectedRoleKeys = new Set(
  rbacBootstrapRoleTemplates.map((template: { key: string }) => template.key),
);
export const tenantAdminRoleKey = "tenant.admin";
