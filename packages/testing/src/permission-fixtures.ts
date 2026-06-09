import type { PlatformPermission } from "@saptm/auth";
import { platformPermissions } from "@saptm/auth";

export function createPermissionSet(
  permissions: readonly PlatformPermission[] = platformPermissions,
): readonly PlatformPermission[] {
  return [...new Set(permissions)];
}

export function createPermissionSubset(
  ...permissions: readonly PlatformPermission[]
): readonly PlatformPermission[] {
  return createPermissionSet(permissions);
}
