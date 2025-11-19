"use client";

import React, { createContext, useContext, useState } from "react";
import type { Provider } from "@/lib/api";

export type MedicalProviderInfo = Provider | null;

type ContextShape = {
  provider: MedicalProviderInfo;
  setProvider: (p: MedicalProviderInfo) => void;
};

const MedicalProviderContext = createContext<ContextShape | undefined>(undefined);

export function MedicalProviderProvider({ children }: { children: React.ReactNode }) {
  const [provider, setProvider] = useState<MedicalProviderInfo>(null);
  return (
    <MedicalProviderContext.Provider value={{ provider, setProvider }}>
      {children}
    </MedicalProviderContext.Provider>
  );
}

export function useMedicalProvider() {
  const ctx = useContext(MedicalProviderContext);
  if (!ctx) throw new Error("useMedicalProvider must be used within MedicalProviderProvider");
  return ctx;
}

export default MedicalProviderProvider;
