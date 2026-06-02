export const platformPermissions = [
  "tenant.manage",
  "identity.user.invite",
  "identity.role.assign",
  "integration.api_key.manage",
  "audit.read",
  "report.export",
] as const;

export type PlatformPermission = (typeof platformPermissions)[number];
