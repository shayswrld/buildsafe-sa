"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { DEFAULT_PLATFORM_CONFIG, FeeConfig } from "@/lib/config";

export type PersonaRole = "CLIENT" | "BUILDER" | "ADMIN";

export interface CertificationDTO {
  id: string;
  body: string;
  registrationNumber: string;
  tradeCategory: string;
  status: string;
  registryVerifyUrl?: string | null;
  expiresAt?: string | null;
  notes?: string | null;
}

export interface BuilderCompanyDTO {
  id: string;
  name: string;
  tradingName?: string | null;
  cipcRegistrationNumber: string;
  cipcStatus: string;
  cidbGrading?: string | null;
  nhbrcRegistrationNumber?: string | null;
  ownerWorkerProfileId: string;
  roster?: WorkerProfileDTO[];
}

export interface WorkerProfileDTO {
  id: string;
  userId: string;
  companyId?: string | null;
  roleInCompany?: string;
  vettingTier: string;
  saIdMasked: string;
  citizenshipStatus: string;
  selfieVerified: boolean;
  identityProviderRef?: string | null;
  popiaConsentSigned: boolean;
  huruVoucherCode?: string | null;
  huruFeePaid: boolean;
  sapsStatus: string;
  sapsCertificateRef?: string | null;
  sapsClearedAt?: string | null;
  sapsExpiresAt?: string | null;
  tradesJson: string;
  nearestHardwareHub: string;
  yearsExperience: number;
  bio: string;
  walletBalanceZar: number;
  totalPaidOutZar: number;
  completedJobsCount: number;
  certifications: CertificationDTO[];
  company?: BuilderCompanyDTO | null;
  user?: PersonaUserDTO;
}

export interface PersonaUserDTO {
  id: string;
  name: string;
  phone: string;
  email?: string | null;
  role: "HOMEOWNER" | "WORKER" | "ADMIN" | "DUAL" | string;
  suburb: string;
  city: string;
  avatarUrl?: string | null;
  ratingAvg: number;
  ratingCount: number;
  workerProfile?: WorkerProfileDTO | null;
  postedJobsCount?: number;
  isDualRole?: boolean;
}

export interface RegisterUserData {
  name: string;
  phone: string;
  suburb: string;
  city?: string;
  email?: string;
  rolePreference: "CLIENT" | "BUILDER" | "DUAL";
  trade?: string;
}

export interface PersonaContextValue {
  config: FeeConfig;
  personas: PersonaUserDTO[];
  clearedCrewPool: WorkerProfileDTO[];
  currentUser: PersonaUserDTO | null;
  activeRole: PersonaRole;
  availableRoles: PersonaRole[];
  isDualRole: boolean;
  setCurrentUserId: (id: string) => void;
  setActiveRole: (role: PersonaRole) => void;
  toggleRole: () => void;
  login: (userId: string, role?: PersonaRole) => void;
  logout: () => void;
  register: (data: RegisterUserData) => Promise<PersonaUserDTO>;
  refreshBootstrap: () => Promise<void>;
  loading: boolean;
}

export function computeAvailableRoles(user: PersonaUserDTO | null): PersonaRole[] {
  if (!user) return ["CLIENT", "BUILDER"];
  if (user.role === "ADMIN") return ["ADMIN", "CLIENT", "BUILDER"];
  if (user.role === "DUAL" || user.isDualRole) return ["CLIENT", "BUILDER"];
  if (user.role === "HOMEOWNER") {
    return user.workerProfile ? ["CLIENT", "BUILDER"] : ["CLIENT"];
  }
  if (user.role === "WORKER") {
    return user.postedJobsCount && user.postedJobsCount > 0
      ? ["BUILDER", "CLIENT"]
      : ["BUILDER"];
  }
  return ["CLIENT", "BUILDER"];
}

export function inferDefaultRole(user: PersonaUserDTO | null): PersonaRole {
  if (!user) return "CLIENT";
  if (user.role === "ADMIN") return "ADMIN";
  if (user.role === "WORKER") return "BUILDER";
  return "CLIENT";
}

const STORAGE_PERSONA_KEY = "buildsafe_active_persona_id";
const STORAGE_ROLE_KEY = "buildsafe_active_role";

