"use client";

import { createContext, type ReactNode, useContext } from "react";

type TenantContextValue = {
  organizationId: string | undefined;
};

const TenantContext = createContext<TenantContextValue>({
  organizationId: undefined,
});

export function useTenantContext(): TenantContextValue {
  return useContext(TenantContext);
}

export function QueryTenantBoundary({
  organizationId,
  children,
}: {
  organizationId: string | undefined;
  children: ReactNode;
}) {
  return <TenantContext.Provider value={{ organizationId }}>{children}</TenantContext.Provider>;
}
