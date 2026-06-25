import { BadRequestException } from "@nestjs/common";

import { protectedRoleKeys } from "./admin.constants.js";

export function assertCustomRoleKey(roleKey: string): void {
  if (protectedRoleKeys.has(roleKey)) {
    throw new BadRequestException("admin.role_key_reserved");
  }

  if (!roleKey.startsWith("tenant.custom.")) {
    throw new BadRequestException("admin.custom_role_key_must_start_with_tenant_custom");
  }
}

export function assertMutableRole(roleKey: string): void {
  if (protectedRoleKeys.has(roleKey)) {
    throw new BadRequestException("admin.role_template_is_protected");
  }
}

export function arraysEqualIgnoringOrder(
  first: readonly string[],
  second: readonly string[],
): boolean {
  if (first.length !== second.length) {
    return false;
  }

  const firstSet = new Set(first);

  return second.every((value) => firstSet.has(value));
}

export async function assertNotRemovingLastActiveTenantAdmin(
  findActiveAdminMemberships: () => Promise<{ id: string }[]>,
  targetMembershipId: string,
): Promise<void> {
  const activeAdminMemberships = await findActiveAdminMemberships();

  if (
    activeAdminMemberships.length === 1 &&
    activeAdminMemberships.at(0)?.id === targetMembershipId
  ) {
    throw new BadRequestException("admin.last_active_tenant_admin_protected");
  }
}