const DEFAULT_SEED_PERSONAS: PersonaUserDTO[] = [
  {
    id: "user_homeowner_lerato",
    name: "Lerato Mokoena",
    phone: "+27825551020",
    email: "lerato.m@example.co.za",
    role: "HOMEOWNER",
    suburb: "Fourways",
    city: "Johannesburg",
    avatarUrl: "LM",
    ratingAvg: 4.95,
    ratingCount: 4,
    postedJobsCount: 3,
    isDualRole: false,
    workerProfile: null,
  },
  {
    id: "user_worker_sipho",
    name: "Sipho Dlamini",
    phone: "+27723104481",
    email: "sipho.d@example.co.za",
    role: "WORKER",
    suburb: "Cosmo City / Fourways",
    city: "Johannesburg",
    avatarUrl: "SD",
    ratingAvg: 4.95,
    ratingCount: 14,
    postedJobsCount: 0,
    isDualRole: false,
    workerProfile: {
      id: "wp_sipho",
      userId: "user_worker_sipho",
      roleInCompany: "DIRECTOR_LEAD",
      vettingTier: "TIER_3_COC_CERTIFIED",
      saIdMasked: "860414*****085",
      citizenshipStatus: "SA_CITIZEN",
      selfieVerified: true,
      popiaConsentSigned: true,
      huruFeePaid: true,
      sapsStatus: "CLEARED",
      sapsCertificateRef: "SAPS-CRC-2026-841209",
      tradesJson: JSON.stringify(["PLUMBING", "TILING"]),
      nearestHardwareHub: "Builders Warehouse Fourways (Johannesburg)",
      yearsExperience: 11,
      bio: "Licensed PIRB plumber & bathroom renovation tiler.",
      walletBalanceZar: 2640,
      totalPaidOutZar: 28450,
      completedJobsCount: 14,
      certifications: [
        {
          id: "cert_pirb_1",
          body: "PIRB",
          registrationNumber: "PIRB-44819-ZA",
          tradeCategory: "PLUMBING",
          status: "VERIFIED",
          registryVerifyUrl: "https://www.pirb.co.za/verify-a-plumber/",
        },
      ],
    },
  },
  {
    id: "user_dual_johan",
    name: "Johan Nel",
    phone: "+27823334455",
    email: "johan.nel@example.co.za",
    role: "DUAL",
    suburb: "Randburg",
    city: "Johannesburg",
    avatarUrl: "JN",
    ratingAvg: 4.9,
    ratingCount: 8,
    postedJobsCount: 2,
    isDualRole: true,
    workerProfile: {
      id: "wp_johan",
      userId: "user_dual_johan",
      roleInCompany: "INDEPENDENT_ARTISAN",
      vettingTier: "TIER_3_COC_CERTIFIED",
      saIdMasked: "820512*****081",
      citizenshipStatus: "SA_CITIZEN",
      selfieVerified: true,
      popiaConsentSigned: true,
      huruFeePaid: true,
      sapsStatus: "CLEARED",
      sapsCertificateRef: "SAPS-CRC-2026-771920",
      tradesJson: JSON.stringify(["ELECTRICAL", "HANDYMAN"]),
      nearestHardwareHub: "Builders Warehouse Northriding (Randburg)",
      yearsExperience: 10,
      bio: "Master Electrician and general property renovator.",
      walletBalanceZar: 3200,
      totalPaidOutZar: 21500,
      completedJobsCount: 11,
      certifications: [
        {
          id: "cert_johan_ecb",
          body: "ECB_WIREMAN",
          registrationNumber: "ECB-90214-GP",
          tradeCategory: "ELECTRICAL",
          status: "VERIFIED",
          registryVerifyUrl: "https://ecb.org.za/verify-registered-person/",
        },
      ],
    },
  },
  {
    id: "user_admin_owner",
    name: "Platform Founder (Admin)",
    phone: "+27820000001",
    email: "founder@buildsafesa.co.za",
    role: "ADMIN",
    suburb: "Sandton",
    city: "Johannesburg",
    avatarUrl: "PF",
    ratingAvg: 5.0,
    ratingCount: 0,
    postedJobsCount: 0,
    isDualRole: false,
    workerProfile: null,
  },
];

const PersonaContext = createContext<PersonaContextValue>({
  config: DEFAULT_PLATFORM_CONFIG,
  personas: DEFAULT_SEED_PERSONAS,
  clearedCrewPool: [],
  currentUser: DEFAULT_SEED_PERSONAS[0],
  activeRole: "CLIENT",
  availableRoles: ["CLIENT"],
  isDualRole: false,
  setCurrentUserId: () => {},
  setActiveRole: () => {},
  toggleRole: () => {},
  login: () => {},
  logout: () => {},
  register: async () => DEFAULT_SEED_PERSONAS[0],
  refreshBootstrap: async () => {},
  loading: false,
});

