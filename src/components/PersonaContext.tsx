"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { DEFAULT_PLATFORM_CONFIG, FeeConfig } from "@/lib/config";

export interface CertificationDTO {
  id: string;
  body: string;
  registrationNumber: string;
  tradeCategory: string;
  status: string;
  notes?: string | null;
}

export interface WorkerProfileDTO {
  id: string;
  userId: string;
  vettingTier: string;
  saIdMasked: string;
  citizenshipStatus: string;
  selfieVerified: boolean;
  popiaConsentSigned: boolean;
  huruVoucherCode?: string | null;
  huruFeePaid: boolean;
  sapsStatus: string;
  sapsCertificateRef?: string | null;
  tradesJson: string;
  nearestHardwareHub: string;
  yearsExperience: number;
  bio: string;
  walletBalanceZar: number;
  totalPaidOutZar: number;
  completedJobsCount: number;
  certifications: CertificationDTO[];
  user?: PersonaUserDTO;
}

export interface PersonaUserDTO {
  id: string;
  name: string;
  phone: string;
  email?: string | null;
  role: "HOMEOWNER" | "WORKER" | "ADMIN" | string;
  suburb: string;
  city: string;
  avatarUrl?: string | null;
  ratingAvg: number;
  ratingCount: number;
  workerProfile?: WorkerProfileDTO | null;
}

interface PersonaContextValue {
  config: FeeConfig;
  personas: PersonaUserDTO[];
  clearedCrewPool: WorkerProfileDTO[];
  currentUser: PersonaUserDTO | null;
  setCurrentUserId: (id: string) => void;
  refreshBootstrap: () => Promise<void>;
  loading: boolean;
}

const PersonaContext = createContext<PersonaContextValue>({
  config: DEFAULT_PLATFORM_CONFIG,
  personas: [],
  clearedCrewPool: [],
  currentUser: null,
  setCurrentUserId: () => {},
  refreshBootstrap: async () => {},
  loading: true,
});

const STORAGE_KEY = "buildsafe_active_persona_id";

export function PersonaProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<FeeConfig>(DEFAULT_PLATFORM_CONFIG);
  const [personas, setPersonas] = useState<PersonaUserDTO[]>([]);
  const [clearedCrewPool, setClearedCrewPool] = useState<WorkerProfileDTO[]>([]);
  const [selectedId, setSelectedId] = useState<string>("user_homeowner_lerato");
  const [loading, setLoading] = useState<boolean>(true);

  const refreshBootstrap = useCallback(async () => {
    try {
      const res = await fetch("/api/bootstrap", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      if (data.config) setConfig(data.config);
      if (Array.isArray(data.personas)) setPersonas(data.personas);
      if (Array.isArray(data.clearedCrewPool))
        setClearedCrewPool(data.clearedCrewPool);
    } catch (err) {
      console.error("Bootstrap fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const saved =
      typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
    if (saved) {
      setSelectedId(saved);
    }
    refreshBootstrap();
  }, [refreshBootstrap]);

  const setCurrentUserId = (id: string) => {
    setSelectedId(id);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, id);
    }
  };

  const currentUser =
    personas.find((p) => p.id === selectedId) ?? personas[0] ?? null;

  return (
    <PersonaContext.Provider
      value={{
        config,
        personas,
        clearedCrewPool,
        currentUser,
        setCurrentUserId,
        refreshBootstrap,
        loading,
      }}
    >
      {children}
    </PersonaContext.Provider>
  );
}

export function usePersona() {
  return useContext(PersonaContext);
}
