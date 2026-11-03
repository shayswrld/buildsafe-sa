
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
  company?: any;
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

export const DEFAULT_SEED_PERSONAS: PersonaUserDTO[] = [
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

export const DEFAULT_SEED_CREW_POOL: WorkerProfileDTO[] = [
  DEFAULT_SEED_PERSONAS[1].workerProfile!,
  DEFAULT_SEED_PERSONAS[2].workerProfile!,
];