export function PersonaProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<FeeConfig>(DEFAULT_PLATFORM_CONFIG);
  const [personas, setPersonas] = useState<PersonaUserDTO[]>(DEFAULT_SEED_PERSONAS);
  const [clearedCrewPool, setClearedCrewPool] = useState<WorkerProfileDTO[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>("user_homeowner_lerato");
  const [activeRole, setActiveRoleState] = useState<PersonaRole>("CLIENT");
  const [loading, setLoading] = useState<boolean>(true);

  const refreshBootstrap = useCallback(async () => {
    try {
      const res = await fetch("/api/bootstrap", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      if (data.config) setConfig(data.config);
      if (Array.isArray(data.personas) && data.personas.length > 0) {
        setPersonas((prev) => {
          const fetchedIds = new Set(data.personas.map((p: PersonaUserDTO) => p.id));
          const customLocalUsers = prev.filter(
            (p) => !fetchedIds.has(p.id) && p.id.startsWith("user_client_") || p.id.startsWith("user_builder_") || p.id.startsWith("user_dual_")
          );
          return [...data.personas, ...customLocalUsers];
        });
      }
      if (Array.isArray(data.clearedCrewPool)) {
        setClearedCrewPool(data.clearedCrewPool);
      }
    } catch (err) {
      console.error("Bootstrap fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedPersona = localStorage.getItem(STORAGE_PERSONA_KEY);
      const savedRole = localStorage.getItem(STORAGE_ROLE_KEY) as PersonaRole | null;
      if (savedPersona) {
        setSelectedId(savedPersona);
      }
      if (
        savedRole &&
        (savedRole === "CLIENT" || savedRole === "BUILDER" || savedRole === "ADMIN")
      ) {
        setActiveRoleState(savedRole);
      }
    }
    refreshBootstrap();
  }, [refreshBootstrap]);

  const currentUser =
    selectedId !== null
      ? personas.find((p) => p.id === selectedId) ?? null
      : null;

  const availableRoles = computeAvailableRoles(currentUser);
  const isDualRole =
    availableRoles.includes("CLIENT") && availableRoles.includes("BUILDER");

  const setActiveRole = (role: PersonaRole) => {
    setActiveRoleState(role);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_ROLE_KEY, role);
    }
  };

  const setCurrentUserId = (id: string) => {
    setSelectedId(id);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_PERSONA_KEY, id);
    }
    const matched = personas.find((p) => p.id === id);
    if (matched) {
      const allowed = computeAvailableRoles(matched);
      if (!allowed.includes(activeRole)) {
        const nextRole = inferDefaultRole(matched);
        setActiveRole(nextRole);
      }
    }
  };

  const toggleRole = () => {
    const nextRole: PersonaRole = activeRole === "CLIENT" ? "BUILDER" : "CLIENT";
    setActiveRole(nextRole);
  };

  const login = (userId: string, role?: PersonaRole) => {
    setSelectedId(userId);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_PERSONA_KEY, userId);
    }
    const user = personas.find((p) => p.id === userId);
    const targetRole = role || inferDefaultRole(user ?? null);
    setActiveRole(targetRole);
  };

  const logout = () => {
    setSelectedId(null);
    setActiveRole("CLIENT");
    if (typeof window !== "undefined") {
      localStorage.removeItem(STORAGE_PERSONA_KEY);
      localStorage.removeItem(STORAGE_ROLE_KEY);
    }
  };

  const register = async (data: RegisterUserData): Promise<PersonaUserDTO> => {
    const isDual = data.rolePreference === "DUAL";
    const isWorker = data.rolePreference === "BUILDER" || isDual;
    const prefix = isDual ? "user_dual_" : data.rolePreference === "BUILDER" ? "user_builder_" : "user_client_";
    const newId = `${prefix}${Date.now()}`;
    const initials = data.name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

    const workerProfile: WorkerProfileDTO | null = isWorker
      ? {
          id: `wp_${newId}`,
          userId: newId,
          roleInCompany: "INDEPENDENT_ARTISAN",
          vettingTier: "TIER_1_BROWSE_ONLY",
          saIdMasked: "920101*****089",
          citizenshipStatus: "SA_CITIZEN",
          selfieVerified: false,
          popiaConsentSigned: true,
          huruFeePaid: false,
          sapsStatus: "UNSTARTED",
          tradesJson: JSON.stringify(data.trade ? [data.trade] : ["GENERAL_BUILDING"]),
          nearestHardwareHub: `Builders Warehouse (${data.suburb})`,
          yearsExperience: 3,
          bio: `Registered artisan providing professional ${data.trade || "contracting"} services.`,
          walletBalanceZar: 0,
          totalPaidOutZar: 0,
          completedJobsCount: 0,
          certifications: [],
        }
      : null;

    const newUser: PersonaUserDTO = {
      id: newId,
      name: data.name,
      phone: data.phone,
      email: data.email || null,
      role: isDual ? "DUAL" : data.rolePreference === "BUILDER" ? "WORKER" : "HOMEOWNER",
      suburb: data.suburb,
      city: data.city || "Johannesburg",
      avatarUrl: initials || "BS",
      ratingAvg: 5.0,
      ratingCount: 0,
      postedJobsCount: 0,
      isDualRole: isDual,
      workerProfile,
    };

    setPersonas((prev) => [newUser, ...prev]);
    login(newUser.id, data.rolePreference === "BUILDER" ? "BUILDER" : "CLIENT");
    return newUser;
  };

  return (
    <PersonaContext.Provider
      value={{
        config,
        personas,
        clearedCrewPool,
        currentUser,
        activeRole,
        availableRoles,
        isDualRole,
        setCurrentUserId,
        setActiveRole,
        toggleRole,
        login,
        logout,
        register,
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

