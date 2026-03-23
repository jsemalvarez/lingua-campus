"use client";

import { createContext, useContext, ReactNode } from "react";

type MinimalTenant = {
  name: string;
  logoUrl: string | null;
} | null;

const TenantContext = createContext<MinimalTenant>(null);

export function TenantProvider({ children, tenant }: { children: ReactNode; tenant: MinimalTenant }) {
  return (
    <TenantContext.Provider value={tenant}>
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  return useContext(TenantContext);
}
