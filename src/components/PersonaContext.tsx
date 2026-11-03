"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { DEFAULT_PLATFORM_CONFIG, FeeConfig } from "@/lib/config";
import { DEFAULT_SEED_PERSONAS } from "@/lib/seed-personas";

export { DEFAULT_SEED_PERSONAS };

export type PersonaRole = "CLIENT" | "BUILDER" | "ADMIN";

interface CertificationDTO {
  id: string;
  body: string;
  registrationNumber: string;
  tradeCategory: string;
  status: string;
  registryVerifyUrl?: string | null;
  expiresAt?: string | null;
  notes?: string | null;
}

interface BuilderCompanyDTO {
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

interface SignupCredentialsData {
  name: string;
  phone: string;
  email?: string;
  password: string;
  accountType: "CLIENT" | "BUILDER" | "DUAL";
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
  loginWithCredentials: (
    identifier: string,
    password: string
  ) => Promise<{ success: boolean; role: string; profileCompleted: boolean }>;
  devQuickLogin: (userId: string, role?: PersonaRole) => Promise<void>;
  signupWithCredentials: (data: SignupCredentialsData) => Promise<any>;
  logout: () => void;
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

const PersonaContext = createContext<PersonaContextValue>({
  config: DEFAULT_PLATFORM_CONFIG,
  personas: DEFAULT_SEED_PERSONAS,
  clearedCrewPool: [],
  currentUser: null,
  activeRole: "CLIENT",
  availableRoles: ["CLIENT"],
  isDualRole: false,
  setCurrentUserId: () => {},
  setActiveRole: () => {},
  toggleRole: () => {},
  login: () => {},
  loginWithCredentials: async () => ({ success: true, role: "CLIENT", profileCompleted: true }),
  devQuickLogin: async () => {},
  signupWithCredentials: async () => {},
  logout: () => {},
  refreshBootstrap: async () => {},
  loading: false,
});

export function PersonaProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<FeeConfig>(DEFAULT_PLATFORM_CONFIG);
  const [personas, setPersonas] = useState<PersonaUserDTO[]>(DEFAULT_SEED_PERSONAS);
  const [clearedCrewPool, setClearedCrewPool] = useState<WorkerProfileDTO[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeRole, setActiveRoleState] = useState<PersonaRole>("CLIENT");
  const [loading, setLoading] = useState<boolean>(true);

  const refreshBootstrap = useCallback(async () => {
    try {
      // 1. Fetch bootstrap configuration & personas
      const res = await fetch("/api/bootstrap", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        if (data.config) setConfig(data.config);
        if (Array.isArray(data.personas) && data.personas.length > 0) {
          setPersonas(data.personas);
        }
        if (Array.isArray(data.clearedCrewPool)) {
          setClearedCrewPool(data.clearedCrewPool);
        }
      }

      // 2. Fetch authenticated session user from cookie if available
      const meRes = await fetch("/api/auth/me", { cache: "no-store" });
      if (meRes.ok) {
        const meData = await meRes.json();
        if (meData.authenticated && meData.user) {
          setSelectedId(meData.user.id);
          if (typeof window !== "undefined") {
            localStorage.setItem(STORAGE_PERSONA_KEY, meData.user.id);
          }
          const role = meData.user.role === "WORKER" ? "BUILDER" : meData.user.role === "ADMIN" ? "ADMIN" : "CLIENT";
          setActiveRoleState(role);
        } else {
          // Explicitly unauthenticated: ensure selectedId is null and clear stale storage
          setSelectedId(null);
          if (typeof window !== "undefined") {
            localStorage.removeItem(STORAGE_PERSONA_KEY);
            localStorage.removeItem(STORAGE_ROLE_KEY);
          }
        }
      } else {
        setSelectedId(null);
      }
    } catch (err) {
      console.error("Bootstrap fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
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

  const loginWithCredentials = async (identifier: string, password: string) => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier, password }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Login failed");
    }

    login(data.user.id, data.user.role === "WORKER" ? "BUILDER" : data.user.role === "ADMIN" ? "ADMIN" : "CLIENT");
    await refreshBootstrap();

    return {
      success: true,
      role: data.user.role,
      profileCompleted: Boolean(data.user.profileCompleted),
    };
  };

  const devQuickLogin = async (userId: string, role?: PersonaRole) => {
    const matched = personas.find((p) => p.id === userId);
    const identifier = matched?.phone || userId;
    await loginWithCredentials(identifier, "BuildSafe2026!");
    if (role) {
      setActiveRole(role);
    }
  };

  const signupWithCredentials = async (data: SignupCredentialsData) => {
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const body = await res.json();
    if (!res.ok) {
      throw new Error(body.error || "Registration failed");
    }

    login(body.user.id, data.accountType === "BUILDER" ? "BUILDER" : "CLIENT");
    await refreshBootstrap();
    return body;
  };

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (e) {
      // ignore
    }
    setSelectedId(null);
    setActiveRole("CLIENT");
    if (typeof window !== "undefined") {
      localStorage.removeItem(STORAGE_PERSONA_KEY);
      localStorage.removeItem(STORAGE_ROLE_KEY);
      window.location.href = "/login";
    }
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
        loginWithCredentials,
        devQuickLogin,
        signupWithCredentials,
        logout,
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
